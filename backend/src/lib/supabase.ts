import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

/** Supabase admin client (service role). Bypasses RLS. Use for todos/whiteboard with DEFAULT_USER_ID. */
export function getSupabaseAdmin(): SupabaseClient {
  return createClient(config.supabase.url, config.supabase.serviceRoleKey);
}
