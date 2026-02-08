-- Allow users created by email/password (no Google).
-- google_sub: nullable for email users; password_hash: set only for email users.

alter table public.users
  alter column google_sub drop not null;

alter table public.users
  add column if not exists password_hash text;

create unique index if not exists users_email_lower_unique
  on public.users (lower(email))
  where email is not null and email != '';

comment on column public.users.password_hash is 'Only set for email/password users; null for Google OAuth users.';
