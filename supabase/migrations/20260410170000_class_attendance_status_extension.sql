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
'Verifica si el usuario actual es dueno del perfil de maestro.';

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

  if v_prev_status <> 'attended' then
    update public.clase_asistencias
    set status = 'attended'
    where id = p_attendance_id
    returning * into v_row;
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'user_id', v_row.user_id,
    'class_id', v_row.class_id,
    'academy_id', v_row.academy_id,
    'teacher_id', v_row.teacher_id,
    'previous_status', v_prev_status,
    'status', public.normalize_class_attendance_status(v_row.status),
    'fecha_especifica', v_row.fecha_especifica,
    'created_at', v_row.created_at
  );
end;
$$;

grant execute on function public.rpc_mark_class_attendance_attended(bigint) to authenticated;

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
  created_at timestamptz
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
    ca.created_at
  from public.clase_asistencias ca
  where ca.academy_id = p_academy_id
  order by ca.created_at desc;
end;
$$;

comment on function public.get_academy_class_reservations(bigint) is
'Retorna todos los registros de clase_asistencias de una academia con status normalizado.';

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
  created_at timestamptz
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
    ca.created_at
  from public.clase_asistencias ca
  where ca.teacher_id = p_teacher_id
  order by ca.created_at desc;
end;
$$;

grant execute on function public.get_teacher_class_reservations(bigint) to authenticated;

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
      public.normalize_class_attendance_status(ca.status) as status_norm
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
    count(*) filter (where ae.status_norm = 'tentative')::bigint as tentative_count,
    count(*) filter (where ae.status_norm = 'attended')::bigint as attended_count,
    count(*) filter (where ae.status_norm = 'pagado')::bigint as paid_count,
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
        public.normalize_class_attendance_status(ca.status) as status_norm
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
      'total_tentative', coalesce((select count(*)::bigint from filtered f where f.status_norm = 'tentative'), 0),
      'total_attended', coalesce((select count(*)::bigint from filtered f where f.status_norm = 'attended'), 0),
      'total_paid', coalesce((select count(*)::bigint from filtered f where f.status_norm = 'pagado'), 0),
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
'Métricas globales de academia con conteos separados por tentative, attended y pagado.';

