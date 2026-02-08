-- Areas per user (custom categories). When a user is created, 3 default areas are inserted by the backend.
-- This migration creates the table and backfills default areas for existing users.

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  icon text not null default 'lightbulb',
  created_at timestamptz not null default now()
);

create index if not exists areas_user_id_idx on public.areas (user_id);

alter table public.areas enable row level security;
-- Backend uses service_role; no policy needed for API-only access.

-- Link todos to areas (nullable for backward compat; new todos should set area_id).
alter table public.todos
  add column if not exists area_id uuid references public.areas(id) on delete set null;

create index if not exists todos_area_id_idx on public.todos (area_id);

-- Insert 3 default areas for every user that has none yet.
insert into public.areas (user_id, name, icon)
select u.id, a.name, a.icon
from public.users u
cross join (values
  ('Work', 'briefcase'),
  ('Personal stuff', 'home'),
  ('Ideas / thoughts', 'lightbulb')
) as a(name, icon)
where not exists (select 1 from public.areas a2 where a2.user_id = u.id);
