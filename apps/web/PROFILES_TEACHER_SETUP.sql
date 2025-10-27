-- Tabla de perfiles de maestro (profiles_teacher)
create table if not exists public.profiles_teacher (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  nombre_publico text not null,
  bio text,
  avatar_url text,
  portada_url text,
  ritmos bigint[] default '{}',
  zonas bigint[] default '{}',
  redes_sociales jsonb default '{}'::jsonb,
  media jsonb default '[]'::jsonb,
  faq jsonb default '[]'::jsonb,
  estado_aprobacion text default 'borrador' check (estado_aprobacion in ('borrador','en_revision','aprobado','rechazado')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger updated_at
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_teacher_updated on public.profiles_teacher;
create trigger trg_profiles_teacher_updated
before update on public.profiles_teacher
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.profiles_teacher enable row level security;

create policy teacher_select_public_or_owner on public.profiles_teacher
  for select using (estado_aprobacion = 'aprobado' or user_id = auth.uid());

create policy teacher_insert_owner on public.profiles_teacher
  for insert with check (user_id = auth.uid());

create policy teacher_update_owner on public.profiles_teacher
  for update using (user_id = auth.uid());

-- Vista pública opcional
create or replace view public.v_teachers_public as
select id, nombre_publico, bio, avatar_url, portada_url, ritmos, zonas, redes_sociales, media, faq, created_at
from public.profiles_teacher
where estado_aprobacion = 'aprobado';

-- Sugerencia de buckets (crear en Storage):
-- teacher-avatars (public)
-- teacher-media (public)


