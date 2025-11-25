-- Tabla para registrar asistencias tentativas a clases
create table if not exists public.clase_asistencias (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id bigint not null, -- referencia a la tabla de clases/event_dates
  academy_id bigint,        -- opcional: academia dueña de la clase
  role_baile text,          -- 'lead', 'follow', 'ambos', etc (del perfil del usuario)
  zona_tag_id bigint,       -- referencia a tags de zona (si aplica)
  status text not null default 'tentative', -- por ahora solo 'tentative'
  created_at timestamptz not null default now(),
  unique(user_id, class_id) -- un registro por usuario/clase
);

-- Índices de ayuda
create index if not exists idx_clase_asistencias_user on public.clase_asistencias(user_id);
create index if not exists idx_clase_asistencias_class on public.clase_asistencias(class_id);
create index if not exists idx_clase_asistencias_academy on public.clase_asistencias(academy_id);
create index if not exists idx_clase_asistencias_status on public.clase_asistencias(status);

-- RLS
alter table public.clase_asistencias enable row level security;

-- Eliminar políticas existentes si existen
drop policy if exists "insert own tentative attendance" on public.clase_asistencias;
drop policy if exists "select own attendance and superadmins can see all" on public.clase_asistencias;

-- Política: usuarios pueden insertar sus propias asistencias tentativas
create policy "insert own tentative attendance"
  on public.clase_asistencias
  for insert
  with check ( auth.uid() = user_id );

-- Política: usuarios pueden ver sus propias asistencias y superadmins pueden ver todas
-- Nota: Las academias verán sus métricas agregadas a través de vistas o funciones RPC
create policy "select own attendance and superadmins can see all"
  on public.clase_asistencias
  for select
  using (
    auth.uid() = user_id
    or
    (select exists (
      select 1 from public.role_requests 
      where user_id = auth.uid() 
      and role_slug = 'superadmin' 
      and status = 'aprobado'
    ))
  );

-- Función RPC para que academias vean sus métricas agregadas
create or replace function public.get_academy_class_metrics(p_academy_id bigint)
returns table (
  class_id bigint,
  total_tentativos bigint,
  por_rol jsonb
) 
language plpgsql
security definer
as $$
begin
  -- Verificar que el usuario es dueño de la academia o superadmin
  if not (
    exists (
      select 1 from public.profiles_academy 
      where id = p_academy_id 
      and user_id = auth.uid()
    )
    or
    exists (
      select 1 from public.role_requests 
      where user_id = auth.uid() 
      and role_slug = 'superadmin' 
      and status = 'aprobado'
    )
  ) then
    raise exception 'No tienes permisos para ver estas métricas';
  end if;

  return query
  select 
    ca.class_id,
    count(*)::bigint as total_tentativos,
    jsonb_build_object(
      'leader', count(*) filter (where ca.role_baile in ('lead', 'leader'))::bigint,
      'follower', count(*) filter (where ca.role_baile in ('follow', 'follower'))::bigint,
      'ambos', count(*) filter (where ca.role_baile = 'ambos')::bigint,
      'otros', count(*) filter (where ca.role_baile not in ('lead', 'leader', 'follow', 'follower', 'ambos') or ca.role_baile is null)::bigint
    ) as por_rol
  from public.clase_asistencias ca
  where ca.academy_id = p_academy_id
    and ca.status = 'tentative'
  group by ca.class_id;
end;
$$;

-- Comentarios
comment on table public.clase_asistencias is 'Registra asistencias tentativas de usuarios a clases cuando hacen click en "Agregar a calendario"';
comment on column public.clase_asistencias.status is 'Estado de la asistencia: tentative (por defecto)';
comment on column public.clase_asistencias.role_baile is 'Rol de baile del usuario: lead, follow, ambos';
comment on column public.clase_asistencias.class_id is 'ID de la clase (puede ser event_dates.id o referencia a cronograma)';
comment on column public.clase_asistencias.academy_id is 'ID de la academia dueña de la clase (opcional)';
comment on function public.get_academy_class_metrics is 'Permite a las academias ver métricas agregadas de sus clases (solo dueños o superadmins)';

