-- Soporte de listas nombradas

alter table if exists public.trending_candidates
  add column if not exists list_name text;

-- Actualizar RPC para aceptar nombre de lista
drop function if exists public.rpc_trending_add_candidate(bigint, text, uuid, text, text, text);
create or replace function public.rpc_trending_add_candidate(
  p_trending_id bigint,
  p_ritmo_slug text,
  p_user_id uuid,
  p_display_name text default null,
  p_avatar_url text default null,
  p_bio_short text default null,
  p_list_name text default null
) returns void language plpgsql as $$
begin
  if not app_is_superadmin() then raise exception 'Solo superadmin'; end if;
  insert into public.trending_candidates (trending_id, ritmo_slug, user_id, display_name, avatar_url, bio_short, list_name)
  values (p_trending_id, p_ritmo_slug, p_user_id, p_display_name, p_avatar_url, p_bio_short, p_list_name)
  on conflict do nothing;
end;
$$;

-- Leaderboard con list_name
drop function if exists public.rpc_trending_leaderboard(bigint);
create or replace function public.rpc_trending_leaderboard(p_trending_id bigint)
returns table (
  candidate_id bigint,
  ritmo_slug text,
  user_id uuid,
  display_name text,
  avatar_url text,
  list_name text,
  votes bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id as candidate_id,
    c.ritmo_slug,
    c.user_id,
    coalesce(c.display_name, 'Sin nombre') as display_name,
    c.avatar_url,
    c.list_name,
    count(v.voter_user_id) as votes
  from public.trending_candidates c
  left join public.trending_votes v
    on v.trending_id = c.trending_id
   and v.candidate_id = c.id
  where c.trending_id = p_trending_id
  group by c.id, c.ritmo_slug, c.user_id, c.display_name, c.avatar_url, c.list_name
  order by c.ritmo_slug, coalesce(c.list_name, ''), votes desc, c.id asc;
$$;


