-- Dashboard: métricas globales de academia (una respuesta JSON).
-- Período: created_at::date en UTC, alineado con el filtro por created_at en useAcademyMetrics.

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
  v_unique_students bigint;
  v_total_records bigint;
  v_sessions bigint;
  v_role_lead bigint;
  v_role_follow bigint;
  v_role_ambos bigint;
  v_role_other bigint;
  v_zones jsonb;
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

  with filtered as (
    select
      ca.user_id,
      ca.class_id,
      ca.fecha_especifica,
      ca.role_baile,
      ca.zona_tag_id
    from public.clase_asistencias ca
    where ca.academy_id = p_academy_id
      and ca.status = 'tentative'
      and (p_from is null or (ca.created_at at time zone 'utc')::date >= p_from)
      and (p_to is null or (ca.created_at at time zone 'utc')::date <= p_to)
  ),
  stats as (
    select
      (select count(distinct f.user_id) from filtered f) as unique_students,
      (select count(*)::bigint from filtered f) as total_records,
      (
        select count(*)::bigint
        from (
          select distinct f.class_id, coalesce(f.fecha_especifica, '0001-01-01'::date)
          from filtered f
        ) s
      ) as sessions_cnt,
      (select count(*) filter (where f.role_baile in ('lead', 'leader')) from filtered f) as r_lead,
      (select count(*) filter (where f.role_baile in ('follow', 'follower')) from filtered f) as r_follow,
      (select count(*) filter (where f.role_baile = 'ambos') from filtered f) as r_ambos,
      (
        select count(*) filter (
          where f.role_baile is null
             or f.role_baile not in ('lead', 'leader', 'follow', 'follower', 'ambos')
        )
        from filtered f
      ) as r_other
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
  )
  select
    s.unique_students,
    s.total_records,
    s.sessions_cnt,
    s.r_lead,
    s.r_follow,
    s.r_ambos,
    s.r_other,
    coalesce(
      (
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
      ),
      '[]'::jsonb
    )
  into
    v_unique_students,
    v_total_records,
    v_sessions,
    v_role_lead,
    v_role_follow,
    v_role_ambos,
    v_role_other,
    v_zones
  from stats s;

  return jsonb_build_object(
    'total_classes_registered', v_total_classes,
    'unique_students', coalesce(v_unique_students, 0),
    'total_attendance_records', coalesce(v_total_records, 0),
    'sessions_with_reservations', coalesce(v_sessions, 0),
    'role_breakdown', jsonb_build_object(
      'lead', coalesce(v_role_lead, 0),
      'follow', coalesce(v_role_follow, 0),
      'ambos', coalesce(v_role_ambos, 0),
      'other', coalesce(v_role_other, 0)
    ),
    'zone_breakdown', coalesce(v_zones, '[]'::jsonb)
  );
end;
$$;

comment on function public.rpc_get_academy_global_metrics(bigint, date, date) is
'Métricas globales de academia: clases en cronograma; alumnos únicos, volumen y sesiones con reserva (tentative, período por created_at UTC); roles; zonas (tags tipo zona).';

grant execute on function public.rpc_get_academy_global_metrics(bigint, date, date) to authenticated;
