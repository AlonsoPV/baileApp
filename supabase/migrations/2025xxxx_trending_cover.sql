-- Agregar portada y actualizar RPC de creación para aceptar cover_url

alter table if exists public.trendings
  add column if not exists cover_url text;

create or replace function rpc_trending_create(
  p_title text,
  p_description text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_allowed_vote_mode text default 'per_candidate',
  p_cover_url text default null
) returns bigint language plpgsql as $$
declare v_id bigint;
begin
  if not app_is_superadmin() then
    raise exception 'Solo superadmin puede crear';
  end if;

  insert into public.trendings(title, description, starts_at, ends_at, allowed_vote_mode, cover_url, created_by)
  values (p_title, p_description, p_starts_at, p_ends_at, coalesce(p_allowed_vote_mode,'per_candidate'), p_cover_url, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;


