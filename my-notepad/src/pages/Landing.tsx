import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, FileText, Sparkles, X, AlertCircle, XCircle, CheckCircle2, BookOpen, Target, Zap, Heart } from 'lucide-react';
import notedLogo from '../assets/noted-logo.png';
import { getGoogleLoginUrl, hasAuthToken, setAuthToken, registerWithEmail, loginWithEmail } from '../lib/backend-api';

const jsonLdSoftwareApp = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Noted',
  applicationCategory: 'ProductivityApplication',
  description:
    'Noted is an app to express ideas, create todos, and order them by action priority. Like a kanban in list form: one priority list, mark tasks done as you go. Not for long-term planning—for what to do next.',
  operatingSystem: 'Web, iOS, Android',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  url: 'https://noted.app/',
};

const jsonLdWebSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Noted',
  description: 'Express ideas, create todos, order by priority. Priority list app—mark tasks done as you go. Web, iOS, Android.',
  url: 'https://noted.app/',
  publisher: { '@type': 'Organization', name: 'Noted' },
  potentialAction: {
    '@type': 'UseAction',
    target: { '@type': 'EntryPoint', urlTemplate: 'https://noted.app/app' },
    name: 'Open Noted app',
  },
};

const jsonLdFaq = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Noted?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Noted is an app to express ideas, create todos, and order them by priority of action. It works like a kanban in list form: one list ordered by priority, and you mark tasks as done as you go. It is not for long-term planning—it is for focusing on what to do next.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Noted for long-term planning?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Noted is for expressing ideas, creating tasks, ordering them by importance, and marking them done. It is a priority list: you see what matters now and work through it, not a calendar or project roadmap.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Noted free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Noted is free. Unlimited ideas, todos, and priority list; cloud sync when connected.',
      },
    },
  ],
};

const ERROR_MESSAGES: Record<string, string> = {
  db: 'Sign-in failed: database error. Ensure the backend has run the users migration in Supabase (003_users_google.sql) and uses SUPABASE_SERVICE_ROLE_KEY.',
  missing_code: 'Sign-in was cancelled or the link expired. Try again.',
  token_exchange: 'Sign-in failed when exchanging the code. Try again.',
  no_access_token: 'Sign-in failed: no access token from Google. Try again.',
  userinfo: 'Sign-in failed: could not load your profile. Try again.',
  server: 'Sign-in failed: server error. Try again later.',
};

