-- Run this in Supabase Dashboard → SQL Editor (personal use: API key + DEFAULT_USER_ID)
-- user_id is a UUID for scoping only (no FK to auth.users when using backend API key).

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  text text not null,
  completed boolean not null default false,
  color text not null check (color in ('red', 'yellow', 'cyan')),
  category text not null default 'work',
  due_date timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.whiteboard (
  user_id uuid primary key,
  content text not null default '',
  updated_at timestamptz not null default now()
);

-- Row Level Security: users only see/edit their own data
alter table public.todos enable row level security;
alter table public.whiteboard enable row level security;

create policy "Users can manage own todos"
  on public.todos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own whiteboard"
  on public.whiteboard for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Optional: index for listing todos by user
create index if not exists todos_user_id_created_at_idx on public.todos (user_id, created_at desc);