drop function if exists public.get_teacher_class_metrics(bigint);
create or replace function public.get_teacher_class_metrics(p_teacher_id bigint)
returns table (
  class_id bigint,
  total_tentativos bigint,
  total_attended bigint,
  total_pagados bigint,
  por_rol jsonb,
  nombre_clase text,
  fecha_clase text,
  precio_clase numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  cronograma_data jsonb;
  costos_data jsonb;
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
    raise exception 'No tienes permisos para ver estas métricas';
  end if;

  select cronograma, costos into cronograma_data, costos_data
  from public.profiles_teacher
  where id = p_teacher_id;

  if costos_data is null then
    costos_data := '[]'::jsonb;
  end if;

  return query
  with class_details as (
    select distinct
      ca.class_id,
      coalesce(
        (select t.value->>'titulo' from jsonb_array_elements(coalesce(cronograma_data, '[]'::jsonb)) with ordinality as t where (t.value->>'id') ~ '^\d+$' and (t.value->>'id')::bigint = ca.class_id limit 1),
        (select t.value->>'nombre' from jsonb_array_elements(coalesce(cronograma_data, '[]'::jsonb)) with ordinality as t where (t.value->>'id') ~ '^\d+$' and (t.value->>'id')::bigint = ca.class_id limit 1),
        (select t.value->>'titulo' from jsonb_array_elements(coalesce(cronograma_data, '[]'::jsonb)) with ordinality as t where ca.class_id % 1000 = 0 and (ca.class_id / 1000)::integer = t.ordinality - 1 limit 1),
        (select t.value->>'nombre' from jsonb_array_elements(coalesce(cronograma_data, '[]'::jsonb)) with ordinality as t where ca.class_id % 1000 = 0 and (ca.class_id / 1000)::integer = t.ordinality - 1 limit 1),
        (select t.value->>'titulo' from jsonb_array_elements(coalesce(cronograma_data, '[]'::jsonb)) with ordinality as t where ca.class_id < 1000 and ca.class_id::integer = t.ordinality - 1 limit 1),
        (select t.value->>'nombre' from jsonb_array_elements(coalesce(cronograma_data, '[]'::jsonb)) with ordinality as t where ca.class_id < 1000 and ca.class_id::integer = t.ordinality - 1 limit 1),
        'Clase #' || ca.class_id::text
      ) as nombre_clase,
      (
        select
          case
            when clase_item.value->>'fecha' is not null then clase_item.value->>'fecha'
            when clase_item.value->>'diaSemana' is not null then
              case (clase_item.value->>'diaSemana')::integer
                when 0 then 'Domingo'
                when 1 then 'Lunes'
                when 2 then 'Martes'
                when 3 then 'Miércoles'
                when 4 then 'Jueves'
                when 5 then 'Viernes'
                when 6 then 'Sábado'
                else null
              end
            when clase_item.value->>'dia_semana' is not null then
              case (clase_item.value->>'dia_semana')::integer
                when 0 then 'Domingo'
                when 1 then 'Lunes'
                when 2 then 'Martes'
                when 3 then 'Miércoles'
                when 4 then 'Jueves'
                when 5 then 'Viernes'
                when 6 then 'Sábado'
                else null
              end
            when jsonb_typeof(clase_item.value->'diasSemana') = 'array' and jsonb_array_length(clase_item.value->'diasSemana') > 0 then
              (select trim(both '"' from elem::text) from jsonb_array_elements(clase_item.value->'diasSemana') as elem limit 1)
            else null
          end
        from (
          select t.value
          from jsonb_array_elements(coalesce(cronograma_data, '[]'::jsonb)) with ordinality as t
          where ((t.value->>'id') ~ '^\d+$' and (t.value->>'id')::bigint = ca.class_id)
             or (ca.class_id % 1000 = 0 and (ca.class_id / 1000)::integer = t.ordinality - 1)
             or (ca.class_id < 1000 and ca.class_id::integer = t.ordinality - 1)
          limit 1
        ) as clase_item
      ) as fecha_clase,
      coalesce(
        (select t.value->>'referenciaCosto' from jsonb_array_elements(coalesce(cronograma_data, '[]'::jsonb)) with ordinality as t where (t.value->>'id') ~ '^\d+$' and (t.value->>'id')::bigint = ca.class_id limit 1),
        (select t.value->>'referenciaCosto' from jsonb_array_elements(coalesce(cronograma_data, '[]'::jsonb)) with ordinality as t where ca.class_id % 1000 = 0 and (ca.class_id / 1000)::integer = t.ordinality - 1 limit 1),
        (select t.value->>'referenciaCosto' from jsonb_array_elements(coalesce(cronograma_data, '[]'::jsonb)) with ordinality as t where ca.class_id < 1000 and ca.class_id::integer = t.ordinality - 1 limit 1),
        ''
      ) as referencia_costo
    from public.clase_asistencias ca
    where ca.teacher_id = p_teacher_id
  )
  select
    ca.class_id,
    count(*) filter (where public.normalize_class_attendance_status(ca.status) = 'tentative')::bigint as total_tentativos,
    count(*) filter (where public.normalize_class_attendance_status(ca.status) = 'attended')::bigint as total_attended,
    count(*) filter (where public.normalize_class_attendance_status(ca.status) = 'pagado')::bigint as total_pagados,
    jsonb_build_object(
      'leader', count(*) filter (where ca.role_baile in ('lead', 'leader'))::bigint,
      'follower', count(*) filter (where ca.role_baile in ('follow', 'follower'))::bigint,
      'ambos', count(*) filter (where ca.role_baile = 'ambos')::bigint,
      'otros', count(*) filter (where ca.role_baile not in ('lead', 'leader', 'follow', 'follower', 'ambos') or ca.role_baile is null)::bigint
    ) as por_rol,
    cd.nombre_clase,
    coalesce(ca.fecha_especifica::text, cd.fecha_clase) as fecha_clase,
    (
      select (costo_elem->>'precio')::numeric
      from jsonb_array_elements(
        case
          when costos_data is null or jsonb_typeof(costos_data) != 'array' then '[]'::jsonb
          else costos_data
        end
      ) as costo_elem
      where lower(trim((costo_elem->>'nombre')::text)) = lower(trim(cd.referencia_costo))
      limit 1
    ) as precio_clase
  from public.clase_asistencias ca
  left join class_details cd on cd.class_id = ca.class_id
  where ca.teacher_id = p_teacher_id
  group by ca.class_id, ca.fecha_especifica, cd.nombre_clase, cd.fecha_clase, cd.referencia_costo;
end;
$$;

grant execute on function public.get_teacher_class_metrics(bigint) to authenticated;

drop function if exists public.rpc_get_teacher_students_list(bigint, date, date, text, text, text, text, integer, integer);
drop function if exists public.rpc_get_teacher_student_detail(bigint, uuid, date, date);
drop function if exists public.rpc_get_teacher_students_global_metrics(bigint, date, date);

create or replace function public.rpc_get_teacher_students_list(
  p_teacher_id bigint,
  p_from date default null,
  p_to date default null,
  p_search text default null,
  p_role text default null,
  p_zone text default null,
  p_segment text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table(
  user_id uuid,
  student_name text,
  student_email text,
  primary_role text,
  primary_zone text,
  first_activity_at timestamptz,
  last_activity_at timestamptz,
  total_records bigint,
  total_tentative bigint,
  total_paid bigint,
  total_attended bigint,
  total_cancelled bigint,
  distinct_classes bigint,
  distinct_sessions bigint,
  last_class_name text,
  last_class_date date,
  status_breakdown jsonb,
  role_breakdown jsonb,
  zone_breakdown jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cronograma jsonb;
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
    raise exception 'No tienes permisos para ver estas métricas';
  end if;

  select pt.cronograma
  into v_cronograma
  from public.profiles_teacher pt
  where pt.id = p_teacher_id;

  return query
  with base as (
    select
      ca.id,
      ca.user_id,
      ca.class_id,
      ca.teacher_id,
      ca.role_baile,
      ca.zona_tag_id,
      public.normalize_class_attendance_status(ca.status) as status_norm,
      ca.fecha_especifica,
      ca.created_at
    from public.clase_asistencias ca
    where ca.teacher_id = p_teacher_id
      and (p_from is null or (ca.created_at at time zone 'utc')::date >= p_from)
      and (p_to is null or (ca.created_at at time zone 'utc')::date <= p_to)
  ),
  enriched as (
    select
      b.id,
      b.user_id,
      b.class_id,
      b.teacher_id,
      b.fecha_especifica,
      b.created_at,
      b.status_norm,
      case
        when b.role_baile in ('lead', 'leader') then 'leader'
        when b.role_baile in ('follow', 'follower') then 'follower'
        when b.role_baile = 'ambos' then 'ambos'
        else 'otro'
      end as role_norm,
      pu.display_name,
      pu.email,
      tz.nombre as zone_name,
      coalesce(
        nullif(trim(class_info.class_name), ''),
        'Clase #' || b.class_id::text
      ) as class_name
    from base b
    left join public.profiles_user pu on pu.user_id = b.user_id
    left join public.tags tz on tz.id = b.zona_tag_id and tz.tipo = 'zona'
    left join lateral (
      select
        coalesce(
          nullif(trim(e.obj->>'titulo'), ''),
          nullif(trim(e.obj->>'nombre'), '')
        ) as class_name
      from jsonb_array_elements(coalesce(v_cronograma, '[]'::jsonb)) with ordinality as e(obj, ord)
      where (
        (e.obj->>'id') ~ '^\d+$'
        and (e.obj->>'id')::bigint = b.class_id
      )
      or (
        b.class_id % 1000 = 0
        and (b.class_id / 1000)::int = e.ord - 1
      )
      or (
        b.class_id < 1000
        and b.class_id::int = e.ord - 1
      )
      limit 1
    ) class_info on true
  ),
  user_rollup as (
    select
      e.user_id,
      coalesce(
        max(nullif(trim(e.display_name), '')),
        max(split_part(nullif(trim(e.email), ''), '@', 1)),
        'Usuario ' || left(e.user_id::text, 8)
      ) as student_name,
      max(nullif(trim(e.email), '')) as student_email,
      min(e.created_at) as first_activity_at,
      max(e.created_at) as last_activity_at,
      count(*)::bigint as total_records,
      count(*) filter (where e.status_norm = 'tentative')::bigint as total_tentative,
      count(*) filter (where e.status_norm = 'pagado')::bigint as total_paid,
      count(*) filter (where e.status_norm = 'attended')::bigint as total_attended,
      count(*) filter (where e.status_norm in ('cancelado', 'no_show'))::bigint as total_cancelled,
      count(distinct e.class_id)::bigint as distinct_classes,
      count(distinct (e.class_id::text || '|' || coalesce(e.fecha_especifica::text, 'sin-fecha')))::bigint as distinct_sessions
    from enriched e
    group by e.user_id
  ),
  role_rank as (
    select
      e.user_id,
      e.role_norm,
      count(*)::bigint as cnt,
      row_number() over (partition by e.user_id order by count(*) desc, e.role_norm asc) as rn
    from enriched e
    group by e.user_id, e.role_norm
  ),
  zone_rank as (
    select
      e.user_id,
      e.zone_name,
      count(*)::bigint as cnt,
      row_number() over (partition by e.user_id order by count(*) desc, e.zone_name asc nulls last) as rn
    from enriched e
    group by e.user_id, e.zone_name
  ),
  last_row as (
    select
      e.user_id,
      e.class_name,
      e.fecha_especifica as class_date,
      row_number() over (partition by e.user_id order by e.created_at desc, e.id desc) as rn
    from enriched e
  ),
  status_json as (
    select x.user_id, jsonb_object_agg(x.status_norm, x.cnt order by x.status_norm) as status_breakdown
    from (
      select e.user_id, e.status_norm, count(*)::bigint as cnt
      from enriched e
      group by e.user_id, e.status_norm
    ) x
    group by x.user_id
  ),
  role_json as (
    select x.user_id, jsonb_object_agg(x.role_norm, x.cnt order by x.role_norm) as role_breakdown
    from (
      select e.user_id, e.role_norm, count(*)::bigint as cnt
      from enriched e
      group by e.user_id, e.role_norm
    ) x
    group by x.user_id
  ),
  zone_json as (
    select x.user_id, jsonb_object_agg(x.zone_name, x.cnt order by x.zone_name) as zone_breakdown
    from (
      select e.user_id, coalesce(e.zone_name, 'Sin zona') as zone_name, count(*)::bigint as cnt
      from enriched e
      group by e.user_id, coalesce(e.zone_name, 'Sin zona')
    ) x
    group by x.user_id
  ),
  merged as (
    select
      ur.user_id,
      ur.student_name::text as student_name,
      ur.student_email::text as student_email,
      rr.role_norm::text as primary_role,
      zr.zone_name::text as primary_zone,
      ur.first_activity_at,
      ur.last_activity_at,
      ur.total_records,
      ur.total_tentative,
      ur.total_paid,
      ur.total_attended,
      ur.total_cancelled,
      ur.distinct_classes,
      ur.distinct_sessions,
      lr.class_name::text as last_class_name,
      lr.class_date as last_class_date,
      coalesce(sj.status_breakdown, '{}'::jsonb) as status_breakdown,
      coalesce(rj.role_breakdown, '{}'::jsonb) as role_breakdown,
      coalesce(zj.zone_breakdown, '{}'::jsonb) as zone_breakdown
    from user_rollup ur
    left join role_rank rr on rr.user_id = ur.user_id and rr.rn = 1
    left join zone_rank zr on zr.user_id = ur.user_id and zr.rn = 1
    left join last_row lr on lr.user_id = ur.user_id and lr.rn = 1
    left join status_json sj on sj.user_id = ur.user_id
    left join role_json rj on rj.user_id = ur.user_id
    left join zone_json zj on zj.user_id = ur.user_id
  )
  select
    m.user_id,
    m.student_name,
    m.student_email,
    m.primary_role,
    m.primary_zone,
    m.first_activity_at,
    m.last_activity_at,
    m.total_records,
    m.total_tentative,
    m.total_paid,
    m.total_attended,
    m.total_cancelled,
    m.distinct_classes,
    m.distinct_sessions,
    m.last_class_name,
    m.last_class_date,
    m.status_breakdown,
    m.role_breakdown,
    m.zone_breakdown
  from merged m
  where (p_search is null or m.student_name ilike '%' || trim(p_search) || '%' or coalesce(m.student_email, '') ilike '%' || trim(p_search) || '%')
    and (p_role is null or lower(trim(p_role)) = 'all' or lower(coalesce(m.primary_role, '')) = lower(trim(p_role)))
    and (p_zone is null or trim(p_zone) = '' or lower(coalesce(m.primary_zone, '')) = lower(trim(p_zone)))
    and (
      p_segment is null
      or lower(trim(p_segment)) = 'all'
      or (lower(trim(p_segment)) = 'active' and m.last_activity_at >= now() - interval '30 days')
      or (lower(trim(p_segment)) = 'new' and m.first_activity_at >= now() - interval '30 days')
      or (lower(trim(p_segment)) = 'recurrent' and m.total_records > 1)
      or (lower(trim(p_segment)) = 'with_history' and m.distinct_classes > 1)
    )
  order by m.last_activity_at desc nulls last, m.student_name asc
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

create or replace function public.rpc_get_teacher_student_detail(
  p_teacher_id bigint,
  p_user_id uuid,
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
  v_name text;
  v_email text;
  v_metrics jsonb;
  v_status jsonb;
  v_roles jsonb;
  v_zones jsonb;
  v_classes jsonb;
  v_history jsonb;
  v_teacher_name text;
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
    raise exception 'No tienes permisos para ver este detalle';
  end if;

  select pt.cronograma, coalesce(nullif(trim(pt.nombre_publico), ''), 'Maestro')
  into v_cronograma, v_teacher_name
  from public.profiles_teacher pt
  where pt.id = p_teacher_id;

  select
    coalesce(
      nullif(trim(pu.display_name), ''),
      split_part(nullif(trim(pu.email), ''), '@', 1),
      'Usuario ' || left(p_user_id::text, 8)
    ),
    nullif(trim(pu.email), '')
  into v_name, v_email
  from public.profiles_user pu
  where pu.user_id = p_user_id;

  with enriched as (
    select
      ca.id,
      ca.class_id,
      ca.teacher_id,
      ca.fecha_especifica,
      ca.created_at,
      public.normalize_class_attendance_status(ca.status) as status_norm,
      case
        when ca.role_baile in ('lead', 'leader') then 'leader'
        when ca.role_baile in ('follow', 'follower') then 'follower'
        when ca.role_baile = 'ambos' then 'ambos'
        else 'otro'
      end as role_norm,
      tz.nombre as zone_name,
      coalesce(class_info.class_name, 'Clase #' || ca.class_id::text) as class_name,
      class_info.hora_inicio
    from public.clase_asistencias ca
    left join public.tags tz on tz.id = ca.zona_tag_id and tz.tipo = 'zona'
    left join lateral (
      select
        coalesce(
          nullif(trim(e.obj->>'titulo'), ''),
          nullif(trim(e.obj->>'nombre'), '')
        ) as class_name,
        nullif(trim(coalesce(e.obj->>'inicio', e.obj->>'hora_inicio', '')), '') as hora_inicio
      from jsonb_array_elements(coalesce(v_cronograma, '[]'::jsonb)) with ordinality as e(obj, ord)
      where (
        (e.obj->>'id') ~ '^\d+$'
        and (e.obj->>'id')::bigint = ca.class_id
      )
      or (
        ca.class_id % 1000 = 0
        and (ca.class_id / 1000)::int = e.ord - 1
      )
      or (
        ca.class_id < 1000
        and ca.class_id::int = e.ord - 1
      )
      limit 1
    ) class_info on true
    where ca.teacher_id = p_teacher_id
      and ca.user_id = p_user_id
      and (p_from is null or (ca.created_at at time zone 'utc')::date >= p_from)
      and (p_to is null or (ca.created_at at time zone 'utc')::date <= p_to)
  ),
  latest as (
    select e.*
    from enriched e
    order by e.created_at desc, e.id desc
    limit 1
  )
  select jsonb_build_object(
      'total_records', coalesce(count(*), 0),
      'total_reservations', coalesce(count(*) filter (where e.status_norm = 'tentative'), 0),
      'total_paid', coalesce(count(*) filter (where e.status_norm = 'pagado'), 0),
      'total_attended', coalesce(count(*) filter (where e.status_norm = 'attended'), 0),
      'total_cancelled', coalesce(count(*) filter (where e.status_norm in ('cancelado', 'no_show')), 0),
      'distinct_classes', coalesce(count(distinct e.class_id), 0),
      'distinct_sessions', coalesce(count(distinct (e.class_id::text || '|' || coalesce(e.fecha_especifica::text, 'sin-fecha'))), 0),
      'first_activity_at', min(e.created_at),
      'last_activity_at', max(e.created_at),
      'last_class_name', (select l.class_name from latest l),
      'last_class_date', (select l.fecha_especifica from latest l)
    )
  into v_metrics
  from enriched e;

  select coalesce(jsonb_object_agg(e.status_norm, e.cnt order by e.status_norm), '{}'::jsonb)
  into v_status
  from (
    select status_norm, count(*)::bigint as cnt
    from (
      select public.normalize_class_attendance_status(ca.status) as status_norm
      from public.clase_asistencias ca
      where ca.teacher_id = p_teacher_id
        and ca.user_id = p_user_id
        and (p_from is null or (ca.created_at at time zone 'utc')::date >= p_from)
        and (p_to is null or (ca.created_at at time zone 'utc')::date <= p_to)
    ) x
    group by status_norm
  ) e;

  select coalesce(jsonb_object_agg(e.role_norm, e.cnt order by e.role_norm), '{}'::jsonb)
  into v_roles
  from (
    select role_norm, count(*)::bigint as cnt
    from (
      select
        case
          when ca.role_baile in ('lead', 'leader') then 'leader'
          when ca.role_baile in ('follow', 'follower') then 'follower'
          when ca.role_baile = 'ambos' then 'ambos'
          else 'otro'
        end as role_norm
      from public.clase_asistencias ca
      where ca.teacher_id = p_teacher_id
        and ca.user_id = p_user_id
        and (p_from is null or (ca.created_at at time zone 'utc')::date >= p_from)
        and (p_to is null or (ca.created_at at time zone 'utc')::date <= p_to)
    ) x
    group by role_norm
  ) e;

  select coalesce(jsonb_object_agg(e.zone_name, e.cnt order by e.zone_name), '{}'::jsonb)
  into v_zones
  from (
    select coalesce(t.nombre, 'Sin zona') as zone_name, count(*)::bigint as cnt
    from public.clase_asistencias ca
    left join public.tags t on t.id = ca.zona_tag_id and t.tipo = 'zona'
    where ca.teacher_id = p_teacher_id
      and ca.user_id = p_user_id
      and (p_from is null or (ca.created_at at time zone 'utc')::date >= p_from)
      and (p_to is null or (ca.created_at at time zone 'utc')::date <= p_to)
    group by coalesce(t.nombre, 'Sin zona')
  ) e;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'class_id', cr.class_id,
        'class_name', cr.class_name,
        'records', cr.records,
        'tentative', cr.tentative,
        'attended', cr.attended,
        'paid', cr.paid,
        'last_activity_at', cr.last_activity_at
      )
    ),
    '[]'::jsonb
  )
  into v_classes
  from (
    select
      coalesce(class_info.class_name, 'Clase #' || ca.class_id::text) as class_name,
      ca.class_id,
      count(*)::bigint as records,
      count(*) filter (where public.normalize_class_attendance_status(ca.status) = 'tentative')::bigint as tentative,
      count(*) filter (where public.normalize_class_attendance_status(ca.status) = 'attended')::bigint as attended,
      count(*) filter (where public.normalize_class_attendance_status(ca.status) = 'pagado')::bigint as paid,
      max(ca.created_at) as last_activity_at
    from public.clase_asistencias ca
    left join lateral (
      select coalesce(nullif(trim(e.obj->>'titulo'), ''), nullif(trim(e.obj->>'nombre'), '')) as class_name
      from jsonb_array_elements(coalesce(v_cronograma, '[]'::jsonb)) with ordinality as e(obj, ord)
      where (
        (e.obj->>'id') ~ '^\d+$'
        and (e.obj->>'id')::bigint = ca.class_id
      )
      or (
        ca.class_id % 1000 = 0
        and (ca.class_id / 1000)::int = e.ord - 1
      )
      or (
        ca.class_id < 1000
        and ca.class_id::int = e.ord - 1
      )
      limit 1
    ) class_info on true
    where ca.teacher_id = p_teacher_id
      and ca.user_id = p_user_id
      and (p_from is null or (ca.created_at at time zone 'utc')::date >= p_from)
      and (p_to is null or (ca.created_at at time zone 'utc')::date <= p_to)
    group by ca.class_id, class_name
    order by records desc, last_activity_at desc
  ) cr;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'class_id', e.class_id,
        'class_name', e.class_name,
        'session_date', e.fecha_especifica,
        'hora', e.hora_inicio,
        'status', e.status_norm,
        'role', e.role_norm,
        'zone', e.zone_name,
        'teacher_id', p_teacher_id,
        'teacher_name', v_teacher_name,
        'created_at', e.created_at
      )
    ),
    '[]'::jsonb
  )
  into v_history
  from (
    select *
    from enriched
    order by created_at desc, id desc
  ) e;

  return jsonb_build_object(
    'student', jsonb_build_object(
      'user_id', p_user_id,
      'name', coalesce(v_name, 'Usuario ' || left(p_user_id::text, 8)),
      'email', v_email
    ),
    'metrics', coalesce(v_metrics, '{}'::jsonb),
    'status_breakdown', coalesce(v_status, '{}'::jsonb),
    'role_breakdown', coalesce(v_roles, '{}'::jsonb),
    'zone_breakdown', coalesce(v_zones, '{}'::jsonb),
    'class_breakdown', coalesce(v_classes, '[]'::jsonb),
    'history', coalesce(v_history, '[]'::jsonb)
  );
