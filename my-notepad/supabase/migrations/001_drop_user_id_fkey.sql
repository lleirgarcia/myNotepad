-- Run this in Supabase Dashboard → SQL Editor
-- Fixes: "insert or update on table todos violates foreign key constraint todos_user_id_fkey"
-- Backend uses DEFAULT_USER_ID (any UUID), not a real auth user, so we drop the FK.

alter table if exists public.todos
  drop constraint if exists todos_user_id_fkey;

alter table if exists public.whiteboard
  drop constraint if exists whiteboard_user_id_fkey;
