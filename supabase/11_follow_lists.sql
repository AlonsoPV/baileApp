-- ===========================================
-- 📌 Public RPCs para obtener listas de seguidores y seguidos
--    Evitamos restricciones de RLS sobre la tabla follows.
-- ===========================================

create or replace function public.get_following_profiles(p_user_id uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text
)
language sql
security definer
set search_path = public
as $$
  select
    pu.user_id,
    pu.display_name,
    pu.avatar_url
  from public.follows f
  join public.profiles_user pu
    on pu.user_id = f.following_id
  where f.follower_id = p_user_id;
$$;

create or replace function public.get_follower_profiles(p_user_id uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text
)
language sql
security definer
set search_path = public
as $$
  select
    pu.user_id,
    pu.display_name,
    pu.avatar_url
  from public.follows f
  join public.profiles_user pu
    on pu.user_id = f.follower_id
  where f.following_id = p_user_id;
$$;

grant execute on function public.get_following_profiles(uuid) to anon, authenticated;
grant execute on function public.get_follower_profiles(uuid) to anon, authenticated;

