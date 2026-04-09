-- Stage 1: métricas de academia por sesión exacta de clase.
-- Unidad de sesión: (class_id, fecha_especifica) con compatibilidad status='tentative'.

-- 1) Deduplicar antes de endurecer unicidad por sesión exacta.
with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, class_id, coalesce(fecha_especifica, '0001-01-01'::date)
      order by created_at asc, id asc
    ) as rn
  from public.clase_asistencias
)
delete from public.clase_asistencias ca
using ranked r
where ca.id = r.id
  and r.rn > 1;

-- 2) Unicidad robusta para sesión exacta (incluye null fecha_especifica).
create unique index if not exists idx_clase_asistencias_user_class_session_unique
  on public.clase_asistencias (user_id, class_id, coalesce(fecha_especifica, '0001-01-01'::date));

-- 3) Índices de lectura para métricas y consultas por sesión.
create index if not exists idx_clase_asistencias_class_status
  on public.clase_asistencias (class_id, status);

create index if not exists idx_clase_asistencias_class_fecha_status
  on public.clase_asistencias (class_id, fecha_especifica, status);

create index if not exists idx_clase_asistencias_user_class_fecha
  on public.clase_asistencias (user_id, class_id, fecha_especifica);

-- 4) RPC optimizada: métricas por sesión exacta para academia.
drop function if exists public.rpc_get_academy_class_metrics(bigint, date, date);

create or replace function public.rpc_get_academy_class_metrics(
  p_academy_id bigint,
  p_from date default null,
  p_to date default null
)
returns table(
  class_id bigint,
  class_session_date date,
  class_name text,
  dia_semana integer,
  dia_label text,
  hora_inicio text,
  total_alumnos bigint,
  leader_count bigint,
  follower_count bigint,
  ambos_count bigint,
  otros_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  cronograma_data jsonb;
begin
  if not (
    public.is_academy_owner(p_academy_id)
    or exists (
      select 1
      from public.role_requests rr
      where rr.user_id = auth.uid()
        and rr.role_slug = 'superadmin'
        and rr.status = 'aprobado'
    )
  ) then
    raise exception 'No tienes permisos para ver estas métricas';
  end if;

  select pa.cronograma into cronograma_data
  from public.profiles_academy pa
  where pa.id = p_academy_id;

  return query
  with attendance as (
    select
      ca.class_id,
      ca.fecha_especifica,
      ca.role_baile
    from public.clase_asistencias ca
    where ca.academy_id = p_academy_id
      and ca.status = 'tentative'
      and (p_from is null or ca.fecha_especifica is null or ca.fecha_especifica >= p_from)
      and (p_to is null or ca.fecha_especifica is null or ca.fecha_especifica <= p_to)
  ),
  attendance_enriched as (
    select
      a.class_id,
      a.fecha_especifica as class_session_date,
      coalesce(
        nullif(trim(co.obj->>'titulo'), ''),
        nullif(trim(co.obj->>'nombre'), ''),
        'Clase #' || a.class_id::text
      ) as class_name,
      coalesce(
        case
          when a.fecha_especifica is not null then extract(dow from a.fecha_especifica)::int
          when (co.obj->>'diaSemana') ~ '^\d+$' then (co.obj->>'diaSemana')::int
          when (co.obj->>'dia_semana') ~ '^\d+$' then (co.obj->>'dia_semana')::int
          else null
        end,
        null
      ) as dia_semana,
      nullif(trim(coalesce(co.obj->>'inicio', co.obj->>'hora_inicio', '')), '') as hora_inicio,
      a.role_baile
    from attendance a
    left join lateral (
      select e.obj, e.ord
      from jsonb_array_elements(coalesce(cronograma_data, '[]'::jsonb)) with ordinality as e(obj, ord)
      where (
        (e.obj->>'id') ~ '^\d+$'
        and (e.obj->>'id')::bigint = a.class_id
      )
      or (
        a.class_id % 1000 = 0
        and (a.class_id / 1000)::int = e.ord - 1
      )
      or (
        a.class_id < 1000
        and a.class_id::int = e.ord - 1
      )
      limit 1
    ) co on true
  )
  select
    ae.class_id,
    ae.class_session_date,
    ae.class_name,
    ae.dia_semana,
    case ae.dia_semana
      when 0 then 'domingo'
      when 1 then 'lunes'
      when 2 then 'martes'
      when 3 then 'miércoles'
      when 4 then 'jueves'
      when 5 then 'viernes'
      when 6 then 'sábado'
      else null
    end as dia_label,
    ae.hora_inicio,
    count(*)::bigint as total_alumnos,
    count(*) filter (where ae.role_baile in ('lead', 'leader'))::bigint as leader_count,
    count(*) filter (where ae.role_baile in ('follow', 'follower'))::bigint as follower_count,
    count(*) filter (where ae.role_baile = 'ambos')::bigint as ambos_count,
    count(*) filter (
      where ae.role_baile not in ('lead', 'leader', 'follow', 'follower', 'ambos')
         or ae.role_baile is null
    )::bigint as otros_count
  from attendance_enriched ae
  group by ae.class_id, ae.class_session_date, ae.class_name, ae.dia_semana, ae.hora_inicio
  order by ae.class_session_date nulls last, ae.class_name asc;
end;
$$;

grant execute on function public.rpc_get_academy_class_metrics(bigint, date, date) to authenticated;

