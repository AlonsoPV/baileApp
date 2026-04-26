-- Banderas atómicas: asistencia, pago y tipo de pago. Independientes entre sí; status legacy se mantiene alineado.
-- Definir helper aquí para que la migración sea aplicable aunque no exista
-- 20260410170000_class_attendance_status_extension.sql (p. ej. entorno remoto mínimo).

create or replace function public.normalize_class_attendance_status(p_status text)
returns text
language sql
immutable
as $$
  select case lower(coalesce(trim(p_status), ''))
    when 'tentative' then 'tentative'
    when 'tentativa' then 'tentative'
    when 'attended' then 'attended'
    when 'asistio' then 'attended'
    when 'asistió' then 'attended'
    when 'pagado' then 'pagado'
    when 'paid' then 'pagado'
    when 'cancelado' then 'cancelado'
    when 'cancelled' then 'cancelado'
    when 'canceled' then 'cancelado'
    when 'no_show' then 'no_show'
    when 'noshow' then 'no_show'
    when '' then 'unknown'
    else lower(trim(p_status))
  end;
$$;

comment on function public.normalize_class_attendance_status(text) is
'Normaliza estados historicos de clase_asistencias a un conjunto canonico: tentative, attended, pagado, cancelado, no_show.';

-- Permisos usados por RPCs (suelen existir vía 10_verify / migraciones; aquí se asegura el despliegue aislado).
create or replace function public.is_academy_owner(p_academy_id bigint)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles_academy pa
    where pa.id = p_academy_id
      and pa.user_id = auth.uid()
  );
$$;

comment on function public.is_academy_owner(bigint) is
'Verifica si el usuario actual es dueño de la academia.';

create or replace function public.is_teacher_owner(p_teacher_id bigint)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles_teacher pt
    where pt.id = p_teacher_id
      and pt.user_id = auth.uid()
  );
$$;

comment on function public.is_teacher_owner(bigint) is
'Verifica si el usuario actual es dueño del perfil de maestro.';

alter table public.clase_asistencias
  add column if not exists attended boolean not null default false,
  add column if not exists paid boolean not null default false,
  add column if not exists payment_type text;

-- Permite anular restricción previa si re-ejecutan el script; idempotente en migraciones
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'clase_asistencias_payment_type_check'
  ) then
    alter table public.clase_asistencias drop constraint clase_asistencias_payment_type_check;
  end if;
end
$$;

alter table public.clase_asistencias
  add constraint clase_asistencias_payment_type_check
  check (payment_type is null or payment_type in ('class', 'package', 'other'));

comment on column public.clase_asistencias.attended is 'Indica si el alumno asistió a la sesión (independiente de pago).';
comment on column public.clase_asistencias.paid is 'Indica si se registró pago para la sesión.';
comment on column public.clase_asistencias.payment_type is 'Solo si paid: class | package | other.';

-- Poblar a partir de status canónico (migración única hacia adelante)
update public.clase_asistencias ca
set
  attended = case public.normalize_class_attendance_status(ca.status)
    when 'attended' then true
    when 'pagado' then false
    else false
  end,
  paid = (public.normalize_class_attendance_status(ca.status) = 'pagado'),
  payment_type = case
    when public.normalize_class_attendance_status(ca.status) = 'pagado' then 'class'
    else null
  end
where true;