end;
$$;

create or replace function public.rpc_get_teacher_students_global_metrics(
  p_teacher_id bigint,
  p_from date default null,
  p_to date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unique_students bigint;
  v_active_students bigint;
  v_new_students bigint;
  v_recurrent_students bigint;
  v_students_with_history bigint;
  v_total_records bigint;
  v_status_records jsonb;
  v_status_students jsonb;
  v_role_breakdown jsonb;
  v_zone_breakdown jsonb;
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
    raise exception 'No tienes permisos para ver estas métricas';
  end if;

  with filtered as (
    select
      ca.user_id,
      ca.class_id,
      ca.zona_tag_id,
      ca.role_baile,
      public.normalize_class_attendance_status(ca.status) as status_norm,
      ca.created_at
    from public.clase_asistencias ca
    where ca.teacher_id = p_teacher_id
      and (p_from is null or (ca.created_at at time zone 'utc')::date >= p_from)
      and (p_to is null or (ca.created_at at time zone 'utc')::date <= p_to)
  ),
  all_history as (
    select ca.user_id, min(ca.created_at) as first_activity_at
    from public.clase_asistencias ca
    where ca.teacher_id = p_teacher_id
    group by ca.user_id
  ),
  per_student as (
    select
      f.user_id,
      min(f.created_at) as first_activity_at_period,
      max(f.created_at) as last_activity_at,
      count(*)::bigint as total_records,
      count(distinct f.class_id)::bigint as distinct_classes
    from filtered f
    group by f.user_id
  ),
  status_records_rows as (
    select f.status_norm, count(*)::bigint as cnt
    from filtered f
    group by f.status_norm
  ),
  status_students_rows as (
    select f.status_norm, count(distinct f.user_id)::bigint as cnt
    from filtered f
    group by f.status_norm
  ),
  role_rows as (
    select
      case
        when f.role_baile in ('lead', 'leader') then 'leader'
        when f.role_baile in ('follow', 'follower') then 'follower'
        when f.role_baile = 'ambos' then 'ambos'
        else 'otro'
      end as role_norm,
      count(*)::bigint as cnt
    from filtered f
    group by 1
  ),
  zone_rows as (
    select
      coalesce(t.nombre, 'Sin zona') as zone_name,
      count(*)::bigint as attendance_count,
      count(distinct f.user_id)::bigint as unique_students
    from filtered f
    left join public.tags t on t.id = f.zona_tag_id and t.tipo = 'zona'
    group by coalesce(t.nombre, 'Sin zona')
  )
  select
    (select count(*)::bigint from per_student),
    (select count(*)::bigint from per_student ps where ps.last_activity_at >= now() - interval '30 days'),
    (
      select count(*)::bigint
      from per_student ps
      join all_history ah on ah.user_id = ps.user_id
      where ah.first_activity_at >= coalesce(p_from::timestamp, now() - interval '30 days')
        and ah.first_activity_at < coalesce((p_to + 1)::timestamp, now() + interval '1 day')
    ),
    (select count(*)::bigint from per_student ps where ps.total_records > 1),
    (select count(*)::bigint from per_student ps where ps.distinct_classes > 1),
    (select coalesce(sum(ps.total_records), 0)::bigint from per_student ps),
    (
      select coalesce(jsonb_object_agg(sr.status_norm, sr.cnt order by sr.status_norm), '{}'::jsonb)
      from status_records_rows sr
    ),
    (
      select coalesce(jsonb_object_agg(ss.status_norm, ss.cnt order by ss.status_norm), '{}'::jsonb)
      from status_students_rows ss
    ),
    (
      select coalesce(jsonb_object_agg(rr.role_norm, rr.cnt order by rr.role_norm), '{}'::jsonb)
      from role_rows rr
    ),
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'zone_name', zr.zone_name,
            'attendance_count', zr.attendance_count,
            'unique_students', zr.unique_students
          )
          order by zr.attendance_count desc, zr.zone_name asc
        ),
        '[]'::jsonb
      )
      from zone_rows zr
    )
  into
    v_unique_students,
    v_active_students,
    v_new_students,
    v_recurrent_students,
    v_students_with_history,
    v_total_records,
    v_status_records,
    v_status_students,
    v_role_breakdown,
    v_zone_breakdown;

  return jsonb_build_object(
    'unique_students', coalesce(v_unique_students, 0),
    'active_students', coalesce(v_active_students, 0),
    'new_students', coalesce(v_new_students, 0),
    'recurrent_students', coalesce(v_recurrent_students, 0),
    'students_with_history', coalesce(v_students_with_history, 0),
    'total_records', coalesce(v_total_records, 0),
    'status_record_breakdown', coalesce(v_status_records, '{}'::jsonb),
    'status_student_breakdown', coalesce(v_status_students, '{}'::jsonb),
    'role_breakdown', coalesce(v_role_breakdown, '{}'::jsonb),
    'zone_breakdown', coalesce(v_zone_breakdown, '[]'::jsonb)
  );
