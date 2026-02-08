-- Notes entity: id, user_id, title (content optional for full note text).
-- Todos link to source note via note_id.

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now()
);

alter table if exists public.todos
  add column if not exists note_id uuid references public.notes(id) on delete set null;

create index if not exists notes_user_id_created_at_idx on public.notes (user_id, created_at desc);
create index if not exists todos_note_id_idx on public.todos (note_id);

-- RLS for notes (same pattern as todos: backend uses service role + DEFAULT_USER_ID)
alter table public.notes enable row level security;

create policy "Users can manage own notes"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
