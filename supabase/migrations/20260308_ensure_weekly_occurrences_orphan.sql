-- Materializa ocurrencias semanales para series recurrentes SIN parent (parent_id null, organizer_id set).
-- Serie recurrente orphan = (organizer_id, dia_semana, nombre).

create or replace function public.ensure_weekly_occurrences_orphan(
  p_organizer_id bigint,
  p_weeks_ahead int default 12
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max_future constant int := 30;
  v_weeks_to_generate int;
  today_cdmx date;
  tpl record;
  weekday int;
  start_date date;
  max_fecha_weekly date;
  horizon_max date;
  inserted_total int := 0;
  inserted int := 0;
  future_existing int := 0;
  slots_left int := 0;
begin
  if p_organizer_id is null then
    return 0;
  end if;
  if p_weeks_ahead is null or p_weeks_ahead < 1 then
    return 0;
  end if;

  v_weeks_to_generate := least(greatest(p_weeks_ahead, 1), v_max_future);
  today_cdmx := (now() at time zone 'America/Mexico_City')::date;
  horizon_max := (today_cdmx + ((greatest(v_weeks_to_generate, 12) + 2) * 7))::date;

  for tpl in
    select distinct on (dia_semana) *
    from public.events_date
    where parent_id is null
      and organizer_id = p_organizer_id
      and dia_semana is not null
    order by dia_semana, updated_at desc nulls last, created_at desc nulls last, id desc
  loop
    weekday := tpl.dia_semana;

    select max(fecha)
    into max_fecha_weekly
    from public.events_date
    where parent_id is null
      and organizer_id = p_organizer_id
      and dia_semana = weekday
      and coalesce(nombre, '') = coalesce(tpl.nombre, '')
      and fecha is not null
      and fecha <= horizon_max;

    if max_fecha_weekly is not null then
      start_date := (max_fecha_weekly + 7)::date;
    elsif tpl.fecha is not null then
      start_date := (tpl.fecha + 7)::date;
    else
      start_date := today_cdmx;
    end if;

    start_date := greatest(start_date, today_cdmx);
    start_date := (start_date + (((weekday - extract(dow from start_date))::int + 7) % 7))::date;

    select count(*)
    into future_existing
    from public.events_date
    where parent_id is null
      and organizer_id = p_organizer_id
      and dia_semana = weekday
      and coalesce(nombre, '') = coalesce(tpl.nombre, '')
      and fecha > today_cdmx;

    slots_left := greatest(v_max_future - coalesce(future_existing, 0), 0);
    if slots_left <= 0 then
      continue;
    end if;

    insert into public.events_date (
      parent_id,
      organizer_id,
      nombre,
      biografia,
      djs,
      telefono_contacto,
      mensaje_contacto,
      fecha,
      dia_semana,
      hora_inicio,
      hora_fin,
      lugar,
      direccion,
      ciudad,
      zona,
      referencias,
      requisitos,
      estilos,
      ritmos_seleccionados,
      zonas,
      ubicaciones,
      cronograma,
      costos,
      media,
      flyer_url,
      estado_publicacion
    )
    select
      null::bigint,
      tpl.organizer_id,
      tpl.nombre,
      tpl.biografia,
      tpl.djs,
      tpl.telefono_contacto,
      tpl.mensaje_contacto,
      gen.fecha,
      weekday as dia_semana,
      tpl.hora_inicio,
      tpl.hora_fin,
      tpl.lugar,
      tpl.direccion,
      tpl.ciudad,
      tpl.zona,
      tpl.referencias,
      tpl.requisitos,
      tpl.estilos,
      tpl.ritmos_seleccionados,
      tpl.zonas,
      tpl.ubicaciones,
      tpl.cronograma,
      tpl.costos,
      tpl.media,
      tpl.flyer_url,
      tpl.estado_publicacion
    from (
      select (start_date + (i * interval '7 days'))::date as fecha
      from generate_series(0, least(v_weeks_to_generate, slots_left) - 1) as s(i)
    ) gen
    left join public.events_date existing
      on existing.parent_id is null
     and existing.organizer_id = tpl.organizer_id
     and existing.fecha = gen.fecha
     and coalesce(existing.nombre, '') = coalesce(tpl.nombre, '')
    where existing.id is null;

    get diagnostics inserted = row_count;
    inserted_total := inserted_total + inserted;
  end loop;

  return inserted_total;
end;
$$;

grant execute on function public.ensure_weekly_occurrences_orphan(bigint, int) to anon, authenticated;
