import { Router, Request, Response } from 'express';
import { SignJWT } from 'jose';
import { getSupabaseAdmin } from '../lib/supabase.js';
import { config } from '../config.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import type { RequestWithUserId } from '../middleware/apiKeyAuth.js';
import { hashPassword, verifyPassword } from '../lib/password.js';

export const authRouter = Router();

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function issueToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(config.jwt.secret));
}

function isAllowedRedirectUri(uri: string): boolean {
  if (!uri) return false;
  // Native (Capacitor): https://localhost (Android) or capacitor://localhost (iOS)
  if (uri.startsWith('https://localhost') || uri.startsWith('capacitor://localhost')) return true;
  if (!uri.startsWith('http')) return false;
  const allowed = [
    config.frontendUrl,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ]
    .filter(Boolean)
    .map((o) => o.replace(/\/$/, '')); // no trailing slash
  return allowed.some((origin) => uri === origin || uri.startsWith(origin + '/'));
}

/** GET /api/auth/google?redirect_uri=... — redirects to Google OAuth */
authRouter.get('/google', (req: Request, res: Response) => {
  if (!config.google.enabled) {
    res.status(503).json({ error: 'Google login is not configured.' });
    return;
  }
  const redirectUri = typeof req.query.redirect_uri === 'string' ? req.query.redirect_uri : '';
  if (!isAllowedRedirectUri(redirectUri)) {
    const hint =
      config.frontendUrl && config.frontendUrl !== 'http://localhost:5173'
        ? `FRONTEND_URL is set to ${config.frontendUrl}; redirect_uri received was: ${redirectUri || '(empty)'}`
        : 'Set FRONTEND_URL in the backend to your app origin (e.g. https://yourapp.vercel.app).';
    res.status(400).json({
      error: 'Invalid or missing redirect_uri. Use your app origin (e.g. https://yourapp.vercel.app or http://localhost:5173).',
      hint,
    });
    return;
  }
  const state = Buffer.from(JSON.stringify({ redirect_uri: redirectUri }), 'utf8').toString('base64url');
  let redirectUriForGoogle: string;
  if (config.oauthConsentShowAppDomain) {
    const frontendRedirectUri = redirectUri.replace(/\/$/, '');
    redirectUriForGoogle = frontendRedirectUri.includes('/auth/callback')
      ? frontendRedirectUri
      : frontendRedirectUri + '/auth/callback';
  } else {
    let backendOrigin = config.backendUrl || `${req.protocol}://${req.get('host') ?? ''}`;
    backendOrigin = backendOrigin.replace(/\/$/, '');
    if (!backendOrigin.startsWith('http')) backendOrigin = `https://${backendOrigin}`;
    else if (backendOrigin.startsWith('http://') && !backendOrigin.includes('localhost'))
      backendOrigin = backendOrigin.replace(/^http:\/\//, 'https://');
    redirectUriForGoogle = `${backendOrigin}/api/auth/google/callback`;
  }
  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: redirectUriForGoogle,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });
  res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

/** Shared: exchange code for tokens, get profile, create/update user, return userId (or throw) */
async function exchangeCodeAndGetUserId(code: string, redirectUri: string): Promise<string> {
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });
  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token: ${err}`);
  }
  const tokenData = (await tokenRes.json()) as { access_token?: string };
  const accessToken = tokenData.access_token;
  if (!accessToken) throw new Error('No access token from Google');

  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userRes.ok) throw new Error('Google userinfo failed');
  const profile = (await userRes.json()) as { sub?: string; id?: string; email?: string; name?: string };
  const googleSub = profile.sub ?? profile.id ?? null;
  if (!googleSub) throw new Error('Google userinfo missing sub/id');
  const email = profile.email ?? null;
  const name = profile.name ?? null;

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('google_sub', googleSub)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('users')
      .update({ email, name, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    return existing.id;
  }

  const { data: inserted, error } = await supabase
    .from('users')
    .insert({ google_sub: googleSub, email, name })
    .select('id')
    .single();
  if (error) {
    console.error('[auth] Insert user error:', error.message, error.code, error.details);
    throw error;
  }
  await supabase.from('areas').insert([
    { user_id: inserted.id, name: 'Work', icon: 'briefcase', is_default: true },
    { user_id: inserted.id, name: 'Personal stuff', icon: 'home', is_default: true },
    { user_id: inserted.id, name: 'Ideas / thoughts', icon: 'lightbulb', is_default: true },
  ]);
  return inserted.id;
}

/** POST /api/auth/google/exchange — body: { code, redirect_uri }. Exchange code (frontend is redirect_uri), return { token }. */
authRouter.post('/google/exchange', async (req: Request, res: Response) => {
  if (!config.google.enabled || !config.jwt.enabled) {
    res.status(503).json({ error: 'Google login is not configured.' });
    return;
  }
  const body = req.body as { code?: string; redirect_uri?: string };
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  const redirectUri = typeof body.redirect_uri === 'string' ? body.redirect_uri.trim() : '';
  if (!code) {
    res.status(400).json({ error: 'Missing code.' });
    return;
  }
  const base = redirectUri.replace(/\/$/, '');
  const finalRedirectUri = base
    ? (base.includes('/auth/callback') ? base : base + '/auth/callback')
    : '';
  if (!finalRedirectUri || !isAllowedRedirectUri(finalRedirectUri)) {
    res.status(400).json({ error: 'Invalid or missing redirect_uri.' });
    return;
  }
  try {
    const userId = await exchangeCodeAndGetUserId(code, finalRedirectUri);
    const token = await issueToken(userId);
    res.status(200).json({ token });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Exchange failed';
    console.error('[auth] google/exchange error:', e);
    if (msg.includes('Google token')) res.status(400).json({ error: 'Invalid or expired code. Try signing in again.' });
    else if (msg.includes('userinfo')) res.status(400).json({ error: 'Could not load profile. Try again.' });
    else res.status(500).json({ error: 'Sign-in failed. Try again.' });
  }
});

/** GET /api/auth/google/callback?code=...&state=... — legacy: exchange code, redirect to app with JWT (kept for old redirect_uri) */
authRouter.get('/google/callback', async (req: Request, res: Response) => {
  if (!config.google.enabled || !config.jwt.enabled) {
    res.status(503).json({ error: 'Google login is not configured.' });
    return;
  }
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const stateRaw = typeof req.query.state === 'string' ? req.query.state : '';
  const googleError = typeof req.query.error === 'string' ? req.query.error : '';
  if (!code) {
    let redirectUriNoCode = config.frontendUrl;
    try {
      const state = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8'));
      redirectUriNoCode = state?.redirect_uri ?? config.frontendUrl;
    } catch {
      // use default
    }
    if (!isAllowedRedirectUri(redirectUriNoCode)) redirectUriNoCode = config.frontendUrl;
    const base = redirectUriNoCode.replace(/\/$/, '');
    const target = base.includes('/auth/callback') || base.includes('/app') ? base : base + '/';
    if (googleError === 'access_denied') {
      res.redirect(302, target);
      return;
    }
    res.redirect(302, `${target}${target.includes('?') ? '&' : '?'}error=missing_code`);
    return;
  }
  let redirectUri: string;
  try {
    const state = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8'));
    redirectUri = state?.redirect_uri ?? config.frontendUrl;
  } catch {
    redirectUri = config.frontendUrl;
  }
  if (!isAllowedRedirectUri(redirectUri)) {
    redirectUri = config.frontendUrl;
  }
  const base = redirectUri.replace(/\/$/, '');
  if (!base.includes('/auth/callback') && !base.includes('/app')) {
    redirectUri = base + '/auth/callback';
  }

  let backendOrigin = config.backendUrl || `${req.protocol}://${req.get('host') ?? ''}`;
  backendOrigin = backendOrigin.replace(/\/$/, '');
  if (!backendOrigin.startsWith('http')) backendOrigin = `https://${backendOrigin}`;
  else if (backendOrigin.startsWith('http://') && !backendOrigin.includes('localhost'))
    backendOrigin = backendOrigin.replace(/^http:\/\//, 'https://');
  const callbackUrl = `${backendOrigin}/api/auth/google/callback`;

  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
      }),
    });
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('[auth] Google token error:', err);
      res.redirect(302, `${redirectUri}?error=token_exchange`);
      return;
    }
    const tokenData = (await tokenRes.json()) as { access_token?: string };
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      res.redirect(302, `${redirectUri}?error=no_access_token`);
      return;
    }

    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) {
      res.redirect(302, `${redirectUri}?error=userinfo`);
      return;
    }
    const profile = (await userRes.json()) as { sub?: string; id?: string; email?: string; name?: string };
    const googleSub = profile.sub ?? profile.id ?? null;
    if (!googleSub) {
      console.error('[auth] Google userinfo missing sub and id:', profile);
      res.redirect(302, `${redirectUri}?error=userinfo`);
      return;
    }
    const email = profile.email ?? null;
    const name = profile.name ?? null;

    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('google_sub', googleSub)
      .maybeSingle();

    let userId: string;
    if (existing) {
      userId = existing.id;
      await supabase
        .from('users')
        .update({ email, name, updated_at: new Date().toISOString() })
        .eq('id', userId);
    } else {
      const { data: inserted, error } = await supabase
        .from('users')
        .insert({ google_sub: googleSub, email, name })
        .select('id')
        .single();
      if (error) {
        console.error('[auth] Insert user error:', error.message, error.code, error.details);
        res.redirect(302, `${redirectUri}?error=db`);
        return;
      }
      userId = inserted.id;
      // Create 3 default areas for new user (Work, Personal stuff, Ideas / thoughts)
      await supabase.from('areas').insert([
        { user_id: userId, name: 'Work', icon: 'briefcase', is_default: true },
        { user_id: userId, name: 'Personal stuff', icon: 'home', is_default: true },
        { user_id: userId, name: 'Ideas / thoughts', icon: 'lightbulb', is_default: true },
      ]);
    }

    const jwt = await issueToken(userId);
    const sep = redirectUri.includes('?') ? '&' : '?';
    res.redirect(302, `${redirectUri}${sep}token=${encodeURIComponent(jwt)}`);
  } catch (e) {
    console.error('[auth] Callback error:', e);
    res.redirect(302, `${redirectUri}?error=server`);
  }
});

