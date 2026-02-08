import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { CheckSquare, BookOpen, Heart, Loader2, ArrowRight } from 'lucide-react';
import TodoList from './components/TodoList';
import NotesList from './components/NotesList';
import { cn } from './lib/utils';
import { useKeyboardDebug } from './hooks/useKeyboardDebug';
import { useStore } from './store/useStore';
import * as backendApi from './lib/backend-api';
import { clearAuthToken, hasAuthToken, getGoogleLoginUrl } from './lib/backend-api';
import notedLogo from './assets/noted-logo.png';
import { DemoProvider } from './contexts/DemoContext';
import { getDemoTodos, getDemoWhiteboard } from './lib/demo-data';

const backendUrl = import.meta.env.VITE_BACKEND_URL?.trim() || '';

const PULL_THRESHOLD = 56;
const PULL_MAX = 80;

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  useKeyboardDebug();
  const isDemo = location.pathname === '/app' && !hasAuthToken();
  const { setTodos, setWhiteboard } = useStore();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'todos' | 'notes'>(() =>
    tabParam === 'notes' ? 'notes' : 'todos'
  );

  useEffect(() => {
    if (tabParam === 'notes') setActiveTab('notes');
    else if (tabParam === 'todos') setActiveTab('todos');
  }, [tabParam]);
  const [currentUser, setCurrentUser] = useState<{ name: string | null; email: string | null } | null>(null);
  const [dataLoading, setDataLoading] = useState(!isDemo && !!backendUrl);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
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

  useLayoutEffect(() => {
    if (isDemo) {
      setDataLoading(false);
      setTodos(getDemoTodos());
      setWhiteboard(getDemoWhiteboard());
      return;
    }
  }, [isDemo, setTodos, setWhiteboard]);

  useEffect(() => {
    if (isDemo) return;
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
  }, [isDemo, loadData]);

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
      if (d >= PULL_THRESHOLD && backendUrl && !isDemo) {
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
  }, [handleRefresh, isDemo]);

  useEffect(() => {
    if (hasAuthToken() && backendUrl) {
      backendApi.getCurrentUser().then(setCurrentUser);
    } else {
      setCurrentUser(null);
    }
  }, [backendUrl]); // Run on mount and when backend URL changes; hasAuthToken() read at run time

  const handleSignOut = () => {
    clearAuthToken();
    setCurrentUser(null);
    navigate('/', { replace: true });
  };

  const header = (
    <header className="mb-6 sm:mb-7 pt-0 min-w-0 flex flex-col gap-0">
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={notedLogo}
            alt=""
            className="h-[1.5rem] w-[1.5rem] sm:h-[1.75rem] sm:w-[1.75rem] shrink-0 rounded-md object-contain"
            width={28}
            height={28}
          />
          <h1 className="app-title text-zinc-50 truncate">Noted</h1>
        </div>
        {isDemo && (
          <Link
            to="/"
            className="shrink-0 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            Back to home
          </Link>
        )}
        {hasAuthToken() && !isDemo && (
          <div className="flex items-center gap-2 shrink-0 text-sm">
            {(currentUser?.name || currentUser?.email) && (
              <>
                <span className="text-zinc-500 truncate max-w-[8rem] sm:max-w-[12rem]" title={currentUser.name || currentUser.email || undefined}>
                  {currentUser.name || currentUser.email}
                </span>
                <span className="text-zinc-600" aria-hidden>|</span>
              </>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="text-zinc-500 hover:text-zinc-400"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
      <p className="app-tagline">Never was so easy to do tasks</p>
    </header>
  );

  const tabs = (
    <div
      className="flex gap-0.5 sm:gap-1 mb-5 sm:mb-6 p-1 rounded-2xl bg-zinc-900/90 border border-zinc-700/60 min-w-0 w-full max-w-sm"
      role="tablist"
      aria-label="Main sections"
    >
      <button
        role="tab"
        aria-selected={activeTab === 'todos'}
        aria-controls="todos-panel"
        id="todos-tab"
        onClick={() => setActiveTab('todos')}
        className={cn(
          'flex-1 min-w-0 min-h-[44px] py-2.5 px-3 rounded-xl font-medium text-sm transition-all duration-150 flex items-center justify-center gap-2',
          activeTab === 'todos'
            ? 'bg-zinc-800 text-zinc-50 shadow-sm border border-zinc-600/80'
            : 'text-zinc-500 hover:text-zinc-300'
        )}
      >
        <CheckSquare className="w-4 h-4 shrink-0" aria-hidden />
        <span className="truncate">Tasks</span>
      </button>
      <button
        role="tab"
        aria-selected={activeTab === 'notes'}
        aria-controls="notes-panel"
        id="notes-tab"
        onClick={() => setActiveTab('notes')}
        className={cn(
          'flex-1 min-w-0 min-h-[44px] py-2.5 px-3 rounded-xl font-medium text-sm transition-all duration-150 flex items-center justify-center gap-2',
          activeTab === 'notes'
            ? 'bg-zinc-800 text-zinc-50 shadow-sm border border-zinc-600/80'
            : 'text-zinc-500 hover:text-zinc-300'
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
      className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-4 sm:p-5 min-w-0 overflow-x-hidden max-w-full transition-opacity duration-150"
    >
      {activeTab === 'todos' ? <TodoList /> : <NotesList />}
    </div>
  );

  const demoCta = isDemo && (
    <section className="mt-8 w-full max-w-sm mx-auto" aria-labelledby="demo-register-heading">
      <h2 id="demo-register-heading" className="text-lg font-semibold text-zinc-300 mb-4 text-center">
        Get started
      </h2>
      <div className="flex flex-col gap-3">
        {getGoogleLoginUrl().startsWith('http') ? (
          <a
            href={getGoogleLoginUrl()}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-amber-500 text-zinc-950 font-semibold text-base hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 transition-colors"
          >
            Register with Google
            <ArrowRight className="w-4 h-4" aria-hidden />
          </a>
        ) : null}
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            alert('Email/password sign-up is not available yet. Use Register with Google.');
          }}
        >
          <input
            type="email"
            placeholder="Email"
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
            className="w-full min-h-[44px] px-4 rounded-xl bg-zinc-800 border border-zinc-600 text-zinc-100 placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
          />
          <input
            type="password"
            placeholder="Password"
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
            className="w-full min-h-[44px] px-4 rounded-xl bg-zinc-800 border border-zinc-600 text-zinc-100 placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
          />
          <button
            type="submit"
            className="min-h-[44px] px-6 py-3 rounded-xl border border-zinc-600 text-zinc-300 font-medium text-sm hover:bg-zinc-800/80 transition-colors"
          >
            Register with email
          </button>
        </form>
      </div>
    </section>
  );

  const footer = (
    <footer className="mt-10 pt-6 border-t border-zinc-800/80 text-center">
      <p className="text-zinc-500 text-xs flex flex-wrap items-center justify-center gap-1.5">
        <span>2026</span>
        <a
          href="https://lleir.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-zinc-300 underline underline-offset-2"
        >
          Lleïr
        </a>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-0.5">
          made with <Heart className="w-3.5 h-3.5 text-amber-500/80 fill-amber-500/80" aria-hidden />
        </span>
      </p>
    </footer>
  );

  if (dataLoading) {
    return (
      <DemoProvider value={isDemo}>
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-zinc-950 app-safe-area"
          role="status"
          aria-live="polite"
          aria-label="Loading app"
        >
          <img
            src={notedLogo}
            alt=""
            className="h-12 w-12 shrink-0 rounded-md object-contain opacity-90"
            width={48}
            height={48}
          />
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" aria-hidden />
          <p className="text-sm text-zinc-400">Loading your data…</p>
        </div>
      </DemoProvider>
    );
  }

  return (
    <DemoProvider value={isDemo}>
    <div className="h-dvh min-h-screen bg-zinc-950 app-safe-area w-full max-w-full flex flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div
          className="flex items-center justify-center bg-zinc-900/80 text-zinc-400 text-xs transition-[height] duration-150 ease-out"
          style={{ height: isRefreshing ? PULL_THRESHOLD : Math.max(0, pullDistance) }}
          aria-hidden={pullDistance === 0 && !isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" aria-hidden />
          ) : pullDistance >= PULL_THRESHOLD ? (
            <span>Release to refresh</span>
          ) : pullDistance > 0 ? (
            <span>Pull to refresh</span>
          ) : null}
        </div>
        <div className="mx-auto px-4 sm:px-6 md:px-8 py-5 sm:py-6 max-w-[42rem] w-full min-w-0">
          {header}
          {tabs}
          {content}
          {demoCta}
          {footer}
        </div>
      </div>
    </div>
    </DemoProvider>
  );
}

export default App;
