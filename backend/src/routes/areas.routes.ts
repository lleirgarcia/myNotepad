import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../lib/supabase.js';
import type { RequestWithUserId } from '../middleware/apiKeyAuth.js';

const areasRouter = Router();

function getUserId(req: Request): string {
  return (req as RequestWithUserId).userId;
}

function handleSupabaseError(res: Response, error: { message?: string }): boolean {
  const msg = error?.message ?? '';
  if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
    res.status(503).json({
      error: 'Cannot reach Supabase. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend .env.',
    });
    return true;
  }
  res.status(400).json({ error: msg || 'Supabase error' });
  return true;
}

function mapRowToArea(row: { id: string; name: string; icon: string; created_at: string; is_default?: boolean }) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    isDefault: Boolean(row.is_default),
    createdAt: new Date(row.created_at).getTime(),
  };
}

/** GET /api/areas — list areas for the current user */
areasRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) {
      handleSupabaseError(res, error);
      return;
    }
    res.json((data ?? []).map(mapRowToArea));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch areas';
    res.status(500).json({ error: msg });
  }
});

const VALID_ICONS = [
  'briefcase', 'heart', 'users', 'home', 'dumbbell', 'lightbulb',
  'star', 'coffee', 'book-open', 'plane', 'shopping-cart', 'music',
  'graduation-cap', 'laptop', 'mail', 'camera', 'car', 'utensils-crossed',
  'palette', 'target', 'trophy', 'baby', 'dog', 'flower2', 'gamepad2',
  'wallet', 'building2', 'leaf', 'mountain', 'sun', 'moon',
] as const;
const MAX_AREAS_PER_USER = 6;

/** POST /api/areas — create a new area (name required, icon optional). Max 6 areas per user. */
areasRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const body = req.body as { name?: string; icon?: string };
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      res.status(400).json({ error: 'name required' });
      return;
    }
    const supabase = getSupabaseAdmin();
    const { count, error: countError } = await supabase
      .from('areas')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (countError) {
      handleSupabaseError(res, countError);
      return;
    }
    if ((count ?? 0) >= MAX_AREAS_PER_USER) {
      res.status(400).json({ error: `Maximum ${MAX_AREAS_PER_USER} areas allowed` });
      return;
    }
    const icon = typeof body.icon === 'string' && VALID_ICONS.includes(body.icon as (typeof VALID_ICONS)[number])
      ? body.icon
      : 'lightbulb';
    const row = { user_id: userId, name: name.slice(0, 80), icon };
    const { data, error } = await supabase.from('areas').insert(row).select().single();
    if (error) {
      handleSupabaseError(res, error);
      return;
    }
    res.status(201).json(mapRowToArea(data));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to create area';
    res.status(500).json({ error: msg });
  }
});

const PERSONAL_STUFF_NAME = 'Personal stuff';

/** DELETE /api/areas/:id — delete a non-default area. Todos in this area are reassigned to "Personal stuff". */
areasRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!id) {
      res.status(400).json({ error: 'Area id required' });
      return;
    }
    const supabase = getSupabaseAdmin();
    const { data: area, error: fetchError } = await supabase
      .from('areas')
      .select('id, is_default')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (fetchError || !area) {
      res.status(404).json({ error: 'Area not found' });
      return;
    }
    if (area.is_default) {
      res.status(400).json({ error: 'Default areas cannot be deleted' });
      return;
    }
    const { data: personalArea } = await supabase
      .from('areas')
      .select('id')
      .eq('user_id', userId)
      .eq('name', PERSONAL_STUFF_NAME)
      .limit(1)
      .single();
    const personalId = personalArea?.id ?? null;
    if (personalId) {
      await supabase.from('todos').update({ area_id: personalId }).eq('area_id', id).eq('user_id', userId);
    } else {
      await supabase.from('todos').update({ area_id: null }).eq('area_id', id).eq('user_id', userId);
    }
    const { error: deleteError } = await supabase.from('areas').delete().eq('id', id).eq('user_id', userId);
    if (deleteError) {
      handleSupabaseError(res, deleteError);
      return;
    }
    res.status(204).send();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to delete area';
    res.status(500).json({ error: msg });
  }
});

export { areasRouter };
