-- Métricas academia: enforcement por subscription_plan (superadmin sin límite).

create or replace function public.assert_academy_class_metrics_allowed(p_academy_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
begin
  if exists (
    select 1
    from public.role_requests rr
    where rr.user_id = auth.uid()
      and rr.role_slug = 'superadmin'
      and rr.status = 'aprobado'
  ) then
    return;
  end if;

  select case lower(trim(coalesce(pa.subscription_plan, '')))
    when 'pro' then 'pro'
    when 'premium' then 'premium'
    else 'basic'
  end
  into v_plan
  from public.profiles_academy pa
  where pa.id = p_academy_id;

  if v_plan is null then
    raise exception 'No tienes permisos para ver estas métricas';
  end if;

  if v_plan = 'basic' then
    raise exception 'ACADEMY_BASIC_NO_CLASS_METRICS Las estadísticas de clases requieren plan Pro o Premium.';
  end if;
end;
$$;

create or replace function public.assert_academy_student_metrics_allowed(p_academy_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
begin
  if exists (
    select 1
    from public.role_requests rr
    where rr.user_id = auth.uid()
      and rr.role_slug = 'superadmin'
      and rr.status = 'aprobado'
  ) then
    return;
  end if;

  select case lower(trim(coalesce(pa.subscription_plan, '')))
    when 'pro' then 'pro'
    when 'premium' then 'premium'
    else 'basic'
  end
  into v_plan
  from public.profiles_academy pa
  where pa.id = p_academy_id;

  if v_plan is null then
    raise exception 'No tienes permisos para ver estas métricas';
  end if;

  if v_plan <> 'premium' then
    raise exception 'ACADEMY_STUDENT_METRICS_PREMIUM_ONLY Las métricas de alumnos requieren plan Premium.';
  end if;
end;
$$;

comment on function public.assert_academy_class_metrics_allowed(bigint) is
'Comprueba plan Pro/Premium para RPCs de métricas de clases por academia.';

comment on function public.assert_academy_student_metrics_allowed(bigint) is
'Comprueba plan Premium para RPCs de métricas de alumnos por academia.';


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

  perform public.assert_academy_class_metrics_allowed(p_academy_id);

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

  perform public.assert_academy_class_metrics_allowed(p_academy_id);

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

create or replace function public.rpc_get_academy_students_list(
  p_academy_id bigint,
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

  perform public.assert_academy_student_metrics_allowed(p_academy_id);

  select pa.cronograma
  into v_cronograma
  from public.profiles_academy pa
  where pa.id = p_academy_id;

  return query
  with base as (
    select
      ca.id,
      ca.user_id,
      ca.class_id,
      ca.teacher_id,
      ca.role_baile,
      ca.zona_tag_id,
      ca.status,
      coalesce(ca.attended, false) as att,
      coalesce(ca.paid, false) as paid,
      ca.fecha_especifica,
      ca.created_at
    from public.clase_asistencias ca
    where ca.academy_id = p_academy_id
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
      b.att,
      b.paid,
      lower(coalesce(trim(b.status), 'unknown')) as status_norm,
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
      count(*) filter (where (not e.att) and (not e.paid) and e.status_norm = 'tentative')::bigint as total_tentative,
      count(*) filter (where e.paid)::bigint as total_paid,
      count(*) filter (where e.att)::bigint as total_attended,
      count(*) filter (where e.status_norm in ('cancelado', 'cancelled', 'canceled', 'no_show', 'noshow'))::bigint as total_cancelled,
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
      row_number() over (
        partition by e.user_id
        order by count(*) desc, e.role_norm asc
      ) as rn
    from enriched e
    group by e.user_id, e.role_norm
  ),
  zone_rank as (
    select
      e.user_id,
      e.zone_name,
      count(*)::bigint as cnt,
      row_number() over (
        partition by e.user_id
        order by count(*) desc, e.zone_name asc nulls last
      ) as rn
    from enriched e
    group by e.user_id, e.zone_name
  ),
  last_row as (
    select
      e.user_id,
      e.class_name,
      e.fecha_especifica as class_date,
      row_number() over (
        partition by e.user_id
        order by e.created_at desc, e.id desc
      ) as rn
    from enriched e
  ),
  status_json as (
    select
      x.user_id,
      jsonb_object_agg(x.status_norm, x.cnt order by x.status_norm) as status_breakdown
    from (
      select e.user_id, e.status_norm, count(*)::bigint as cnt
      from enriched e
      group by e.user_id, e.status_norm
    ) x
    group by x.user_id
  ),
  role_json as (
    select
      x.user_id,
      jsonb_object_agg(x.role_norm, x.cnt order by x.role_norm) as role_breakdown
    from (
      select e.user_id, e.role_norm, count(*)::bigint as cnt
      from enriched e
      group by e.user_id, e.role_norm
    ) x
    group by x.user_id
  ),
  zone_json as (
    select
      x.user_id,
      jsonb_object_agg(x.zone_name, x.cnt order by x.zone_name) as zone_breakdown
    from (
      select
        e.user_id,
        coalesce(e.zone_name, 'Sin zona') as zone_name,
        count(*)::bigint as cnt
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
  where (
      p_search is null
      or trim(p_search) = ''
      or m.student_name ilike '%' || trim(p_search) || '%'
      or coalesce(m.student_email, '') ilike '%' || trim(p_search) || '%'
    )
    and (
      p_role is null
      or trim(p_role) = ''
      or m.primary_role = case
        when lower(trim(p_role)) in ('lead', 'leader') then 'leader'
        when lower(trim(p_role)) in ('follow', 'follower') then 'follower'
        when lower(trim(p_role)) = 'ambos' then 'ambos'
        else 'otro'
      end
    )
    and (
      p_zone is null
      or trim(p_zone) = ''
      or coalesce(m.primary_zone, 'Sin zona') = trim(p_zone)
    )
    and (
      p_segment is null
      or trim(p_segment) = ''
      or (
        lower(trim(p_segment)) = 'active'
        and m.last_activity_at >= now() - interval '30 days'
      )
      or (
        lower(trim(p_segment)) = 'new'
        and m.first_activity_at >= coalesce(p_from::timestamp, now() - interval '30 days')
        and m.first_activity_at < coalesce((p_to + 1)::timestamp, now() + interval '1 day')
      )
      or (
        lower(trim(p_segment)) = 'recurrent'
        and m.total_records > 1
      )
      or (
        lower(trim(p_segment)) = 'with_history'
        and m.distinct_classes > 1
      )
    )
  order by m.last_activity_at desc nulls last, m.total_records desc, m.student_name asc
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

create or replace function public.rpc_get_academy_student_detail(
  p_academy_id bigint,
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

  perform public.assert_academy_student_metrics_allowed(p_academy_id);

  select pa.cronograma
  into v_cronograma
  from public.profiles_academy pa
  where pa.id = p_academy_id;

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

  with user_rows as (
    select
      ca.id,
      ca.user_id,
      ca.class_id,
      ca.teacher_id,
      ca.role_baile,
      ca.zona_tag_id,
      ca.status,
      coalesce(ca.attended, false) as att,
      coalesce(ca.paid, false) as paid,
      ca.payment_type,
      ca.fecha_especifica,
      ca.created_at
    from public.clase_asistencias ca
    where ca.academy_id = p_academy_id
      and ca.user_id = p_user_id
      and (p_from is null or (ca.created_at at time zone 'utc')::date >= p_from)
      and (p_to is null or (ca.created_at at time zone 'utc')::date <= p_to)
  ),
  enriched as (
    select
      ur.id,
      ur.class_id,
      ur.teacher_id,
      ur.fecha_especifica,
      ur.created_at,
      ur.att,
      ur.paid,
      ur.payment_type,
      lower(coalesce(trim(ur.status), 'unknown')) as status_norm,
      case
        when ur.role_baile in ('lead', 'leader') then 'leader'
        when ur.role_baile in ('follow', 'follower') then 'follower'
        when ur.role_baile = 'ambos' then 'ambos'
        else 'otro'
      end as role_norm,
      tz.nombre as zone_name,
      coalesce(class_info.class_name, 'Clase #' || ur.class_id::text) as class_name,
      class_info.hora_inicio,
      coalesce(
        nullif(trim(tu.display_name), ''),
        split_part(nullif(trim(tu.email), ''), '@', 1)
      ) as teacher_name
    from user_rows ur
    left join public.tags tz on tz.id = ur.zona_tag_id and tz.tipo = 'zona'
    left join public.profiles_teacher pt on pt.id = ur.teacher_id
    left join public.profiles_user tu on tu.user_id = pt.user_id
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
        and (e.obj->>'id')::bigint = ur.class_id
      )
      or (
        ur.class_id % 1000 = 0
        and (ur.class_id / 1000)::int = e.ord - 1
      )
      or (
        ur.class_id < 1000
        and ur.class_id::int = e.ord - 1
      )
      limit 1
    ) class_info on true
  ),
  latest as (
    select e.*
    from enriched e
    order by e.created_at desc, e.id desc
    limit 1
  )
  select jsonb_build_object(
      'total_records', coalesce(count(*), 0),
      'total_reservations', coalesce(count(*) filter (where (not e.att) and (not e.paid) and e.status_norm = 'tentative'), 0),
      'total_paid', coalesce(count(*) filter (where e.paid), 0),
      'total_attended', coalesce(count(*) filter (where e.att), 0),
      'total_cancelled', coalesce(count(*) filter (where e.status_norm in ('cancelado', 'cancelled', 'canceled', 'no_show', 'noshow')), 0),
      'distinct_classes', coalesce(count(distinct e.class_id), 0),
      'distinct_sessions', coalesce(count(distinct (e.class_id::text || '|' || coalesce(e.fecha_especifica::text, 'sin-fecha'))), 0),
      'first_activity_at', min(e.created_at),
      'last_activity_at', max(e.created_at),
      'last_class_name', (select l.class_name from latest l),
      'last_class_date', (select l.fecha_especifica from latest l)
    )
  into v_metrics
  from enriched e;

  with status_rows as (
    select e.status_norm, count(*)::bigint as cnt
    from (
      select
        lower(coalesce(trim(ca.status), 'unknown')) as status_norm
      from public.clase_asistencias ca
      where ca.academy_id = p_academy_id
        and ca.user_id = p_user_id
        and (p_from is null or (ca.created_at at time zone 'utc')::date >= p_from)
        and (p_to is null or (ca.created_at at time zone 'utc')::date <= p_to)
    ) e
    group by e.status_norm
  )
  select coalesce(jsonb_object_agg(sr.status_norm, sr.cnt order by sr.status_norm), '{}'::jsonb)
  into v_status
  from status_rows sr;

  with role_rows as (
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
      where ca.academy_id = p_academy_id
        and ca.user_id = p_user_id
        and (p_from is null or (ca.created_at at time zone 'utc')::date >= p_from)
        and (p_to is null or (ca.created_at at time zone 'utc')::date <= p_to)
    ) x
    group by role_norm
  )
  select coalesce(jsonb_object_agg(rr.role_norm, rr.cnt order by rr.role_norm), '{}'::jsonb)
  into v_roles
  from role_rows rr;

  with zone_rows as (
    select
      coalesce(t.nombre, 'Sin zona') as zone_name,
      count(*)::bigint as cnt
    from public.clase_asistencias ca
    left join public.tags t on t.id = ca.zona_tag_id and t.tipo = 'zona'
    where ca.academy_id = p_academy_id
      and ca.user_id = p_user_id
      and (p_from is null or (ca.created_at at time zone 'utc')::date >= p_from)
      and (p_to is null or (ca.created_at at time zone 'utc')::date <= p_to)
    group by coalesce(t.nombre, 'Sin zona')
  )
  select coalesce(jsonb_object_agg(zr.zone_name, zr.cnt order by zr.zone_name), '{}'::jsonb)
  into v_zones
  from zone_rows zr;

  with class_rows as (
    select
      coalesce(
        class_info.class_name,
        'Clase #' || ca.class_id::text
      ) as class_name,
      ca.class_id,
      count(*)::bigint as records,
      count(*) filter (where (not coalesce(ca.attended, false)) and (not coalesce(ca.paid, false)) and lower(coalesce(trim(ca.status), 'unknown')) = 'tentative')::bigint as tentative,
      count(*) filter (where coalesce(ca.attended, false))::bigint as attended,
      count(*) filter (where coalesce(ca.paid, false))::bigint as paid,
      max(ca.created_at) as last_activity_at
    from public.clase_asistencias ca
    left join lateral (
      select
        coalesce(
          nullif(trim(e.obj->>'titulo'), ''),
          nullif(trim(e.obj->>'nombre'), '')
        ) as class_name
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
    where ca.academy_id = p_academy_id
      and ca.user_id = p_user_id
      and (p_from is null or (ca.created_at at time zone 'utc')::date >= p_from)
      and (p_to is null or (ca.created_at at time zone 'utc')::date <= p_to)
    group by ca.class_id, class_name
    order by records desc, last_activity_at desc
  )
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
  from class_rows cr;

  with history_rows as (
    select
      e.id,
      e.class_id,
      e.class_name,
      e.hora_inicio,
      e.fecha_especifica,
      e.status_norm,
      e.role_norm,
      e.zone_name,
      e.teacher_id,
      e.teacher_name,
      e.att,
      e.paid,
      e.payment_type,
      e.created_at
    from (
      select
        ur.id,
        ur.class_id,
        ur.teacher_id,
        ur.fecha_especifica,
        ur.created_at,
        coalesce(ur.attended, false) as att,
        coalesce(ur.paid, false) as paid,
        ur.payment_type,
        lower(coalesce(trim(ur.status), 'unknown')) as status_norm,
        case
          when ur.role_baile in ('lead', 'leader') then 'leader'
          when ur.role_baile in ('follow', 'follower') then 'follower'
          when ur.role_baile = 'ambos' then 'ambos'
          else 'otro'
        end as role_norm,
        tz.nombre as zone_name,
        coalesce(class_info.class_name, 'Clase #' || ur.class_id::text) as class_name,
        class_info.hora_inicio,
        coalesce(
          nullif(trim(tu.display_name), ''),
          split_part(nullif(trim(tu.email), ''), '@', 1)
        ) as teacher_name
      from public.clase_asistencias ur
      left join public.tags tz on tz.id = ur.zona_tag_id and tz.tipo = 'zona'
      left join public.profiles_teacher pt on pt.id = ur.teacher_id
      left join public.profiles_user tu on tu.user_id = pt.user_id
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
          and (e.obj->>'id')::bigint = ur.class_id
        )
        or (
          ur.class_id % 1000 = 0
          and (ur.class_id / 1000)::int = e.ord - 1
        )
        or (
          ur.class_id < 1000
          and ur.class_id::int = e.ord - 1
        )
        limit 1
      ) class_info on true
      where ur.academy_id = p_academy_id
        and ur.user_id = p_user_id
        and (p_from is null or (ur.created_at at time zone 'utc')::date >= p_from)
        and (p_to is null or (ur.created_at at time zone 'utc')::date <= p_to)
    ) e
    order by e.created_at desc, e.id desc
  )
  select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', hr.id,
          'class_id', hr.class_id,
          'class_name', hr.class_name,
          'session_date', hr.fecha_especifica,
          'hora', hr.hora_inicio,
          'status', hr.status_norm,
          'role', hr.role_norm,
          'zone', hr.zone_name,
          'teacher_id', hr.teacher_id,
          'teacher_name', hr.teacher_name,
          'attended', hr.att,
          'paid', hr.paid,
          'payment_type', hr.payment_type,
          'created_at', hr.created_at
        )
      ),
      '[]'::jsonb
    )
  into v_history
  from history_rows hr;

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

