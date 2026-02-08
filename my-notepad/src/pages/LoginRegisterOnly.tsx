/**
 * Login / register screen for native app only (iOS & Android).
 * Shown when the user is not authenticated; no landing page, no demo.
 * Supports Google OAuth and email/password (register + login).
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import notedLogo from '../assets/noted-logo.png';
import {
  getGoogleLoginUrl,
  setAuthToken,
  registerWithEmail,
  loginWithEmail,
} from '../lib/backend-api';
import { cn } from '../lib/utils';

const ERROR_MESSAGES: Record<string, string> = {
  db: 'Sign-in failed: database error. Try again later.',
  missing_code: 'Sign-in was cancelled or the link expired. Try again.',
  token_exchange: 'Sign-in failed when exchanging the code. Try again.',
  no_access_token: 'Sign-in failed: no access token from Google. Try again.',
  userinfo: 'Sign-in failed: could not load your profile. Try again.',
  server: 'Sign-in failed: server error. Try again later.',
};

const INPUT_CLASS =
  'w-full min-h-[48px] px-4 rounded-xl bg-zinc-800 border border-zinc-600 text-zinc-100 placeholder:text-zinc-500 text-base focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50';
const BTN_PRIMARY_CLASS =
  'inline-flex items-center justify-center gap-2 w-full min-h-[52px] px-6 py-3 rounded-xl bg-amber-500 text-zinc-950 font-semibold text-base hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors';
const BTN_SECONDARY_CLASS =
  'min-h-[48px] px-6 py-3 rounded-xl border border-zinc-600 text-zinc-300 font-medium text-base hover:bg-zinc-800/80 transition-colors disabled:opacity-50';

export default function LoginRegisterOnly() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
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
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (searchParams.get('error') === 'missing_code') {
      const next = new URLSearchParams(searchParams);
      next.delete('error');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterLoading(true);
    try {
      const { token } = await registerWithEmail(
        registerEmail,
        registerPassword,
        registerName || undefined
      );
      setAuthToken(token);
      navigate('/app', { replace: true });
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const { token } = await loginWithEmail(loginEmail, loginPassword);
      setAuthToken(token);
      navigate('/app', { replace: true });
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div
      className="min-h-dvh bg-zinc-950 text-zinc-50 flex flex-col overflow-y-auto app-safe-area"
      style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 w-full max-w-sm mx-auto" role="main">
        <img
          src={notedLogo}
          alt=""
          className="h-16 w-16 rounded-xl object-contain mb-6 shrink-0"
          width={64}
          height={64}
        />
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50 mb-2 text-center">
          Noted
        </h1>
        <p className="text-sm text-zinc-500 mb-6 text-center">
          Sign in to sync your ideas and tasks.
        </p>

        {errorMessage && (
          <div
            role="alert"
            className="w-full mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-sm flex items-start gap-3"
          >
            <span className="flex-1 min-w-0">{errorMessage}</span>
            <button
              type="button"
              onClick={clearError}
              className="shrink-0 min-h-[44px] px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800/80 text-red-100 text-xs font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {getGoogleLoginUrl().startsWith('http') && (
          <a
            href={getGoogleLoginUrl()}
            className={cn(BTN_PRIMARY_CLASS, 'mb-6')}
          >
            Sign in with Google
            <ArrowRight className="w-4 h-4" aria-hidden />
          </a>
        )}

        <div className="w-full flex rounded-xl bg-zinc-900/80 border border-zinc-700/60 p-1 mb-4">
          <button
            type="button"
            onClick={() => setMode('register')}
            className={cn(
              'flex-1 min-h-[44px] rounded-lg text-sm font-medium transition-colors',
              mode === 'register'
                ? 'bg-zinc-700 text-zinc-50'
                : 'text-zinc-400 hover:text-zinc-300'
            )}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={cn(
              'flex-1 min-h-[44px] rounded-lg text-sm font-medium transition-colors',
              mode === 'login'
                ? 'bg-zinc-700 text-zinc-50'
                : 'text-zinc-400 hover:text-zinc-300'
            )}
          >
            Log in
          </button>
        </div>

        {mode === 'register' ? (
          <form onSubmit={handleRegister} className="w-full flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              required
              autoComplete="email"
              className={INPUT_CLASS}
            />
            <input
              type="text"
              placeholder="Name (optional)"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              autoComplete="name"
              className={INPUT_CLASS}
            />
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className={INPUT_CLASS}
            />
            {registerError && (
              <p className="text-sm text-red-400" role="alert">
                {registerError}
              </p>
            )}
            <button
              type="submit"
              disabled={registerLoading}
              className={BTN_SECONDARY_CLASS}
            >
              {registerLoading ? 'Creating account…' : 'Register with email'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              autoComplete="email"
              className={INPUT_CLASS}
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={INPUT_CLASS}
            />
            {loginError && (
              <p className="text-sm text-red-400" role="alert">
                {loginError}
              </p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className={BTN_SECONDARY_CLASS}
            >
              {loginLoading ? 'Signing in…' : 'Log in with email'}
            </button>
          </form>
        )}

        {!getGoogleLoginUrl().startsWith('http') && (
          <p className="mt-6 text-sm text-zinc-500 text-center">
            Configure the backend (VITE_BACKEND_URL and Google OAuth or email auth) to sign in.
          </p>
        )}
      </main>
    </div>
  );
}
