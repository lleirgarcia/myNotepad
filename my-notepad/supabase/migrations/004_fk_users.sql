-- Optional: link notes, todos and whiteboard to users table (referential integrity).
-- Run 003_users_google.sql first.
--
-- The backend creates the "default user" (DEFAULT_USER_ID from .env) automatically
-- at startup when you use API key auth. So either:
--   1) Start the backend once (it will insert the row), then run this migration, or
--   2) Manually insert: insert into public.users (id, google_sub, email, name)
--      values ('YOUR-DEFAULT-USER-ID', 'api-key-YOUR-DEFAULT-USER-ID', null, 'API Key User');

alter table public.notes
  add constraint notes_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.todos
  add constraint todos_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

alter table public.whiteboard
  add constraint whiteboard_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;