/** POST /api/auth/register — create user with email/password (no email verification) */
authRouter.post('/register', async (req: Request, res: Response) => {
  if (!config.jwt.enabled) {
    res.status(503).json({ error: 'Email sign-up is not configured.' });
    return;
  }
  const body = req.body as { email?: string; password?: string; name?: string };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.name === 'string' ? body.name.trim() || null : null;

  if (!email || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ error: 'Valid email is required.' });
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .not('password_hash', 'is', null)
    .ilike('email', email)
    .maybeSingle();

  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const passwordHash = hashPassword(password);
  const { data: inserted, error } = await supabase
    .from('users')
    .insert({
      email,
      name: name ?? email.split('@')[0] ?? 'User',
      password_hash: passwordHash,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    console.error('[auth] Register insert error:', error.message, error.code);
    res.status(500).json({ error: 'Registration failed. Try again.' });
    return;
  }

  const userId = inserted.id;
  await supabase.from('areas').insert([
    { user_id: userId, name: 'Work', icon: 'briefcase', is_default: true },
    { user_id: userId, name: 'Personal stuff', icon: 'home', is_default: true },
    { user_id: userId, name: 'Ideas / thoughts', icon: 'lightbulb', is_default: true },
  ]);

  try {
    const token = await issueToken(userId);
    res.status(201).json({ token });
  } catch (e) {
    console.error('[auth] Issue token error:', e);
    res.status(500).json({ error: 'Registration failed. Try again.' });
  }
});