export default function Landing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const errorCode = searchParams.get('error');
  const errorMessage =
    errorCode && errorCode !== 'missing_code'
      ? ERROR_MESSAGES[errorCode] ?? `Sign-in failed (${errorCode}). Try again.`
      : null;

  const clearError = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('error');
    const q = next.toString();
    navigate(q ? `/?${q}` : '/', { replace: true });
  };

  useEffect(() => {
    const tokenFromParams = searchParams.get('token');
    const tokenFromUrl =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('token')
        : null;
    const token = tokenFromParams || tokenFromUrl;
    if (token && token.length > 10) {
      navigate(`/auth/callback?token=${encodeURIComponent(token)}`, { replace: true });
      return;
    }
    if (searchParams.get('error') === 'missing_code') {
      const next = new URLSearchParams(searchParams);
      next.delete('error');
      navigate(next.toString() ? `/?${next}` : '/', { replace: true });
    }
  }, [navigate, searchParams]);

  return (
    <div
      className="h-dvh min-h-dvh bg-zinc-950 text-zinc-50 flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftwareApp) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      {errorMessage && (
        <div
          role="alert"
          className="mx-4 sm:mx-6 mt-4 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-sm flex items-start gap-3"
        >
          <span className="flex-1 min-w-0">{errorMessage}</span>
          <button
            type="button"
            onClick={clearError}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800/80 text-red-100 text-xs font-medium"
          >
            Dismiss
          </button>
        </div>
      )}
      <nav className="px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-end gap-4">
          <Link
            to="/pricing"
            className="text-zinc-400 hover:text-zinc-300 text-sm transition-colors"
          >
            Pricing
          </Link>
          <button
            type="button"
            onClick={() => setLoginModalOpen(true)}
            className="text-zinc-400 hover:text-zinc-300 text-sm font-medium transition-colors"
          >
            Log in
          </button>
        </div>
      </nav>

      {/* Log in modal: Google + email/password */}
      {loginModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          onClick={() => setLoginModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 id="login-modal-title" className="text-lg font-semibold text-zinc-50">
                Log in
              </h2>
              <button
                type="button"
                onClick={() => setLoginModalOpen(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <p className="text-sm text-zinc-400 mb-4">
              Sign in with your existing account.
            </p>
            <div className="flex flex-col gap-3">
              {getGoogleLoginUrl().startsWith('http') ? (
                <a
                  href={getGoogleLoginUrl()}
                  className="inline-flex items-center justify-center gap-2 w-full min-h-[48px] px-4 py-3 rounded-xl bg-amber-500 text-zinc-950 font-semibold text-base hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors"
                >
                  Sign in with Google
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </a>
              ) : null}
              <form
                className="flex flex-col gap-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoginError(null);
                  setLoginLoading(true);
                  try {
                    const { token } = await loginWithEmail(loginEmail, loginPassword);
                    setAuthToken(token);
                    setLoginModalOpen(false);
                    navigate('/app');
                  } catch (err) {
                    setLoginError(err instanceof Error ? err.message : 'Sign-in failed.');
                  } finally {
                    setLoginLoading(false);
                  }
                }}
              >
                <input
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-4 rounded-xl bg-zinc-800 border border-zinc-600 text-zinc-100 placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-4 rounded-xl bg-zinc-800 border border-zinc-600 text-zinc-100 placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                />
                {loginError && (
                  <p className="text-xs text-red-400" role="alert">{loginError}</p>
                )}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="min-h-[44px] px-6 py-3 rounded-xl border border-zinc-600 text-zinc-300 font-medium text-sm hover:bg-zinc-800/80 transition-colors disabled:opacity-50"
                >
                  {loginLoading ? 'Signing in…' : 'Log in with email'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      <main id="main-content" className="flex-1 px-4 sm:px-6 py-12 sm:py-16" role="main">
        <div className="w-full max-w-2xl mx-auto">
          {/* Hero */}
          <section className="text-center mb-16 sm:mb-20">
            <img
              src={notedLogo}
              alt="Noted - priority todo list app logo"
              className="h-14 w-14 sm:h-16 sm:w-16 mx-auto rounded-xl object-contain mb-6"
              width={64}
              height={64}
              fetchPriority="high"
            />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-50 mb-4">
              Noted — Ideas, Todos &amp; Priority List
            </h1>
            <p className="text-xl sm:text-2xl text-zinc-400 font-medium mb-3">
              Express ideas. Create todos. Order by priority. Mark done.
            </p>
            <p className="text-base text-zinc-500 max-w-lg mx-auto mb-8">
              Noted is a priority list app—like kanban in list form. You express ideas, create tasks, order them by importance of action, and mark them finished as you go. Not for long-term planning; for what to do next.
            </p>
            {!hasAuthToken() ? (
              <Link
                to="/app"
                className="inline-flex items-center justify-center gap-2 min-h-[52px] px-8 py-3 rounded-xl bg-amber-500 text-zinc-950 font-semibold text-base hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950 transition-colors"
              >
                Try Noted
                <ArrowRight className="w-5 h-5" aria-hidden />
              </Link>
            ) : (
              <Link
                to="/app"
                className="inline-flex items-center justify-center gap-2 min-h-[52px] px-8 py-3 rounded-xl bg-amber-500 text-zinc-950 font-semibold text-base hover:bg-amber-400 transition-colors"
              >
                Open app
                <ArrowRight className="w-5 h-5" aria-hidden />
              </Link>
            )}
          </section>

          {/* Pains */}
          <section className="mb-16 sm:mb-20" aria-labelledby="pains-heading">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/15 text-red-400">
                <AlertCircle className="w-5 h-5" aria-hidden />
              </div>
              <h2 id="pains-heading" className="text-xl sm:text-2xl font-bold text-zinc-50">
                The daily struggle
              </h2>
            </div>
            <p className="text-zinc-400 text-sm sm:text-base mb-6">
              You want to express ideas, turn them into tasks, and know what to do next—by priority:
            </p>
            <ul className="space-y-4">
              {[
                'Ideas stay in notes; tasks live elsewhere. No single list ordered by what matters now.',
                'You write something and forget to act. No simple “idea → todo → mark done” flow.',
                'Too many tools: sticky notes, spreadsheets, heavy planners. You need a priority list, not a roadmap.',
                'One flat list with no sense of importance. You can’t just work top-to-bottom and mark things done.',
                'Long-term planning apps overload you. You need “what to do next,” not calendars and milestones.',
              ].map((text, i) => (
                <li key={i} className="flex gap-3 text-zinc-300 text-sm sm:text-base">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-zinc-700/80 text-zinc-500 flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </span>
                  <span>{text}</span>
            </li>
              ))}
            </ul>
          </section>

          {/* What other apps don't solve */}
          <section className="mb-16 sm:mb-20" aria-labelledby="others-heading">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400">
                <XCircle className="w-5 h-5" aria-hidden />
              </div>
              <h2 id="others-heading" className="text-xl sm:text-2xl font-bold text-zinc-50">
                What other apps get wrong
              </h2>
            </div>
            <p className="text-zinc-400 text-sm sm:text-base mb-6">
              They’re built for long-term planning or heavy project management, not a simple priority list:
            </p>
            <ul className="space-y-4">
              {[
                'Full-blown project tools: Gantt, milestones, deadlines. You just want a list by priority.',
                'Note-only or task-only. You need ideas and todos together, ordered by action importance.',
                'No “order by priority and mark done.” You get reminders and due dates instead of a clear “do next” list.',
                'Kanban boards with many columns. You want one list, like kanban in list form—priority order, tick and go.',
                'Calendar-first or roadmap-first. Noted is action-first: express idea, create todo, prioritize, mark done.',
              ].map((text, i) => (
                <li key={i} className="flex gap-3 text-zinc-300 text-sm sm:text-base">
                  <XCircle className="w-5 h-5 shrink-0 text-amber-500/70 mt-0.5" aria-hidden />
                  <span>{text}</span>
            </li>
              ))}
            </ul>
          </section>

          {/* Benefits */}
          <section className="mb-16 sm:mb-20" aria-labelledby="benefits-heading">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" aria-hidden />
              </div>
              <h2 id="benefits-heading" className="text-xl sm:text-2xl font-bold text-zinc-50">
                What Noted does
              </h2>
            </div>
            <p className="text-zinc-400 text-sm sm:text-base mb-6">
              One priority list: express ideas, create todos, order by importance, mark done.
            </p>
            <ul className="space-y-4">
              {[
                { icon: BookOpen, text: 'Express ideas in notes and create todos from them. One place for ideas and the tasks that come from them.' },
                { icon: Target, text: 'Order everything by priority of action. One list—like kanban in list form—so you know what to do next.' },
                { icon: Zap, text: 'Mark tasks finished as you go. No long-term planning; the goal is to work through the list by priority.' },
                { icon: FileText, text: 'Tasks can be grouped by note or area. You see the list by importance, not one endless flat list.' },
                { icon: Sparkles, text: 'Not a calendar or roadmap. Noted is for action: prioritize, do, mark done. That’s it.' },
              ].map(({ icon: Icon, text }, i) => (
                <li key={i} className="flex gap-3 text-zinc-300 text-sm sm:text-base">
                  <Icon className="w-5 h-5 shrink-0 text-amber-500/80 mt-0.5" aria-hidden />
                  <span>{text}</span>
            </li>
              ))}
          </ul>
          </section>

          {/* FAQ: matches FAQPage schema for rich results */}
          <section className="mb-16 sm:mb-20" aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="text-xl sm:text-2xl font-bold text-zinc-50 mb-6">
              Frequently asked questions
            </h2>
            <dl className="space-y-6">
              <div>
                <dt className="text-zinc-50 font-semibold text-sm sm:text-base mb-1">What is Noted?</dt>
                <dd className="text-zinc-400 text-sm sm:text-base">
                  Noted is an app to express ideas, create todos, and order them by priority of action. It works like a kanban in list form: one list ordered by priority, and you mark tasks as done as you go. It is not for long-term planning—it is for focusing on what to do next. Web, iOS, Android.
                </dd>
              </div>
              <div>
                <dt className="text-zinc-50 font-semibold text-sm sm:text-base mb-1">Is Noted for long-term planning?</dt>
                <dd className="text-zinc-400 text-sm sm:text-base">
                  No. Noted is for expressing ideas, creating tasks, ordering them by importance, and marking them done. It is a priority list: you see what matters now and work through it, not a calendar or project roadmap.
                </dd>
              </div>
              <div>
                <dt className="text-zinc-50 font-semibold text-sm sm:text-base mb-1">Is Noted free?</dt>
                <dd className="text-zinc-400 text-sm sm:text-base">
                  Yes. Noted is free. Unlimited ideas, todos, and priority list; cloud sync when connected.
                </dd>
              </div>
            </dl>
          </section>

          {/* Register */}
          <section className="w-full max-w-sm mx-auto mb-10" aria-labelledby="register-heading">
            <h2 id="register-heading" className="text-lg font-semibold text-zinc-300 mb-4 text-center">
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
                onSubmit={async (e) => {
                  e.preventDefault();
                  setRegisterError(null);
                  setRegisterLoading(true);
                  try {
                    const { token } = await registerWithEmail(registerEmail, registerPassword);
                    setAuthToken(token);
                    navigate('/app');
                  } catch (err) {
                    setRegisterError(err instanceof Error ? err.message : 'Registration failed.');
                  } finally {
                    setRegisterLoading(false);
                  }
                }}
              >
                <input
                  type="email"
                  placeholder="Email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  className="w-full min-h-[44px] px-4 rounded-xl bg-zinc-800 border border-zinc-600 text-zinc-100 placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                />
                <input
                  type="password"
                  placeholder="Password (min 8 characters)"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full min-h-[44px] px-4 rounded-xl bg-zinc-800 border border-zinc-600 text-zinc-100 placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                />
                {registerError && (
                  <p className="text-xs text-red-400" role="alert">{registerError}</p>
                )}
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="min-h-[44px] px-6 py-3 rounded-xl border border-zinc-600 text-zinc-300 font-medium text-sm hover:bg-zinc-800/80 transition-colors disabled:opacity-50"
                >
                  {registerLoading ? 'Creating account…' : 'Register with email'}
                </button>
              </form>
            </div>
          </section>

          {hasAuthToken() && (
            <p className="text-center">
          <Link
            to="/app"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl border border-zinc-600 text-zinc-300 text-sm hover:bg-zinc-800/80 transition-colors"
          >
                Open app (already signed in)
          </Link>
            </p>
          )}
        </div>
      </main>
      <footer className="py-6 border-t border-zinc-800/80 text-center">
        <p className="text-zinc-500 text-xs flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
          <Link
            to="/terms"
            className="text-zinc-400 hover:text-zinc-300 underline underline-offset-2"
          >
            Terms
          </Link>
          <span aria-hidden>·</span>
          <Link
            to="/privacy"
            className="text-zinc-400 hover:text-zinc-300 underline underline-offset-2"
          >
            Privacy & Data
          </Link>
          <span aria-hidden>·</span>
          <a
            href="https://lleir.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-zinc-300 underline underline-offset-2"
          >
            Lleïr
          </a>
          <span aria-hidden>·</span>
          <span>2026</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-0.5">
            made with <Heart className="w-3.5 h-3.5 text-amber-500/80 fill-amber-500/80" aria-hidden />
          </span>
        </p>
      </footer>
    </div>
  );
}
