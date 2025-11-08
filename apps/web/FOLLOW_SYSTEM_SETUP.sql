-- =====================================================================
-- FOLLOW / NOTIFICATION SYSTEM SETUP
-- =====================================================================
-- Creates the minimal schema required for the follow relationships and
-- user notifications as described in the product specification.
-- ---------------------------------------------------------------------

-- 1. FOLLOW RELATIONSHIPS ------------------------------------------------
create table if not exists public.follows (
  id            bigserial primary key,
  follower_id   uuid not null references profiles_user(user_id) on delete cascade,
  following_id  uuid not null references profiles_user(user_id) on delete cascade,
  created_at    timestamptz default now(),
  constraint follows_unique_pair unique (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

-- 2. PROFILE COUNTERS ----------------------------------------------------
alter table if exists public.profiles_user
  add column if not exists followers_count int default 0;

alter table if exists public.profiles_user
  add column if not exists following_count int default 0;

-- 3. FOLLOW COUNTER TRIGGER ----------------------------------------------
create or replace function public.update_follow_counts()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update profiles_user
      set followers_count = followers_count + 1
      where user_id = new.following_id;

    update profiles_user
      set following_count = following_count + 1
      where user_id = new.follower_id;

    return new;

  elsif (tg_op = 'DELETE') then
    update profiles_user
      set followers_count = greatest(followers_count - 1, 0)
      where user_id = old.following_id;

    update profiles_user
      set following_count = greatest(following_count - 1, 0)
      where user_id = old.follower_id;

    return old;
  end if;

  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_update_follow_counts on public.follows;

create trigger trg_update_follow_counts
after insert or delete on public.follows
for each row execute procedure public.update_follow_counts();

-- 4. NOTIFICATIONS TABLE -------------------------------------------------
create table if not exists public.notifications (
  id         bigserial primary key,
  user_id    uuid not null references profiles_user(user_id) on delete cascade,
  type       text not null,
  data       jsonb default '{}'::jsonb,
  is_read    boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user_unread
  on public.notifications(user_id)
  where is_read = false;


