import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../lib/supabase.js';
import type { RequestWithUserId } from '../middleware/apiKeyAuth.js';

const todosRouter = Router();

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

function mapRowToTodo(row: {
  id: string;
  text: string;
  completed: boolean;
  color: string;
  category: string;
  due_date: string | null;
  note_id?: string | null;
  created_at: string;
  notes?: { title: string } | null;
}) {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    color: row.color,
    category: row.category,
    dueDate: row.due_date ? new Date(row.due_date).getTime() : null,
    noteId: row.note_id ?? null,
    noteTitle: row.notes?.title ?? null,
    createdAt: new Date(row.created_at).getTime(),
  };
}

todosRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('todos')
      .select('*, notes(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      handleSupabaseError(res, error);
      return;
    }
    res.json((data ?? []).map(mapRowToTodo));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch todos';
    if (msg.includes('fetch failed')) {
      res.status(503).json({
        error: 'Cannot reach Supabase. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend .env, and that the backend can reach the internet.',
      });
      return;
    }
    res.status(500).json({ error: msg });
  }
});

todosRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const body = req.body as {
      text?: string;
      color?: string;
      category?: string;
      dueDate?: number | null;
      noteId?: string | null;
    };
    if (!body.text?.trim()) {
      res.status(400).json({ error: 'text required' });
      return;
    }
    const supabase = getSupabaseAdmin();
    const row = {
      user_id: userId,
      text: body.text.trim(),
      completed: false,
      color: body.color ?? 'cyan',
      category: body.category ?? 'work',
      due_date: body.dueDate ? new Date(body.dueDate).toISOString() : null,
      note_id: body.noteId?.trim() || null,
    };
    const { data, error } = await supabase.from('todos').insert(row).select('*, notes(title)').single();
    if (error) {
      handleSupabaseError(res, error);
      return;
    }
    res.status(201).json(mapRowToTodo(data));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create todo';
    if (msg.includes('fetch failed')) {
      res.status(503).json({
        error: 'Cannot reach Supabase. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend .env.',
      });
      return;
    }
    res.status(500).json({ error: msg });
  }
});

const PRIORITY_COLORS = ['red', 'yellow', 'cyan'] as const;

todosRouter.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const id = req.params.id;
    const body = req.body as { completed?: boolean; text?: string; color?: string };
    const update: Record<string, unknown> = {};
    if (typeof body.completed === 'boolean') update.completed = body.completed;
    if (typeof body.text === 'string') update.text = body.text;
    if (typeof body.color === 'string' && PRIORITY_COLORS.includes(body.color as 'red' | 'yellow' | 'cyan')) {
      update.color = body.color;
    }
    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: 'No updates provided' });
      return;
    }
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('todos')
      .update(update)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, notes(title)')
      .single();
    if (error) {
      handleSupabaseError(res, error);
      return;
    }
    res.json(mapRowToTodo(data));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update todo';
    if (msg.includes('fetch failed')) {
      res.status(503).json({
        error: 'Cannot reach Supabase. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend .env.',
      });
      return;
    }
    res.status(500).json({ error: msg });
  }
});

todosRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const id = req.params.id;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('todos').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      handleSupabaseError(res, error);
      return;
    }
    res.status(204).send();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to delete todo';
    if (msg.includes('fetch failed')) {
      res.status(503).json({
        error: 'Cannot reach Supabase. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend .env.',
      });
      return;
    }
    res.status(500).json({ error: msg });
  }
});

export { todosRouter };
