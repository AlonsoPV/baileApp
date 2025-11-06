-- ================================================
-- Helpers
-- ================================================
create or replace function app_current_role()
returns text
language sql stable
as $$
  select ur.role_slug
  from public.user_roles ur
  where ur.user_id = auth.uid()
  limit 1;
$$;

create or replace function app_is_superadmin()
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role_slug = 'superadmin'
  );
$$;

-- ================================================
-- Tablas Trending
-- ================================================
create table if not exists public.trendings (
  id                bigserial primary key,
  title             text not null,
  description       text,
  status            text not null default 'draft' check (status in ('draft','open','closed','archived')),
  starts_at         timestamptz,
  ends_at           timestamptz,
  allowed_vote_mode text not null default 'per_candidate' check (allowed_vote_mode in ('per_candidate','per_ritmo')),
  created_by        uuid not null references auth.users(id) on delete restrict,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint ck_trending_window check (
    (starts_at is null and ends_at is null)
    or (starts_at is null and ends_at is not null)
    or (starts_at is not null and ends_at is null)
    or (starts_at is not null and ends_at is not null and starts_at < ends_at)
  )
);

create index if not exists idx_trendings_status on public.trendings(status);
create index if not exists idx_trendings_window on public.trendings(starts_at, ends_at);

create table if not exists public.trending_ritmos (
  id           bigserial primary key,
  trending_id  bigint not null references public.trendings(id) on delete cascade,
  ritmo_slug   text not null
);
create unique index if not exists u_trending_ritmo on public.trending_ritmos(trending_id, ritmo_slug);

create table if not exists public.trending_candidates (
  id              bigserial primary key,
  trending_id     bigint not null references public.trendings(id) on delete cascade,
  ritmo_slug      text not null,
  user_id         uuid not null references auth.users(id) on delete cascade,
  display_name    text,
  avatar_url      text,
  bio_short       text,
  created_at      timestamptz not null default now()
);
create unique index if not exists u_trending_candidate on public.trending_candidates(trending_id, ritmo_slug, user_id);
-- índice auxiliar para FKs compuestas desde votos
create unique index if not exists u_trending_candidate_pair on public.trending_candidates(trending_id, id);
create index if not exists idx_candidates_ritmo on public.trending_candidates(trending_id, ritmo_slug);

-- Votos (NO expone datos personales por SELECT público)
create table if not exists public.trending_votes (
  trending_id     bigint not null,
  candidate_id    bigint not null,
  voter_user_id   uuid not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  ip              inet,
  primary key (trending_id, candidate_id, voter_user_id),
  -- Enforce: el candidate debe pertenecer a ese trending
  constraint fk_vote_candidate_belongs
    foreign key (trending_id, candidate_id)
    references public.trending_candidates(trending_id, id)
    on delete cascade
);
-- útiles para validaciones y conteos
create index if not exists idx_votes_candidate on public.trending_votes(candidate_id);
create index if not exists idx_votes_voter on public.trending_votes(voter_user_id);
create index if not exists idx_votes_trending_voter on public.trending_votes(trending_id, voter_user_id);

-- Timestamps
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_trendings_updated_at on public.trendings;
create trigger trg_trendings_updated_at
before update on public.trendings
for each row execute function set_updated_at();

-- ================================================
-- Trigger validación votos (ventana + modo + pertenencia)
-- ================================================
create or replace function trg_validate_vote()
returns trigger language plpgsql as $$
declare
  v_status text;
  v_starts timestamptz;
  v_ends   timestamptz;
  v_mode   text;
  v_candidate_ritmo text;
  v_candidate_trending bigint;
  v_conflict int;
