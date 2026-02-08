-- Add updated_at to notes and todos so every creation/update has created and updated dates.

alter table public.notes
  add column if not exists updated_at timestamptz not null default now();

alter table public.todos
  add column if not exists updated_at timestamptz not null default now();

-- Keep updated_at in sync on update (optional; backend can set it explicitly)
-- Supabase/Postgres: you can use a trigger or rely on the backend setting updated_at.
