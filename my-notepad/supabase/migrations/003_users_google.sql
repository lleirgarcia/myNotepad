-- Users table for Google OAuth (id = UUID used as user_id in todos/notes/whiteboard).
-- No FK to auth.users; backend creates/updates users on Google login.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  google_sub text not null unique,
  email text,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_google_sub_idx on public.users (google_sub);

alter table public.users enable row level security;
-- No policy = anon cannot access. Backend uses service_role and bypasses RLS.

comment on table public.users is 'App users from Google OAuth; backend uses service role to upsert.';
