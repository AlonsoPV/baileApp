create table if not exists public.user_favorites (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('event', 'class')),
  event_date_id bigint null references public.events_date(id) on delete cascade,
  class_source_type text null check (class_source_type in ('teacher', 'academy')),
  class_source_id bigint null,
  class_cronograma_index integer null,
  class_item_id bigint null,
  created_at timestamptz not null default now(),
  check (
    (entity_type = 'event'
      and event_date_id is not null
      and class_source_type is null
      and class_source_id is null
      and class_cronograma_index is null
    )
    or
    (entity_type = 'class'
      and event_date_id is null
      and class_source_type is not null
      and class_source_id is not null
      and class_cronograma_index is not null
    )
  )
);

create unique index if not exists uq_user_favorites_event
on public.user_favorites(user_id, event_date_id)
where event_date_id is not null;

create unique index if not exists uq_user_favorites_class
on public.user_favorites(user_id, class_source_type, class_source_id, class_cronograma_index)
where entity_type = 'class';

create index if not exists idx_user_favorites_user_id
on public.user_favorites(user_id);

create index if not exists idx_user_favorites_event_date_id
on public.user_favorites(event_date_id);

create index if not exists idx_user_favorites_class_source
on public.user_favorites(class_source_type, class_source_id, class_cronograma_index);

alter table public.user_favorites enable row level security;
grant select, insert, delete on public.user_favorites to authenticated;
grant usage, select on sequence public.user_favorites_id_seq to authenticated;

drop policy if exists "user_favorites_select_own" on public.user_favorites;
create policy "user_favorites_select_own"
on public.user_favorites
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_favorites_insert_own" on public.user_favorites;
create policy "user_favorites_insert_own"
on public.user_favorites
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_favorites_delete_own" on public.user_favorites;
create policy "user_favorites_delete_own"
on public.user_favorites
for delete
to authenticated
using (auth.uid() = user_id);

