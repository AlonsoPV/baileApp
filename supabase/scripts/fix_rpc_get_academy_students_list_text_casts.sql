-- Fix inmediato para rpc_get_academy_students_list
-- Error corregido:
--   42804: Returned type character varying does not match expected type text in column 5

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
      count(*) filter (where e.status_norm = 'tentative')::bigint as total_tentative,
      count(*) filter (where e.status_norm = 'pagado')::bigint as total_paid,
      count(*) filter (where e.status_norm in ('asistio', 'asistió', 'attended'))::bigint as total_attended,
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

grant execute on function public.rpc_get_academy_students_list(bigint, date, date, text, text, text, text, integer, integer) to authenticated;
