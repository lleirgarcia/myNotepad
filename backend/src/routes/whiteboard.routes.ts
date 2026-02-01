import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../lib/supabase.js';
import type { RequestWithUserId } from '../middleware/apiKeyAuth.js';

const whiteboardRouter = Router();

function getUserId(req: Request): string {
  return (req as RequestWithUserId).userId;
}

function handleSupabaseError(res: Response, error: { message?: string }): boolean {
  const msg = error?.message ?? '';
  if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
    res.status(503).json({
      error: 'Cannot reach Supabase. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend .env, and that the backend can reach the internet.',
    });
    return true;
  }
  res.status(400).json({ error: msg || 'Supabase error' });
  return true;
}

whiteboardRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('whiteboard')
      .select('content')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      handleSupabaseError(res, error);
      return;
    }
    res.json({ content: data?.content ?? '' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch whiteboard';
    if (msg.includes('fetch failed')) {
      res.status(503).json({
        error: 'Cannot reach Supabase. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend .env, and that the backend can reach the internet.',
      });
      return;
    }
    res.status(500).json({ error: msg });
  }
});

whiteboardRouter.put('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const content = typeof req.body?.content === 'string' ? req.body.content : '';
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('whiteboard').upsert(
      { user_id: userId, content, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    if (error) {
      handleSupabaseError(res, error);
      return;
    }
    res.status(204).send();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to save whiteboard';
    if (msg.includes('fetch failed')) {
      res.status(503).json({
        error: 'Cannot reach Supabase. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend .env, and that the backend can reach the internet.',
      });
      return;
    }
    res.status(500).json({ error: msg });
  }
});

export { whiteboardRouter };