end;
$$;

grant execute on function public.rpc_get_teacher_students_list(bigint, date, date, text, text, text, text, integer, integer) to authenticated;
grant execute on function public.rpc_get_teacher_student_detail(bigint, uuid, date, date) to authenticated;
grant execute on function public.rpc_get_teacher_students_global_metrics(bigint, date, date) to authenticated;

drop function if exists public.rpc_get_my_class_attendance(date, date);
create or replace function public.rpc_get_my_class_attendance(
  p_from date default null,
  p_to date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_history jsonb;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion';
  end if;

  with base as (
    select
      ca.id,
      ca.class_id,
      ca.academy_id,
      ca.teacher_id,
      ca.fecha_especifica,
      ca.created_at,
      public.normalize_class_attendance_status(ca.status) as status_norm,
      case
        when ca.role_baile in ('lead', 'leader') then 'leader'
        when ca.role_baile in ('follow', 'follower') then 'follower'
        when ca.role_baile = 'ambos' then 'ambos'
        else 'otro'
      end as role_norm,
      tz.nombre as zone_name
    from public.clase_asistencias ca
    left join public.tags tz on tz.id = ca.zona_tag_id and tz.tipo = 'zona'
    where ca.user_id = auth.uid()
      and (p_from is null or (ca.created_at at time zone 'utc')::date >= p_from)
      and (p_to is null or (ca.created_at at time zone 'utc')::date <= p_to)
  ),
  academy_info as (
    select pa.id, pa.nombre_publico, pa.cronograma
    from public.profiles_academy pa
  ),
  teacher_info as (
    select pt.id, pt.nombre_publico, pt.cronograma
    from public.profiles_teacher pt
  ),
  enriched as (
    select
      b.*,
      coalesce(
        a_class.class_name,
        t_class.class_name,
        'Clase #' || b.class_id::text
      ) as class_name,
      coalesce(a_class.hora_inicio, t_class.hora_inicio) as hora_inicio,
      ai.nombre_publico as academy_name,
      ti.nombre_publico as teacher_name
    from base b
    left join academy_info ai on ai.id = b.academy_id
    left join teacher_info ti on ti.id = b.teacher_id
    left join lateral (
      select
        coalesce(
          nullif(trim(e.obj->>'titulo'), ''),
          nullif(trim(e.obj->>'nombre'), '')
        ) as class_name,
        nullif(trim(coalesce(e.obj->>'inicio', e.obj->>'hora_inicio', '')), '') as hora_inicio
      from jsonb_array_elements(coalesce(ai.cronograma, '[]'::jsonb)) with ordinality as e(obj, ord)
      where (
        (e.obj->>'id') ~ '^\d+$'
        and (e.obj->>'id')::bigint = b.class_id
      )
      or (
        b.class_id % 1000 = 0
        and (b.class_id / 1000)::int = e.ord - 1
      )
      or (
        b.class_id < 1000
        and b.class_id::int = e.ord - 1
      )
      limit 1
    ) a_class on true
    left join lateral (
      select
        coalesce(
          nullif(trim(e.obj->>'titulo'), ''),
          nullif(trim(e.obj->>'nombre'), '')
        ) as class_name,
        nullif(trim(coalesce(e.obj->>'inicio', e.obj->>'hora_inicio', '')), '') as hora_inicio
      from jsonb_array_elements(coalesce(ti.cronograma, '[]'::jsonb)) with ordinality as e(obj, ord)
      where (
        (e.obj->>'id') ~ '^\d+$'
        and (e.obj->>'id')::bigint = b.class_id
      )
      or (
        b.class_id % 1000 = 0
        and (b.class_id / 1000)::int = e.ord - 1
      )
      or (
        b.class_id < 1000
        and b.class_id::int = e.ord - 1
      )
      limit 1
    ) t_class on true
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'class_id', e.class_id,
        'class_name', e.class_name,
        'session_date', e.fecha_especifica,
        'hora', e.hora_inicio,
        'status', e.status_norm,
        'role', e.role_norm,
        'zone', e.zone_name,
        'academy_id', e.academy_id,
        'academy_name', e.academy_name,
        'teacher_id', e.teacher_id,
        'teacher_name', e.teacher_name,
        'created_at', e.created_at
      )
      order by e.created_at desc, e.id desc
    ),
    '[]'::jsonb
  )
  into v_history
  from enriched e;

  return jsonb_build_object(
    'history', coalesce(v_history, '[]'::jsonb)
  );
end;
$$;

grant execute on function public.rpc_get_my_class_attendance(date, date) to authenticated;