begin
  -- trending existe y está abierto/ventana válida
  select t.status, t.starts_at, t.ends_at, t.allowed_vote_mode
    into v_status, v_starts, v_ends, v_mode
  from public.trendings t
  where t.id = new.trending_id;

  if v_status is null then
    raise exception 'Trending no existe';
  end if;
  if v_status <> 'open' then
    raise exception 'Votación no está abierta';
  end if;
  if v_starts is not null and now() < v_starts then
    raise exception 'Aún no inicia la votación';
  end if;
  if v_ends is not null and now() > v_ends then
    raise exception 'La votación ya cerró';
  end if;

  -- candidato debe existir y pertenecer al mismo trending (protege per_candidate/per_ritmo)
  select c.ritmo_slug, c.trending_id
    into v_candidate_ritmo, v_candidate_trending
  from public.trending_candidates c
  where c.id = new.candidate_id;

  if v_candidate_trending is null then
    raise exception 'Candidato inválido';
  end if;
  if v_candidate_trending <> new.trending_id then
    raise exception 'Candidato no pertenece a este trending';
  end if;

  -- regla per_ritmo: un voto por ritmo por usuario
  if v_mode = 'per_ritmo' then
    select count(*) into v_conflict
    from public.trending_votes v
    join public.trending_candidates c2 on c2.id = v.candidate_id
    where v.trending_id = new.trending_id
      and v.voter_user_id = new.voter_user_id
      and c2.ritmo_slug = v_candidate_ritmo
      and v.candidate_id <> new.candidate_id;

    if v_conflict > 0 then
      raise exception 'Ya votaste en este ritmo';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_before_insert_vote on public.trending_votes;
create trigger trg_before_insert_vote
before insert on public.trending_votes
for each row execute function trg_validate_vote();

-- ================================================
-- RLS
-- ================================================
alter table public.trendings enable row level security;
alter table public.trending_ritmos enable row level security;
alter table public.trending_candidates enable row level security;
alter table public.trending_votes enable row level security;

-- Lectura pública
drop policy if exists sel_trendings_public on public.trendings;
create policy sel_trendings_public on public.trendings
for select using (true);

drop policy if exists sel_tritmos_public on public.trending_ritmos;
create policy sel_tritmos_public on public.trending_ritmos
for select using (true);

drop policy if exists sel_candidates_public on public.trending_candidates;
create policy sel_candidates_public on public.trending_candidates
for select using (true);

-- ⚠️ PRIVACIDAD: NO expongas votos crudos
-- (Elimina la policy pública anterior si existía)
drop policy if exists sel_votes_public on public.trending_votes;

-- Inserción/Borrado de votos
drop policy if exists ins_votes_auth on public.trending_votes;
create policy ins_votes_auth on public.trending_votes
for insert to authenticated
with check (auth.uid() = voter_user_id);

drop policy if exists del_own_vote on public.trending_votes;
create policy del_own_vote on public.trending_votes
for delete to authenticated
using (auth.uid() = voter_user_id);

