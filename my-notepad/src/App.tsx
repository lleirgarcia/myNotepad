import { useState, useEffect, useRef, useCallback } from 'react';
import { CheckSquare, BookOpen, Heart, Loader2 } from 'lucide-react';
import TodoList from './components/TodoList';
import NotesList from './components/NotesList';
import { cn } from './lib/utils';
import { useKeyboardDebug } from './hooks/useKeyboardDebug';
import { useStore } from './store/useStore';
import * as backendApi from './lib/backend-api';

const backendUrl = import.meta.env.VITE_BACKEND_URL?.trim() || '';

const PULL_THRESHOLD = 56;
const PULL_MAX = 80;

function App() {
  useKeyboardDebug();
  const { setTodos, setWhiteboard } = useStore();
  const [activeTab, setActiveTab] = useState<'todos' | 'notes'>('todos');
  const [dataLoading, setDataLoading] = useState(!!backendUrl);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const pullDistanceRef = useRef(0);

  const loadData = useCallback(() => {
    if (!backendUrl) return Promise.resolve();
    return Promise.all([backendApi.fetchTodos(), backendApi.fetchWhiteboard()])
      .then(([todos, whiteboard]) => {
        setTodos(todos);
        setWhiteboard(whiteboard);
      })
      .catch(() => setTodos([]));
  }, [setTodos, setWhiteboard]);

  useEffect(() => {
    if (!backendUrl) {
      setDataLoading(false);
      return;
    }
    let cancelled = false;
    setDataLoading(true);
    loadData().finally(() => {
      if (!cancelled) setDataLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    if (!backendUrl || isRefreshing) return;
    setIsRefreshing(true);
    loadData().finally(() => {
      setIsRefreshing(false);
    });
  }, [backendUrl, isRefreshing, loadData]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (el.scrollTop > 0) return;
      const y = e.touches[0].clientY;
      const delta = y - touchStartY.current;
      if (delta > 0) {
        e.preventDefault();
        const d = Math.min(delta * 0.5, PULL_MAX);
        pullDistanceRef.current = d;
        setPullDistance(d);
      }
    };
    const onTouchEnd = () => {
      const d = pullDistanceRef.current;
      pullDistanceRef.current = 0;
      setPullDistance(0);
      if (d >= PULL_THRESHOLD && backendUrl) {
        handleRefresh();
      }
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleRefresh]);

  const header = (
    <header className="mb-4 sm:mb-5 pt-0 min-w-0 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-50 mb-0.5 tracking-tight truncate">
          My Notepad
        </h1>
      </div>
    </header>
  );

  const tabs = (
    <div className="flex gap-1 mb-3 sm:mb-4 bg-slate-900 rounded-md p-1 border border-slate-800 min-w-0" role="tablist" aria-label="Main sections">
      <button
        role="tab"
        aria-selected={activeTab === 'todos'}
        aria-controls="todos-panel"
        id="todos-tab"
        onClick={() => setActiveTab('todos')}
        className={cn(
          'flex-1 min-w-0 min-h-[44px] py-2.5 px-2.5 sm:py-2 sm:px-3 rounded font-medium transition-all flex items-center justify-center gap-1.5 text-sm',
          activeTab === 'todos'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        )}
      >
        <CheckSquare className="w-3.5 h-3.5 shrink-0" aria-hidden />
        <span className="truncate">Todos</span>
      </button>
      <button
        role="tab"
        aria-selected={activeTab === 'notes'}
        aria-controls="notes-panel"
        id="notes-tab"
        onClick={() => setActiveTab('notes')}
        className={cn(
          'flex-1 min-w-0 min-h-[44px] py-2.5 px-2.5 sm:py-2 sm:px-3 rounded font-medium transition-all flex items-center justify-center gap-1.5 text-sm',
          activeTab === 'notes'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-slate-200'
        )}
      >
        <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden />
        <span className="truncate">Notes</span>
      </button>
    </div>
  );

  const content = (
    <div
      id={activeTab === 'todos' ? 'todos-panel' : 'notes-panel'}
      role="tabpanel"
      aria-labelledby={activeTab === 'todos' ? 'todos-tab' : 'notes-tab'}
      className="bg-slate-900 rounded-lg border border-slate-800 p-3 sm:p-4 shadow-sm transition-opacity duration-150 min-w-0 overflow-x-hidden max-w-full"
    >
      {activeTab === 'todos' ? <TodoList /> : <NotesList />}
    </div>
  );

  const footer = (
    <footer className="mt-8 pt-6 border-t border-slate-800 text-center">
      <p className="text-slate-500 text-xs flex flex-wrap items-center justify-center gap-1">
        <span>2026.</span>
        <a
          href="https://lleir.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-slate-300 underline underline-offset-2"
        >
          Lleïr
        </a>
        <span>made it with</span>
        <Heart className="w-3.5 h-3.5 text-red-500/80 fill-red-500/80 inline-block" aria-hidden />
      </p>
    </footer>
  );

  return (
    <div className="h-dvh min-h-screen bg-slate-950 app-safe-area w-full max-w-full flex flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div
          className="flex items-center justify-center bg-slate-900/80 text-slate-400 text-xs transition-[height] duration-150 ease-out"
          style={{ height: isRefreshing ? PULL_THRESHOLD : Math.max(0, pullDistance) }}
          aria-hidden={pullDistance === 0 && !isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" aria-hidden />
          ) : pullDistance >= PULL_THRESHOLD ? (
            <span>Release to refresh</span>
          ) : pullDistance > 0 ? (
            <span>Pull to refresh</span>
          ) : null}
        </div>
        <div className="mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-5 max-w-[50.4rem] w-full min-w-0">
          {header}
          {backendUrl && dataLoading ? (
            <div className="py-12 text-center text-slate-400">Loading your data…</div>
          ) : (
            <>
              {tabs}
              {content}
            </>
          )}
          {footer}
        </div>
      </div>
    </div>
  );
}

export default App;
