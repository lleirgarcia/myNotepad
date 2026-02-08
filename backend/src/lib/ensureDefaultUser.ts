import { getSupabaseAdmin } from './supabase.js';
import { config } from '../config.js';

/**
 * Ensures the DEFAULT_USER_ID has a row in the users table.
 * When using API key (no Google login), all data is stored under this user_id;
 * without a row in users, that data is "orphaned" and FK constraints would fail.
 * Call this at startup so the default user always exists.
 */
export async function ensureDefaultUser(): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('users').upsert(
      {
        id: config.defaultUserId,
        google_sub: `api-key-${config.defaultUserId}`,
        email: null,
        name: 'API Key User',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.warn('[ensureDefaultUser]', error.message, '(run migration 003_users_google.sql if needed)');
      return;
    }
    // Ensure default areas exist for API-key user (Work, Personal stuff, Ideas / thoughts)
    const { data: existingAreas } = await supabase
      .from('areas')
      .select('id')
      .eq('user_id', config.defaultUserId)
      .limit(1);
    if (!existingAreas?.length) {
      await supabase.from('areas').insert([
        { user_id: config.defaultUserId, name: 'Work', icon: 'briefcase', is_default: true },
        { user_id: config.defaultUserId, name: 'Personal stuff', icon: 'home', is_default: true },
        { user_id: config.defaultUserId, name: 'Ideas / thoughts', icon: 'lightbulb', is_default: true },
      ]);
    }
  } catch (e) {
    console.warn('[ensureDefaultUser]', e instanceof Error ? e.message : e);
  }
}
