import { useState, useEffect } from 'react';
import { CheckSquare, BookOpen } from 'lucide-react';
import TodoList from './components/TodoList';
import NotesList from './components/NotesList';
import { cn } from './lib/utils';
import { useKeyboardDebug } from './hooks/useKeyboardDebug';
import { useStore } from './store/useStore';
import * as backendApi from './lib/backend-api';

const backendUrl = import.meta.env.VITE_BACKEND_URL?.trim() || '';

function App() {
  useKeyboardDebug();
  const { setTodos, setWhiteboard } = useStore();
  const [activeTab, setActiveTab] = useState<'todos' | 'notes'>('todos');
  const [dataLoading, setDataLoading] = useState(!!backendUrl);

  useEffect(() => {
    if (!backendUrl) {
      setDataLoading(false);
      return;
    }
    let cancelled = false;
    setDataLoading(true);
    Promise.all([backendApi.fetchTodos(), backendApi.fetchWhiteboard()])
      .then(([todos, whiteboard]) => {
        if (!cancelled) {
          setTodos(todos);
          setWhiteboard(whiteboard);
        }
      })
      .catch(() => {
        if (!cancelled) setTodos([]);
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setTodos, setWhiteboard]);

  const header = (
    <header className="mb-6 sm:mb-8 pt-0 sm:pt-2 min-w-0 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-50 mb-1 tracking-tight truncate">
          My Notepad
        </h1>
        <p className="text-slate-400 text-sm">
          {backendUrl ? 'Synced via API key' : 'Local only · no sync'}
        </p>
      </div>
    </header>
  );

  const tabs = (
    <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 bg-slate-900 rounded-lg p-1 border border-slate-800 min-w-0" role="tablist" aria-label="Main sections">
      <button
        role="tab"
        aria-selected={activeTab === 'todos'}
        aria-controls="todos-panel"
        id="todos-tab"
        onClick={() => setActiveTab('todos')}
        className={cn(
          'flex-1 min-w-0 py-3 px-3 sm:px-4 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base',
          activeTab === 'todos'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        )}
      >
        <CheckSquare className="w-4 h-4 shrink-0" aria-hidden />
        <span className="truncate">Todos</span>
      </button>
      <button
        role="tab"
        aria-selected={activeTab === 'notes'}
        aria-controls="notes-panel"
        id="notes-tab"
        onClick={() => setActiveTab('notes')}
        className={cn(
          'flex-1 min-w-0 py-3 px-3 sm:px-4 rounded-md font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base',
          activeTab === 'notes'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        )}
      >
        <BookOpen className="w-4 h-4 shrink-0" aria-hidden />
        <span className="truncate">Notes</span>
      </button>
    </div>
  );

  const content = (
    <div
      id={activeTab === 'todos' ? 'todos-panel' : 'notes-panel'}
      role="tabpanel"
      aria-labelledby={activeTab === 'todos' ? 'todos-tab' : 'notes-tab'}
      className="bg-slate-900 rounded-lg border border-slate-800 p-3 sm:p-6 shadow-sm transition-opacity duration-150 min-w-0 overflow-x-hidden max-w-full"
    >
      {activeTab === 'todos' ? <TodoList /> : <NotesList />}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 app-safe-area w-full max-w-full">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl w-full min-w-0 max-w-full">
        {header}
        {backendUrl && dataLoading ? (
          <div className="py-12 text-center text-slate-400">Loading your data…</div>
        ) : (
          <>
            {tabs}
            {content}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
