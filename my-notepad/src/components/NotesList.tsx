import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

const NotesList = () => {
  const { whiteboard, updateWhiteboard } = useStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [whiteboard]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateWhiteboard(e.target.value);
  };

  const wordCount = whiteboard.trim() ? whiteboard.trim().split(/\s+/).length : 0;
  const charCount = whiteboard.length;
  const lineCount = whiteboard ? whiteboard.split('\n').length : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Infinite Textarea */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={whiteboard}
          onChange={handleChange}
          placeholder="Start writing your notes here... Your notes are saved automatically."
          aria-label="Notes - auto-saved"
          className="w-full min-h-[60vh] px-4 py-4 bg-slate-950 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100 placeholder:text-slate-600 resize-none leading-relaxed"
          style={{ 
            minHeight: '60vh',
            maxHeight: 'none',
            overflow: 'hidden'
          }}
          autoFocus
        />
      </div>

      {/* Stats Bar - always visible with auto-saved indicator */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5 text-slate-400" aria-live="polite">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
          Auto-saved
        </span>
        <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
        <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        <span>{charCount} {charCount === 1 ? 'character' : 'characters'}</span>
      </div>
    </div>
  );
};

export default NotesList;
