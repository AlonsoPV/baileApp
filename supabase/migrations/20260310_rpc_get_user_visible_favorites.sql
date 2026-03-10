drop function if exists public.rpc_get_user_visible_favorites() cascade;

create or replace function public.rpc_get_user_visible_favorites()
returns table(
  favorite_id bigint,
  entity_type text,
  entity_id text,
  title text,
  subtitle text,
  image_url text,
  date_label text,
  location_label text,
  detail_route text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
with mine as (
  select *
  from public.user_favorites uf
  where uf.user_id = auth.uid()
),
events_visible as (
  select
    uf.id as favorite_id,
    'event'::text as entity_type,
    ed.id::text as entity_id,
    coalesce(ed.nombre, 'Evento') as title,
    coalesce(ed.ciudad, ed.lugar, '') as subtitle,
    ed.flyer_url as image_url,
    case when ed.fecha is not null then ed.fecha::text else null end as date_label,
    concat_ws(', ', nullif(ed.lugar, ''), nullif(ed.ciudad, '')) as location_label,
    ('/social/fecha/' || ed.id::text) as detail_route,
    uf.created_at
  from mine uf
  join public.events_date ed
    on uf.entity_type = 'event'
   and uf.event_date_id = ed.id
  where ed.estado_publicacion = 'publicado'
    and (
      ed.dia_semana is not null
      or (ed.fecha is not null and ed.fecha >= (now() at time zone 'America/Mexico_City')::date)
    )
),
classes_teacher as (
  select
    uf.id as favorite_id,
    'class'::text as entity_type,
    coalesce((item.obj->>'id'), concat('teacher:', pt.id::text, ':', uf.class_cronograma_index::text)) as entity_id,
    coalesce(item.obj->>'titulo', item.obj->>'nombre', 'Clase') as title,
    coalesce(pt.nombre_publico, 'Maestro') as subtitle,
    pt.avatar_url as image_url,
    nullif(item.obj->>'fecha', '') as date_label,
    coalesce(item.obj->'ubicacion'->>'nombre', item.obj->>'ubicacion', '') as location_label,
    ('/clase/teacher/' || pt.id::text || '?i=' || uf.class_cronograma_index::text) as detail_route,
    uf.created_at
  from mine uf
  join public.profiles_teacher pt
    on uf.entity_type = 'class'
   and uf.class_source_type = 'teacher'
   and uf.class_source_id = pt.id
  join lateral (
    select e.obj, e.ord
    from jsonb_array_elements(coalesce(pt.cronograma, '[]'::jsonb)) with ordinality as e(obj, ord)
    where (e.ord - 1) = uf.class_cronograma_index
    limit 1
  ) item on true
  where pt.estado_aprobacion = 'aprobado'
),
classes_academy as (
  select
    uf.id as favorite_id,
    'class'::text as entity_type,
    coalesce((item.obj->>'id'), concat('academy:', pa.id::text, ':', uf.class_cronograma_index::text)) as entity_id,
    coalesce(item.obj->>'titulo', item.obj->>'nombre', 'Clase') as title,
    coalesce(pa.nombre_publico, 'Academia') as subtitle,
    pa.avatar_url as image_url,
    nullif(item.obj->>'fecha', '') as date_label,
    coalesce(item.obj->'ubicacion'->>'nombre', item.obj->>'ubicacion', '') as location_label,
    ('/clase/academy/' || pa.id::text || '?i=' || uf.class_cronograma_index::text) as detail_route,
    uf.created_at
  from mine uf
  join public.profiles_academy pa
    on uf.entity_type = 'class'
   and uf.class_source_type = 'academy'
   and uf.class_source_id = pa.id
  join lateral (
    select e.obj, e.ord
    from jsonb_array_elements(coalesce(pa.cronograma, '[]'::jsonb)) with ordinality as e(obj, ord)
    where (e.ord - 1) = uf.class_cronograma_index
    limit 1
  ) item on true
  where pa.estado_aprobacion = 'aprobado'
)
select * from events_visible
union all
select * from classes_teacher
union all
select * from classes_academy
order by created_at desc;
$$;

grant execute on function public.rpc_get_user_visible_favorites() to authenticated;