create or replace function public.rpc_get_academy_students_global_metrics(
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

  perform public.assert_academy_student_metrics_allowed(p_academy_id);

  with filtered as (
    select
      ca.user_id,
      ca.class_id,
      ca.zona_tag_id,
      ca.role_baile,
      lower(coalesce(trim(ca.status), 'unknown')) as status_norm,
      ca.created_at
    from public.clase_asistencias ca
    where ca.academy_id = p_academy_id
      and (p_from is null or (ca.created_at at time zone 'utc')::date >= p_from)
      and (p_to is null or (ca.created_at at time zone 'utc')::date <= p_to)
  ),
  all_history as (
    select
      ca.user_id,
      min(ca.created_at) as first_activity_at
    from public.clase_asistencias ca
    where ca.academy_id = p_academy_id
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
    select
      f.status_norm,
      count(distinct f.user_id)::bigint as cnt
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


grant execute on function public.get_academy_class_reservations(bigint) to authenticated;
grant execute on function public.rpc_get_academy_class_metrics(bigint, date, date) to authenticated;
grant execute on function public.rpc_get_academy_global_metrics(bigint, date, date) to authenticated;
grant execute on function public.rpc_get_academy_students_list(bigint, date, date, text, text, text, text, integer, integer) to authenticated;
grant execute on function public.rpc_get_academy_student_detail(bigint, uuid, date, date) to authenticated;
grant execute on function public.rpc_get_academy_students_global_metrics(bigint, date, date) to authenticated;