/** POST /api/auth/login — sign in with email/password */
authRouter.post('/login', async (req: Request, res: Response) => {
  if (!config.jwt.enabled) {
    res.status(503).json({ error: 'Email sign-in is not configured.' });
    return;
  }
  const body = req.body as { email?: string; password?: string };
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from('users')
    .select('id, password_hash')
    .not('password_hash', 'is', null)
    .ilike('email', email)
    .maybeSingle();

  if (error || !user?.password_hash) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (!verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  try {
    const token = await issueToken(user.id);
    res.status(200).json({ token });
  } catch (e) {
    console.error('[auth] Issue token error:', e);
    res.status(500).json({ error: 'Sign-in failed. Try again.' });
  }
});

/** GET /api/auth/me — returns current user (name, email) from JWT or API key */
authRouter.get('/me', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUserId).userId;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    if (!data) {
      res.status(200).json({ name: null, email: null });
      return;
    }
    res.status(200).json({
      name: data.name ?? null,
      email: data.email ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load user';
    res.status(500).json({ error: msg });
  }
});

/** POST /api/auth/migrate-from-default — copy notes, todos, areas, whiteboard from DEFAULT_USER_ID to current user (JWT only). Use when you used to use API key locally and now sign in with Google. */
authRouter.post('/migrate-from-default', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUserId).userId;
    if (userId === config.defaultUserId) {
      res.status(403).json({
        error: 'Migration is only for accounts signed in with Google/email. You are already using the default account (API key).',
      });
      return;
    }
    const supabase = getSupabaseAdmin();
    const defaultId = config.defaultUserId;
    const areaIdMap = new Map<string, string>();
    const noteIdMap = new Map<string, string>();
    let areasCount = 0;
    let notesCount = 0;
    let todosCount = 0;
    let whiteboardMigrated = false;

    // 1) Copy areas (new ids for target user)
    const { data: areas } = await supabase.from('areas').select('id, name, icon, is_default').eq('user_id', defaultId);
    if (areas?.length) {
      for (const a of areas) {
        const { data: inserted } = await supabase.from('areas').insert({
          user_id: userId,
          name: a.name,
          icon: a.icon ?? 'lightbulb',
          is_default: a.is_default ?? false,
        }).select('id').single();
        if (inserted?.id) {
          areaIdMap.set(a.id, inserted.id);
          areasCount++;
        }
      }
    }

    // 2) Copy notes (new ids for target user)
    const { data: notes } = await supabase.from('notes').select('id, title, content, position').eq('user_id', defaultId).order('position', { ascending: true });
    if (notes?.length) {
      for (const n of notes) {
        const { data: inserted } = await supabase.from('notes').insert({
          user_id: userId,
          title: n.title ?? '',
          content: n.content ?? '',
          position: n.position ?? 0,
        }).select('id').single();
        if (inserted?.id) {
          noteIdMap.set(n.id, inserted.id);
          notesCount++;
        }
      }
    }

    // 3) Copy todos with remapped area_id and note_id
    const { data: todos } = await supabase.from('todos').select('*').eq('user_id', defaultId);
    if (todos?.length) {
      for (const t of todos) {
        await supabase.from('todos').insert({
          user_id: userId,
          text: t.text ?? '',
          completed: t.completed ?? false,
          color: t.color ?? 'cyan',
          category: t.category ?? 'work',
          due_date: t.due_date ?? null,
          area_id: (t.area_id && areaIdMap.get(t.area_id)) || null,
          note_id: (t.note_id && noteIdMap.get(t.note_id)) || null,
        });
        todosCount++;
      }
    }

    // 4) Copy whiteboard
    const { data: wb } = await supabase.from('whiteboard').select('content').eq('user_id', defaultId).maybeSingle();
    if (wb?.content) {
      const { error: wbErr } = await supabase.from('whiteboard').upsert(
        { user_id: userId, content: wb.content, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      if (!wbErr) whiteboardMigrated = true;
    }

    res.status(200).json({
      migrated: { areas: areasCount, notes: notesCount, todos: todosCount, whiteboard: whiteboardMigrated },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Migration failed';
    console.error('[auth] migrate-from-default error:', e);
    res.status(500).json({ error: msg });
  }
});
