import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../lib/supabase.js';
import type { RequestWithUserId } from '../middleware/apiKeyAuth.js';

const notesRouter = Router();

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

function mapRowToNote(row: {
  id: string;
  title: string;
  content: string;
  position?: number;
  created_at: string;
  updated_at?: string;
}) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    position: typeof row.position === 'number' ? row.position : 0,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : new Date(row.created_at).getTime(),
  };
}

notesRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) {
      handleSupabaseError(res, error);
      return;
    }
    res.json((data ?? []).map(mapRowToNote));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch notes';
    if (msg.includes('fetch failed')) {
      res.status(503).json({
        error: 'Cannot reach Supabase. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend .env, and that the backend can reach the internet.',
      });
      return;
    }
    res.status(500).json({ error: msg });
  }
});

notesRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const id = req.params.id;
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      handleSupabaseError(res, error);
      return;
    }
    if (!data) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.json(mapRowToNote(data));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch note';
    if (msg.includes('fetch failed')) {
      res.status(503).json({
        error: 'Cannot reach Supabase. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend .env, and that the backend can reach the internet.',
      });
      return;
    }
    res.status(500).json({ error: msg });
  }
});

notesRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const body = req.body as { title?: string; content?: string };
    if (!body.title?.trim()) {
      res.status(400).json({ error: 'title required' });
      return;
    }
    const supabase = getSupabaseAdmin();
    const { data: maxRow } = await supabase
      .from('notes')
      .select('position')
      .eq('user_id', userId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextPosition = (maxRow?.position ?? -1) + 1;
    const row = {
      user_id: userId,
      title: body.title.trim(),
      content: typeof body.content === 'string' ? body.content : '',
      position: nextPosition,
    };
    const { data, error } = await supabase.from('notes').insert(row).select().single();
    if (error) {
      handleSupabaseError(res, error);
      return;
    }
    res.status(201).json(mapRowToNote(data));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create note';
    if (msg.includes('fetch failed')) {
      res.status(503).json({
        error: 'Cannot reach Supabase. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend .env.',
      });
      return;
    }
    res.status(500).json({ error: msg });
  }
});

notesRouter.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const id = req.params.id;
    const body = req.body as { title?: string; content?: string };
    const update: Record<string, unknown> = {};
    if (typeof body.title === 'string') update.title = body.title.trim();
    if (typeof body.content === 'string') update.content = body.content;
    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: 'No updates provided' });
      return;
    }
    update.updated_at = new Date().toISOString();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('notes')
      .update(update)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) {
      handleSupabaseError(res, error);
      return;
    }
    res.json(mapRowToNote(data));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update note';
    if (msg.includes('fetch failed')) {
      res.status(503).json({
        error: 'Cannot reach Supabase. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend .env.',
      });
      return;
    }
    res.status(500).json({ error: msg });
  }
});

/** PUT /api/notes/reorder — set custom order. Body: { orderedIds: string[] } (note ids in desired order). */
notesRouter.put('/reorder', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const body = req.body as { orderedIds?: string[] };
    const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds.filter((id) => typeof id === 'string') : [];
    if (orderedIds.length === 0) {
      res.status(400).json({ error: 'orderedIds required (non-empty array of note ids)' });
      return;
    }
    const supabase = getSupabaseAdmin();
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabase
        .from('notes')
        .update({ position: i, updated_at: new Date().toISOString() })
        .eq('id', orderedIds[i])
        .eq('user_id', userId);
      if (error) {
        handleSupabaseError(res, error);
        return;
      }
    }
    res.status(204).send();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to reorder notes';
    res.status(500).json({ error: msg });
  }
});

notesRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const id = req.params.id;
    const supabase = getSupabaseAdmin();
    // Delete all todos linked to this note, then delete the note
    const { error: todosError } = await supabase
      .from('todos')
      .delete()
      .eq('note_id', id)
      .eq('user_id', userId);
    if (todosError) {
      handleSupabaseError(res, todosError);
      return;
    }
    const { error } = await supabase.from('notes').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      handleSupabaseError(res, error);
      return;
    }
    res.status(204).send();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to delete note';
    if (msg.includes('fetch failed')) {
      res.status(503).json({
        error: 'Cannot reach Supabase. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend .env.',
      });
      return;
    }
    res.status(500).json({ error: msg });
  }
});

export { notesRouter };
