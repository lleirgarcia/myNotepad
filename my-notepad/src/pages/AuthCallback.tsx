import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AUTH_TOKEN_KEY } from '../lib/backend-api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      console.error('[Auth] Callback error:', error);
      navigate('/?error=' + encodeURIComponent(error), { replace: true });
      return;
    }
    if (token) {
      try {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      } catch {
        // ignore storage errors
      }
      navigate('/app?tab=todos', { replace: true });
      return;
    }
    navigate('/', { replace: true });
  }, [token, error, navigate]);

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-50 flex items-center justify-center">
      <p className="text-zinc-400">Signing you in…</p>
    </div>
  );
}
