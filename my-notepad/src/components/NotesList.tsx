import { useEffect, useRef, useCallback, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as CapSpeechRecognition } from '@capacitor-community/speech-recognition';
import { useStore } from '../store/useStore';
import * as backendApi from '../lib/backend-api';
import { processNote, type NoteInsight } from '../lib/openai-api';
import { cn } from '../lib/utils';
import { Sparkles, ChevronDown, ChevronUp, Mic } from 'lucide-react';
import { useIsDemo } from '../contexts/DemoContext';

const DEBOUNCE_MS = 800;
const DEMO_MAX_CHARS = 400;

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}

const getSpeechRecognition = (): (new () => SpeechRecognitionLike) | undefined => {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

const NotesList = () => {
  const isDemo = useIsDemo();
  const backendUrl = isDemo ? '' : (import.meta.env.VITE_BACKEND_URL?.trim() || '');
  const { whiteboard, setWhiteboardContent, addTodo } = useStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptChunksRef = useRef<string[]>([]);
  const nativeListenersRef = useRef<{ remove: () => Promise<void> }[]>([]);
  const userStoppedRef = useRef(false);
  const whiteboardRef = useRef(whiteboard);
  const webLastResultIndexRef = useRef(-1);
  const webEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nativeEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [insight, setInsight] = useState<NoteInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [insightOpen, setInsightOpen] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [nativeSpeechAvailable, setNativeSpeechAvailable] = useState<boolean | null>(null);
  const [creatingTodos, setCreatingTodos] = useState(false);
  const [todosCreated, setTodosCreated] = useState(0);
  const [voiceLanguage, setVoiceLanguage] = useState<'es-ES' | 'en-US'>(() =>
    typeof navigator !== 'undefined' && navigator.language.startsWith('es') ? 'es-ES' : 'en-US'
  );
  const [demoProcessUsed, setDemoProcessUsed] = useState(false);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const h = el.scrollHeight;
    if (typeof h === 'number' && Number.isFinite(h) && h >= 0) {
      el.style.height = 'auto';
      el.style.height = `${h}px`;
    }
  }, [whiteboard]);

  const syncToBackend = useCallback(
    (content: string) => {
      if (!backendUrl) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        backendApi.saveWhiteboard(content).catch(() => {
          // Optionally show error; for now fail silently on save
        });
      }, DEBOUNCE_MS);
    },
    []
  );

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    if (!isDemo) return;
    if (whiteboard.length > DEMO_MAX_CHARS) {
      setWhiteboardContent(whiteboard.slice(0, DEMO_MAX_CHARS));
    }
  }, [isDemo, whiteboard.length, setWhiteboardContent]);

  whiteboardRef.current = whiteboard;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setNativeSpeechAvailable(false);
      return;
    }
    CapSpeechRecognition.available()
      .then(({ available }) => setNativeSpeechAvailable(available))
      .catch(() => setNativeSpeechAvailable(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (isDemo && value.length > DEMO_MAX_CHARS) value = value.slice(0, DEMO_MAX_CHARS);
    setWhiteboardContent(value);
    syncToBackend(value);
  };

  const handleProcessFullText = async () => {
    const content = whiteboard.trim();
    if (!content || insightLoading) return;
    if (isDemo && demoProcessUsed) return;
    setInsightError(null);
    setInsightLoading(true);
    setInsightOpen(true);
    setTodosCreated(0);
    if (isDemo) setDemoProcessUsed(true);

    const titleFromContent = (text: string) => {
      const firstLine = text.trim().split(/\n/)[0]?.trim() || '';
      return firstLine.slice(0, 100) || 'Note';
    };

    // Save the full note to the database as soon as the user clicks "Process with AI"
    let noteId: string | null = null;
    if (backendUrl) {
      try {
        const note = await backendApi.createNote({
          title: titleFromContent(content),
          content,
        });
        noteId = note.id;
      } catch {
        // continue; todos won't be linked to a note
      }
    }

    processNote(content)
      .then((result) => {
        setInsight(result);
        setWhiteboardContent('');
        syncToBackend('');
        if (result.actionItems.length === 0) return;
        setCreatingTodos(true);
        const createTodosFromActionItems = async () => {
          let created = 0;
          const reversed = [...result.actionItems].reverse();
          if (backendUrl) {
            const areaId = result.areaId ?? undefined;
            for (const text of reversed) {
              if (!text.trim()) continue;
              try {
                const todo = await backendApi.createTodo({
                  text: text.trim(),
                  color: 'cyan',
                  areaId: areaId ?? undefined,
                  dueDate: null,
                  noteId: noteId ?? undefined,
                });
                addTodo(todo);
                created += 1;
              } catch {
                // skip failed item
              }
            }
          } else {
            const areaId = result.areaId ?? undefined;
            const areaName = areaId ? undefined : 'Ideas / thoughts';
            for (const text of reversed) {
              if (!text.trim()) continue;
              const now = Date.now();
              addTodo({
                id: crypto.randomUUID(),
                text: text.trim(),
                completed: false,
                color: 'cyan',
                category: areaName ?? 'Ideas / thoughts',
                areaId: areaId ?? null,
                areaName: areaName ?? 'Ideas / thoughts',
                areaIcon: 'lightbulb',
                dueDate: null,
                createdAt: now,
                updatedAt: now,
              });
              created += 1;
            }
          }
          setTodosCreated(created);
          setCreatingTodos(false);
        };
        createTodosFromActionItems();
      })
      .catch((e) => setInsightError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setInsightLoading(false));
  };

  const handleVoiceToggle = useCallback(async () => {
    setVoiceError(null);

    const isNative = Capacitor.isNativePlatform();

    if (isNative && nativeSpeechAvailable) {
      if (isRecording) {
        userStoppedRef.current = true;
        try {
          await CapSpeechRecognition.stop();
        } catch {
          // ignore
        }
        setIsRecording(false);
        return;
      }
      userStoppedRef.current = false;
      transcriptChunksRef.current = [];
      try {
        await CapSpeechRecognition.requestPermissions();
        await CapSpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
          if (data.matches?.length) {
            const last = String(data.matches[data.matches.length - 1] ?? '').trim();
            transcriptChunksRef.current = last ? [last] : [];
          }
        }).then((h) => nativeListenersRef.current.push(h));
        await CapSpeechRecognition.addListener('listeningState', (data: { status: string }) => {
          if (data.status !== 'stopped') return;
          if (nativeEndTimeoutRef.current) clearTimeout(nativeEndTimeoutRef.current);
          nativeEndTimeoutRef.current = setTimeout(() => {
            nativeEndTimeoutRef.current = null;
            if (userStoppedRef.current) {
              nativeEndTimeoutRef.current = setTimeout(() => {
                nativeEndTimeoutRef.current = null;
                const transcript = transcriptChunksRef.current.filter(Boolean).join(' ');
                transcriptChunksRef.current = [];
                const currentContent = whiteboardRef.current;
                if (transcript) {
                  const sep = currentContent.trim() ? '\n\n' : '';
                  const next = currentContent + sep + transcript;
                  setWhiteboardContent(next);
                  syncToBackend(next);
                }
                CapSpeechRecognition.removeAllListeners();
                nativeListenersRef.current = [];
                setIsRecording(false);
              }, 800);
              return;
            }
            const transcript = transcriptChunksRef.current.filter(Boolean).join(' ');
            transcriptChunksRef.current = [];
            const currentContent = whiteboardRef.current;
            if (transcript) {
              const sep = currentContent.trim() ? '\n\n' : '';
              const next = currentContent + sep + transcript;
              setWhiteboardContent(next);
              syncToBackend(next);
            }
            transcriptChunksRef.current = [];
            CapSpeechRecognition.start({ language: voiceLanguage, partialResults: true, popup: false }).catch(() => {
              setIsRecording(false);
              CapSpeechRecognition.removeAllListeners();
              nativeListenersRef.current = [];
            });
          }, 120);
        }).then((h) => nativeListenersRef.current.push(h));
        await CapSpeechRecognition.start({ language: voiceLanguage, partialResults: true, popup: false });
        setIsRecording(true);
      } catch (err) {
        setVoiceError(err instanceof Error ? err.message : 'Voice recognition failed');
        setIsRecording(false);
        await CapSpeechRecognition.removeAllListeners();
        nativeListenersRef.current = [];
      }
      return;
    }

    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      setVoiceError('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (isRecording && recognitionRef.current) {
      userStoppedRef.current = true;
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    userStoppedRef.current = false;
    transcriptChunksRef.current = [];
    webLastResultIndexRef.current = -1;
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = voiceLanguage;

    recognition.onresult = (e: unknown) => {
      const ev = e as { results: { length: number; [i: number]: { isFinal: boolean; [j: number]: { transcript: string } } } };
      if (!ev?.results) return;
      const lastIdx = webLastResultIndexRef.current;
      for (let i = lastIdx + 1; i < ev.results.length; i++) {
        const result = ev.results[i];
        if (result?.isFinal && result[0]?.transcript) {
          transcriptChunksRef.current.push(String(result[0].transcript).trim());
          webLastResultIndexRef.current = i;
        }
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      if (webEndTimeoutRef.current) clearTimeout(webEndTimeoutRef.current);
      webEndTimeoutRef.current = setTimeout(() => {
        webEndTimeoutRef.current = null;
        if (recognitionRef.current !== recognition) return;
        if (userStoppedRef.current) {
          webEndTimeoutRef.current = setTimeout(() => {
            webEndTimeoutRef.current = null;
            const transcript = transcriptChunksRef.current.filter(Boolean).join(' ');
            transcriptChunksRef.current = [];
            const currentContent = whiteboardRef.current;
            if (transcript) {
              const sep = currentContent.trim() ? '\n\n' : '';
              const next = currentContent + sep + transcript;
              setWhiteboardContent(next);
              syncToBackend(next);
            }
            recognitionRef.current = null;
            setIsRecording(false);
            webLastResultIndexRef.current = -1;
          }, 800);
          return;
        }
        const transcript = transcriptChunksRef.current.filter(Boolean).join(' ');
        transcriptChunksRef.current = [];
        const currentContent = whiteboardRef.current;
        if (transcript) {
          const sep = currentContent.trim() ? '\n\n' : '';
          const next = currentContent + sep + transcript;
          setWhiteboardContent(next);
          syncToBackend(next);
        }
        recognitionRef.current = recognition;
        webLastResultIndexRef.current = -1;
        if (recognitionRef.current === recognition && !userStoppedRef.current) {
          try {
            recognition.start();
          } catch {
            recognitionRef.current = null;
            setIsRecording(false);
          }
        }
      }, 120);
    };

    recognition.onerror = (e: { error: string }) => {
      if (e.error === 'not-allowed') {
        setVoiceError('Microphone access denied. Allow mic in your browser settings.');
      } else if (e.error === 'network' || e.error === 'network-error') {
        setVoiceError('Voice to text works best in Chrome or Edge. Other browsers may not support it or need a stable internet connection.');
      } else if (e.error !== 'aborted') {
        setVoiceError(e.error || 'Voice recognition error');
      }
      recognitionRef.current = null;
      setIsRecording(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (err) {
      setVoiceError(err instanceof Error ? err.message : 'Could not start recording');
      setIsRecording(false);
    }
  }, [isRecording, whiteboard, setWhiteboardContent, syncToBackend, nativeSpeechAvailable, voiceLanguage]);

  useEffect(() => () => {
    if (webEndTimeoutRef.current) {
      clearTimeout(webEndTimeoutRef.current);
      webEndTimeoutRef.current = null;
    }
    if (nativeEndTimeoutRef.current) {
      clearTimeout(nativeEndTimeoutRef.current);
      nativeEndTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (Capacitor.isNativePlatform()) {
      CapSpeechRecognition.removeAllListeners();
      nativeListenersRef.current = [];
    }
  }, []);

  const speechSupported =
    typeof window !== 'undefined' &&
    (Capacitor.isNativePlatform() ? nativeSpeechAvailable === true : !!getSpeechRecognition());

  const wordCount = whiteboard.trim() ? whiteboard.trim().split(/\s+/).length : 0;
  const charCount = whiteboard.length;
  const lineCount = whiteboard ? whiteboard.split('\n').length : 0;

  const hasInsight = insight && (insight.summary || insight.tags.length > 0 || insight.actionItems.length > 0);

  return (
    <div className="h-full flex flex-col min-w-0 max-w-full overflow-hidden">
      <p className="section-label mb-3">Notes</p>
      {isDemo && (
        <p className="mb-3 text-xs text-zinc-500 rounded-lg bg-zinc-800/60 border border-zinc-700/60 px-3 py-2">
          In this demo: the note is limited to <strong>{DEMO_MAX_CHARS} characters</strong> and you can only run <strong>«Process with AI»</strong> once.
        </p>
      )}
      <textarea
        ref={textareaRef}
        value={whiteboard}
        onChange={handleChange}
        placeholder="Start writing… Your notes are saved automatically. Use «Process with AI» below for a summary and action items."
        aria-label="Notes - auto-saved"
        maxLength={isDemo ? DEMO_MAX_CHARS : undefined}
        className="quick-add-bar w-full max-w-full min-w-0 min-h-[35vh] px-4 py-3.5 bg-zinc-950/80 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 resize-none leading-relaxed box-border text-[15px] rounded-xl"
        style={{
          minHeight: '35vh',
          maxHeight: 'none',
          overflow: 'hidden',
        }}
        autoFocus={!Capacitor.isNativePlatform()}
      />
      {/* Rest: voice, stats, AI */}
      <div className="flex-1 min-w-0 flex flex-col gap-2 mt-3">
        {speechSupported && (
          <div className="flex items-center gap-2 flex-wrap">
            {Capacitor.isNativePlatform() && (
              <>
                <span className="text-xs text-zinc-500 mr-0.5">Language:</span>
                <div className="flex rounded-md overflow-hidden border border-zinc-700 bg-zinc-800">
                  <button
                    type="button"
                    onClick={() => setVoiceLanguage('es-ES')}
                    aria-label="Use Spanish for voice"
                    className={cn(
                      'px-2 py-1.5 text-xs font-medium transition-colors',
                      voiceLanguage === 'es-ES' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
                    )}
                  >
                    ES
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoiceLanguage('en-US')}
                    aria-label="Use English for voice"
                    className={cn(
                      'px-2 py-1.5 text-xs font-medium transition-colors border-l border-zinc-700',
                      voiceLanguage === 'en-US' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
                    )}
                  >
                    EN
                  </button>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={handleVoiceToggle}
              disabled={insightLoading}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                isRecording
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
              )}
              aria-label={isRecording ? 'Stop recording' : 'Record voice and transcribe to text'}
              title={isRecording ? 'Click to stop and add transcript to note' : 'Record your voice; it will be transcribed to text'}
            >
              <Mic className={cn('w-3.5 h-3.5', isRecording && 'animate-pulse')} aria-hidden />
              {isRecording ? 'Recording… Click to stop' : 'Voice to text'}
            </button>
            {voiceError && (
              <p className="text-xs text-red-400" role="alert">
                {voiceError}
              </p>
            )}
          </div>
        )}

        {/* Stats + Process (2025-style bar) */}
      <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
        <span className="flex items-center gap-1.5 text-zinc-400" aria-live="polite">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
          Auto-saved
        </span>
        <span>{lineCount} lines</span>
        <span>{wordCount} words</span>
        <span>{charCount}{isDemo ? ` / ${DEMO_MAX_CHARS}` : ''} chars</span>
        <button
          type="button"
          onClick={handleProcessFullText}
          disabled={!whiteboard.trim() || insightLoading || (isDemo && demoProcessUsed)}
          className="flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-full bg-zinc-700/80 text-zinc-200 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-[11px] uppercase tracking-wider"
          aria-label="Process full text and get AI insights"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden />
          {insightLoading ? 'Processing…' : isDemo && demoProcessUsed ? 'Process with AI (used)' : 'Process with AI'}
        </button>
      </div>

        {/* AI insights – card style */}
      <div className="mt-4 rounded-xl border border-zinc-700/60 bg-zinc-800/40 overflow-hidden">
        <button
          type="button"
          onClick={() => setInsightOpen((o) => !o)}
          className="w-full min-h-[44px] px-4 py-3 flex items-center justify-between gap-2 text-left text-zinc-200 hover:bg-zinc-800/60 transition-colors text-sm font-medium"
          aria-expanded={insightOpen}
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden />
            AI insights
          </span>
          {insightOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {insightOpen && (
          <div className="px-3 pb-3 pt-0 text-xs text-zinc-400">
            {insightLoading && <p className="text-zinc-500">Analyzing note…</p>}
            {insightError && <p className="text-red-400">{insightError}</p>}
            {!insightLoading && !insightError && !hasInsight && whiteboard.trim().length > 0 && (
              <p className="text-zinc-500">Click &quot;Process with AI&quot; below to get a summary, tags, and action items.</p>
            )}
            {!insightLoading && !insightError && !hasInsight && whiteboard.trim().length === 0 && (
              <p className="text-zinc-500">Write a note in the box above, then click &quot;Process with AI&quot; to get insights.</p>
            )}
            {!insightLoading && !insightError && hasInsight && insight && (
              <div className="space-y-3">
                {insight.summary && (
                  <div>
                    <span className="text-zinc-500 font-medium">Summary</span>
                    <p className="mt-0.5 text-zinc-300">{insight.summary}</p>
                  </div>
                )}
                {insight.tags.length > 0 && (
                  <div>
                    <span className="text-zinc-500 font-medium">Tags</span>
                    <p className="mt-0.5 flex flex-wrap gap-1.5">
                      {insight.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-zinc-700 text-zinc-300 text-xs">
                          {t}
                        </span>
                      ))}
                    </p>
                  </div>
                )}
                {insight.actionItems.length > 0 && (
                  <div>
                    <span className="text-zinc-500 font-medium">Action items</span>
                    {creatingTodos && (
                      <p className="mt-0.5 text-amber-400 text-xs">Adding as todos…</p>
                    )}
                    {!creatingTodos && todosCreated > 0 && (
                      <p className="mt-0.5 text-emerald-400 text-xs">{todosCreated} added to Todos</p>
                    )}
                    <ul className="mt-0.5 list-disc list-inside space-y-0.5 text-zinc-300">
                      {insight.actionItems.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default NotesList;
