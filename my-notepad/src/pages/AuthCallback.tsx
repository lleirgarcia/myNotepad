import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAuthToken, exchangeGoogleCode } from '../lib/backend-api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const exchangeStarted = useRef(false);
  const token = searchParams.get('token');
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      console.error('[Auth] Callback error:', error);
      navigate('/?error=' + encodeURIComponent(error), { replace: true });
      return;
    }
    if (token) {
      try {
        setAuthToken(token);
      } catch {
        // ignore storage errors
      }
      navigate('/app?tab=todos', { replace: true });
      return;
    }
    if (code && typeof window !== 'undefined' && !exchangeStarted.current) {
      exchangeStarted.current = true;
      const redirectUri = window.location.origin + '/auth/callback';
      exchangeGoogleCode(code, redirectUri)
        .then(({ token: jwt }) => {
          setAuthToken(jwt);
          navigate('/app?tab=todos', { replace: true });
        })
        .catch((e) => {
          setExchangeError(e instanceof Error ? e.message : 'Sign-in failed');
        });
      return;
    }
    if (!code) navigate('/', { replace: true });
  }, [token, code, error, navigate]);

  if (exchangeError) {
    return (
      <div className="min-h-dvh bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-red-400 text-sm">{exchangeError}</p>
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm hover:bg-zinc-700"
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-50 flex items-center justify-center">
      <p className="text-zinc-400">Signing you in…</p>
    </div>
  );
}
