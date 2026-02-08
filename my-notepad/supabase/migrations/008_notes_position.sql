-- User-defined order/priority for notes (lower position = higher priority / first in list).
alter table public.notes
  add column if not exists position integer not null default 0;

-- Backfill: assign position by created_at (oldest first = 0, 1, 2, ...) per user.
with numbered as (
  select id, row_number() over (partition by user_id order by created_at asc) - 1 as rn
  from public.notes
)
update public.notes n
set position = numbered.rn
from numbered
where n.id = numbered.id;

create index if not exists notes_user_id_position_idx on public.notes (user_id, position);
