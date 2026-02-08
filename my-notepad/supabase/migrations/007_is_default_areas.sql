-- Mark the 3 default areas (created on signup) so they cannot be deleted by the user.
alter table public.areas
  add column if not exists is_default boolean not null default false;

update public.areas
set is_default = true
where name in ('Work', 'Personal stuff', 'Ideas / thoughts');