-- --- RPC: actualizar asistencia / pago (dueño de academia, maestro o superadmin) ---
create or replace function public.rpc_update_clase_asistencia_flags(
  p_id bigint,
  p_attended boolean,
  p_paid boolean,
  p_payment_type text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.clase_asistencias%rowtype;
  v_ptype text;
  v_st text;
begin
  select * into v_row
  from public.clase_asistencias ca
  where ca.id = p_id;

  if not found then
    raise exception 'Registro de asistencia no encontrado';
  end if;

  if not (
    (v_row.academy_id is not null and public.is_academy_owner(v_row.academy_id))
    or (v_row.teacher_id is not null and public.is_teacher_owner(v_row.teacher_id))
    or exists (
      select 1
      from public.role_requests rr
      where rr.user_id = auth.uid()
        and rr.role_slug = 'superadmin'
        and rr.status = 'aprobado'
    )
  ) then
    raise exception 'No tienes permisos para actualizar este registro';
  end if;

  v_ptype := null;
  if p_paid then
    v_ptype := coalesce(nullif(trim(p_payment_type), ''), 'class');
    if v_ptype not in ('class', 'package', 'other') then
      v_ptype := 'class';
    end if;
  end if;

  v_st := case
    when p_paid then 'pagado'
    when p_attended then 'attended'
    else 'tentative'
  end;

  update public.clase_asistencias
  set
    attended = p_attended,
    paid = p_paid,
    payment_type = v_ptype,
    status = v_st
  where id = p_id
  returning * into v_row;

  return jsonb_build_object(
    'id', v_row.id,
    'user_id', v_row.user_id,
    'class_id', v_row.class_id,
    'academy_id', v_row.academy_id,
    'attended', v_row.attended,
    'paid', v_row.paid,
    'payment_type', v_row.payment_type,
    'status', public.normalize_class_attendance_status(v_row.status)
  );
end;
$$;

grant execute on function public.rpc_update_clase_asistencia_flags(bigint, boolean, boolean, text) to authenticated;

-- Marca asistencia: ahora rellena columna boolean
drop function if exists public.rpc_mark_class_attendance_attended(bigint);
create or replace function public.rpc_mark_class_attendance_attended(
  p_attendance_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.clase_asistencias%rowtype;
  v_prev_status text;
begin
  select *
  into v_row
  from public.clase_asistencias ca
  where ca.id = p_attendance_id;

  if not found then
    raise exception 'Registro de asistencia no encontrado';
  end if;

  if not (
    (v_row.academy_id is not null and public.is_academy_owner(v_row.academy_id))
    or (v_row.teacher_id is not null and public.is_teacher_owner(v_row.teacher_id))
    or exists (
      select 1
      from public.role_requests rr
      where rr.user_id = auth.uid()
        and rr.role_slug = 'superadmin'
        and rr.status = 'aprobado'
    )
  ) then
    raise exception 'No tienes permisos para actualizar esta asistencia';
  end if;

  v_prev_status := public.normalize_class_attendance_status(v_row.status);

  update public.clase_asistencias
  set
    attended = true,
    status = case
      when coalesce(paid, false) then 'pagado'
      else 'attended'
    end
  where id = p_attendance_id
  returning * into v_row;

  return jsonb_build_object(
    'id', v_row.id,
    'user_id', v_row.user_id,
    'class_id', v_row.class_id,
    'academy_id', v_row.academy_id,
    'teacher_id', v_row.teacher_id,
    'previous_status', v_prev_status,
    'attended', v_row.attended,
    'status', public.normalize_class_attendance_status(v_row.status),
    'paid', v_row.paid,
    'fecha_especifica', v_row.fecha_especifica,
    'created_at', v_row.created_at
  );
end;
$$;

grant execute on function public.rpc_mark_class_attendance_attended(bigint) to authenticated;

-- --- Listado: incluir columnas de métrica ---
drop function if exists public.get_academy_class_reservations(bigint);
create or replace function public.get_academy_class_reservations(p_academy_id bigint)
returns table (
  id bigint,
  user_id uuid,
  class_id bigint,
  academy_id bigint,
  teacher_id bigint,
  role_baile text,
  zona_tag_id bigint,
  status text,
  fecha_especifica date,
  created_at timestamptz,
  attended boolean,
  paid boolean,
  payment_type text
)
language plpgsql
security definer
set search_path = public
as $$
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
    raise exception 'No tienes permisos para ver estas reservas';
  end if;

  return query
  select
    ca.id,
    ca.user_id,
    ca.class_id,
    ca.academy_id,
    ca.teacher_id,
    ca.role_baile,
    ca.zona_tag_id,
    public.normalize_class_attendance_status(ca.status) as status,
    ca.fecha_especifica,
    ca.created_at,
    coalesce(ca.attended, false) as attended,
    coalesce(ca.paid, false) as paid,
    ca.payment_type
  from public.clase_asistencias ca
  where ca.academy_id = p_academy_id
  order by ca.created_at desc;
end;
$$;

comment on function public.get_academy_class_reservations(bigint) is
'Reservas de asistencia de la academia: incluye asistió, pago y tipo.';

-- Teacher listado: mismas columnas
drop function if exists public.get_teacher_class_reservations(bigint);
create or replace function public.get_teacher_class_reservations(p_teacher_id bigint)
returns table (
  id bigint,
  user_id uuid,
  class_id bigint,
  academy_id bigint,
  teacher_id bigint,
  role_baile text,
  zona_tag_id bigint,
  status text,
  fecha_especifica date,
  created_at timestamptz,
  attended boolean,
  paid boolean,
  payment_type text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    public.is_teacher_owner(p_teacher_id)
    or exists (
      select 1
      from public.role_requests rr
      where rr.user_id = auth.uid()
        and rr.role_slug = 'superadmin'
        and rr.status = 'aprobado'
    )
  ) then
    raise exception 'No tienes permisos para ver estas reservas';
  end if;

  return query
  select
    ca.id,
    ca.user_id,
    ca.class_id,
    ca.academy_id,
    ca.teacher_id,
    ca.role_baile,
    ca.zona_tag_id,
    public.normalize_class_attendance_status(ca.status) as status,
    ca.fecha_especifica,
    ca.created_at,
    coalesce(ca.attended, false) as attended,
    coalesce(ca.paid, false) as paid,
    ca.payment_type
  from public.clase_asistencias ca
  where ca.teacher_id = p_teacher_id
  order by ca.created_at desc;
end;
$$;

grant execute on function public.get_teacher_class_reservations(bigint) to authenticated;

-- --- rpc_get_academy_class_metrics: contar por columnas, no un único status ---
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
  tentative_count bigint,
  attended_count bigint,
  paid_count bigint,
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
      ca.role_baile,
      public.normalize_class_attendance_status(ca.status) as status_norm,
      coalesce(ca.attended, false) as att_flag,
      coalesce(ca.paid, false) as paid_flag
    from public.clase_asistencias ca
    where ca.academy_id = p_academy_id
      and (p_from is null or ca.fecha_especifica is null or ca.fecha_especifica >= p_from)
      and (p_to is null or ca.fecha_especifica is null or ca.fecha_especifica <= p_to)
  ),
  attendance_enriched as (
    select
      a.class_id,
      a.fecha_especifica as class_session_date,
      a.status_norm,
      a.att_flag,
      a.paid_flag,
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
    count(*) filter (
      where
        (not ae.att_flag and not ae.paid_flag)
        and ae.status_norm = 'tentative'
    )::bigint as tentative_count,
    count(*) filter (where ae.att_flag)::bigint as attended_count,
    count(*) filter (where ae.paid_flag)::bigint as paid_count,
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

-- --- Global metrics ---
create or replace function public.rpc_get_academy_global_metrics(
  p_academy_id bigint,
  p_from date default null,
  p_to date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cronograma jsonb;
  v_total_classes int;
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

  select pa.cronograma into v_cronograma
  from public.profiles_academy pa
  where pa.id = p_academy_id;

  v_total_classes := coalesce(
    case
      when v_cronograma is null then 0
      when jsonb_typeof(v_cronograma) <> 'array' then 0
      else jsonb_array_length(v_cronograma)
    end,
    0
  );

  return (
    with filtered as (
      select
        ca.user_id,
        ca.class_id,
        ca.fecha_especifica,
        ca.role_baile,
        ca.zona_tag_id,
        public.normalize_class_attendance_status(ca.status) as status_norm,
        coalesce(ca.attended, false) as att,
        coalesce(ca.paid, false) as paid
      from public.clase_asistencias ca
      where ca.academy_id = p_academy_id
        and (p_from is null or (ca.created_at at time zone 'utc')::date >= p_from)
        and (p_to is null or (ca.created_at at time zone 'utc')::date <= p_to)
    ),
    zone_rows as (
      select
        t.id as zone_id,
        t.nombre as zone_name,
        count(*)::bigint as attendance_count,
        count(distinct f.user_id)::bigint as unique_students
      from filtered f
      join public.tags t on t.id = f.zona_tag_id and t.tipo = 'zona'
      group by t.id, t.nombre
    ),
    status_rows as (
      select f.status_norm, count(*)::bigint as cnt
      from filtered f
      group by f.status_norm
    )
    select jsonb_build_object(
      'total_classes_registered', v_total_classes,
      'unique_students', coalesce((select count(distinct f.user_id) from filtered f), 0),
      'total_attendance_records', coalesce((select count(*)::bigint from filtered f), 0),
      'total_tentative', coalesce((
        select count(*)::bigint from filtered f
        where (not f.att) and (not f.paid) and f.status_norm = 'tentative'
      ), 0),
      'total_attended', coalesce((select count(*)::bigint from filtered f where f.att), 0),
      'total_paid', coalesce((select count(*)::bigint from filtered f where f.paid), 0),
      'sessions_with_reservations', coalesce((
        select count(*)::bigint
        from (
          select distinct f.class_id, coalesce(f.fecha_especifica, '0001-01-01'::date)
          from filtered f
        ) s
      ), 0),
      'role_breakdown', jsonb_build_object(
        'lead', coalesce((select count(*) from filtered f where f.role_baile in ('lead', 'leader')), 0),
        'follow', coalesce((select count(*) from filtered f where f.role_baile in ('follow', 'follower')), 0),
        'ambos', coalesce((select count(*) from filtered f where f.role_baile = 'ambos'), 0),
        'other', coalesce((
          select count(*)
          from filtered f
          where f.role_baile is null
             or f.role_baile not in ('lead', 'leader', 'follow', 'follower', 'ambos')
        ), 0)
      ),
      'status_breakdown', coalesce((
        select jsonb_object_agg(sr.status_norm, sr.cnt order by sr.status_norm)
        from status_rows sr
      ), '{}'::jsonb),
      'zone_breakdown', coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'zone_id', z.zone_id,
            'zone_name', z.zone_name,
            'attendance_count', z.attendance_count,
            'unique_students', z.unique_students
          )
          order by z.attendance_count desc
        )
        from zone_rows z
      ), '[]'::jsonb)
    )
  );
end;
$$;

comment on function public.rpc_get_academy_global_metrics(bigint, date, date) is
'Métricas globales: asistió y pago vía columnas; tentative = sin asistir ni pago, status tentative.';

grant execute on function public.get_academy_class_reservations(bigint) to authenticated;
grant execute on function public.rpc_get_academy_class_metrics(bigint, date, date) to authenticated;