-- ================================================
-- RPCs (admin + voto)
-- ================================================
create or replace function rpc_trending_create(
  p_title text,
  p_description text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_allowed_vote_mode text default 'per_candidate'
) returns bigint language plpgsql as $$
declare v_id bigint;
begin
  if not app_is_superadmin() then
    raise exception 'Solo superadmin puede crear';
  end if;

  insert into public.trendings(title, description, starts_at, ends_at, allowed_vote_mode, created_by)
  values (p_title, p_description, p_starts_at, p_ends_at, coalesce(p_allowed_vote_mode,'per_candidate'), auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function rpc_trending_publish(p_trending_id bigint)
returns void language plpgsql as $$
declare v_status text;
begin
  if not app_is_superadmin() then raise exception 'Solo superadmin'; end if;
  select status into v_status from public.trendings where id = p_trending_id for update;
  if v_status is null then raise exception 'No existe trending'; end if;
  update public.trendings set status = 'open' where id = p_trending_id;
end;
$$;

create or replace function rpc_trending_close(p_trending_id bigint)
returns void language plpgsql as $$
declare v_status text;
begin
  if not app_is_superadmin() then raise exception 'Solo superadmin'; end if;
  select status into v_status from public.trendings where id = p_trending_id for update;
  if v_status is null then raise exception 'No existe trending'; end if;
  update public.trendings set status = 'closed' where id = p_trending_id;
end;
$$;

create or replace function rpc_trending_add_ritmo(p_trending_id bigint, p_ritmo_slug text)
returns void language plpgsql as $$
begin
  if not app_is_superadmin() then raise exception 'Solo superadmin'; end if;
  insert into public.trending_ritmos(trending_id, ritmo_slug)
  values (p_trending_id, p_ritmo_slug)
  on conflict do nothing;
end;
$$;

create or replace function rpc_trending_add_candidate(
  p_trending_id bigint,
  p_ritmo_slug text,
  p_user_id uuid,
  p_display_name text default null,
  p_avatar_url text default null,
  p_bio_short text default null
) returns void language plpgsql as $$
begin
  if not app_is_superadmin() then raise exception 'Solo superadmin'; end if;
  insert into public.trending_candidates (trending_id, ritmo_slug, user_id, display_name, avatar_url, bio_short)
  values (p_trending_id, p_ritmo_slug, p_user_id, p_display_name, p_avatar_url, p_bio_short)
  on conflict do nothing;
end;
$$;

drop function if exists rpc_trending_vote(bigint, bigint);
create or replace function rpc_trending_vote(p_trending_id bigint, p_candidate_id bigint)
returns void language plpgsql as $$
declare
  v_exists boolean;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  -- toggle: si existe, borrar; si no existe, insertar
  select exists (
    select 1 from public.trending_votes
    where trending_id = p_trending_id and candidate_id = p_candidate_id and voter_user_id = auth.uid()
  ) into v_exists;

  if v_exists then
    delete from public.trending_votes
    where trending_id = p_trending_id and candidate_id = p_candidate_id and voter_user_id = auth.uid();
  else
    insert into public.trending_votes(trending_id, candidate_id, voter_user_id)
    values (p_trending_id, p_candidate_id, auth.uid())
    on conflict do nothing;
  end if;
end;
$$;

-- Leaderboard con SECURITY DEFINER (no expone votes por SELECT)
drop function if exists rpc_trending_leaderboard(bigint);
create or replace function rpc_trending_leaderboard(p_trending_id bigint)
returns table (
  candidate_id bigint,
  ritmo_slug text,
  user_id uuid,
  display_name text,
  avatar_url text,
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
    count(v.voter_user_id) as votes
  from public.trending_candidates c
  left join public.trending_votes v
    on v.trending_id = c.trending_id
   and v.candidate_id = c.id
  where c.trending_id = p_trending_id
  group by c.id, c.ritmo_slug, c.user_id, c.display_name, c.avatar_url
  order by c.ritmo_slug, votes desc, c.id asc;
$$;

-- Permisos de ejecución para clientes
grant execute on function rpc_trending_leaderboard(bigint) to anon, authenticated;
grant execute on function rpc_trending_vote(bigint, bigint) to authenticated;
grant execute on function rpc_trending_create(text, text, timestamptz, timestamptz, text) to authenticated;
grant execute on function rpc_trending_publish(bigint) to authenticated;
grant execute on function rpc_trending_close(bigint) to authenticated;
grant execute on function rpc_trending_add_ritmo(bigint, text) to authenticated;
grant execute on function rpc_trending_add_candidate(bigint, text, uuid, text, text, text) to authenticated;

-- Update trending (admin)
drop function if exists rpc_trending_update(bigint, text, text, timestamptz, timestamptz, text, text);
create or replace function rpc_trending_update(
  p_trending_id bigint,
  p_title text,
  p_description text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_allowed_vote_mode text,
  p_cover_url text
) returns void language plpgsql as $$
begin
  if not app_is_superadmin() then raise exception 'Solo superadmin'; end if;
  update public.trendings
  set title = coalesce(p_title, title),
      description = p_description,
      starts_at = p_starts_at,
      ends_at = p_ends_at,
      allowed_vote_mode = coalesce(p_allowed_vote_mode, allowed_vote_mode),
      updated_at = now(),
      -- cover_url puede ser null explícitamente para limpiar
      cover_url = p_cover_url
  where id = p_trending_id;
end;
$$;

grant execute on function rpc_trending_update(bigint, text, text, timestamptz, timestamptz, text, text) to authenticated;


