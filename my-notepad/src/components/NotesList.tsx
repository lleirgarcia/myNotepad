import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from '../store/useStore';
import * as backendApi from '../lib/backend-api';
import { processNote, type NoteInsight } from '../lib/openai-api';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const DEBOUNCE_MS = 800;
const backendUrl = import.meta.env.VITE_BACKEND_URL?.trim() || '';

const NotesList = () => {
  const { whiteboard, setWhiteboardContent } = useStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [insight, setInsight] = useState<NoteInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [insightOpen, setInsightOpen] = useState(true);

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
        if (content.trim().length > 0) {
          setInsightLoading(true);
          setInsightError(null);
          processNote(content)
            .then(setInsight)
            .catch((e) => setInsightError(e instanceof Error ? e.message : 'Failed'))
            .finally(() => setInsightLoading(false));
        } else {
          setInsight(null);
          setInsightError(null);
        }
      }, DEBOUNCE_MS);
    },
    []
  );

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setWhiteboardContent(value);
    syncToBackend(value);
  };

  const wordCount = whiteboard.trim() ? whiteboard.trim().split(/\s+/).length : 0;
  const charCount = whiteboard.length;
  const lineCount = whiteboard ? whiteboard.split('\n').length : 0;

  const hasInsight = insight && (insight.summary || insight.tags.length > 0 || insight.actionItems.length > 0);

  return (
    <div className="h-full flex flex-col min-w-0 max-w-full overflow-hidden">
      {/* Infinite Textarea */}
      <div className="flex-1 relative min-w-0">
        <textarea
          ref={textareaRef}
          value={whiteboard}
          onChange={handleChange}
          placeholder="Start writing your notes here... Your notes are saved automatically and sent to AI for summary, tags, and action items."
          aria-label="Notes - auto-saved"
          className="w-full max-w-full min-w-0 min-h-[60vh] px-4 py-4 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100 placeholder:text-slate-600 resize-none leading-relaxed box-border"
          style={{
            minHeight: '60vh',
            maxHeight: 'none',
            overflow: 'hidden',
          }}
          autoFocus
        />
      </div>

      {/* Stats Bar */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5 text-slate-400" aria-live="polite">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
          Auto-saved
        </span>
        <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
        <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        <span>{charCount} {charCount === 1 ? 'character' : 'characters'}</span>
      </div>

      {/* AI insights (summary, tags, action items) */}
      <div className="mt-4 border border-slate-800 rounded-lg bg-slate-900/80 overflow-hidden">
        <button
          type="button"
          onClick={() => setInsightOpen((o) => !o)}
          className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left text-slate-300 hover:bg-slate-800/50 transition-colors"
          aria-expanded={insightOpen}
        >
          <span className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-amber-400" aria-hidden />
            AI insights
          </span>
          {insightOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {insightOpen && (
          <div className="px-4 pb-4 pt-0 text-sm text-slate-400">
            {insightLoading && <p className="text-slate-500">Analyzing note…</p>}
            {insightError && <p className="text-red-400">{insightError}</p>}
            {!insightLoading && !insightError && !hasInsight && whiteboard.trim().length > 0 && (
              <p className="text-slate-500">No insights yet. Keep typing to analyze.</p>
            )}
            {!insightLoading && !insightError && !hasInsight && whiteboard.trim().length === 0 && (
              <p className="text-slate-500">Write a note above; it will be sent to AI for a summary, tags, and action items.</p>
            )}
            {!insightLoading && !insightError && hasInsight && insight && (
              <div className="space-y-3">
                {insight.summary && (
                  <div>
                    <span className="text-slate-500 font-medium">Summary</span>
                    <p className="mt-0.5 text-slate-300">{insight.summary}</p>
                  </div>
                )}
                {insight.tags.length > 0 && (
                  <div>
                    <span className="text-slate-500 font-medium">Tags</span>
                    <p className="mt-0.5 flex flex-wrap gap-1.5">
                      {insight.tags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">
                          {t}
                        </span>
                      ))}
                    </p>
                  </div>
                )}
                {insight.actionItems.length > 0 && (
                  <div>
                    <span className="text-slate-500 font-medium">Action items</span>
                    <ul className="mt-0.5 list-disc list-inside space-y-0.5 text-slate-300">
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
  );
};

export default NotesList;
