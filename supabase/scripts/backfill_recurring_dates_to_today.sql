-- ============================================================================
-- Backfill: materializar fechas pasadas de eventos recurrentes hasta hoy
-- ============================================================================
-- Para cada serie recurrente (parent_id, dia_semana, nombre), genera las
-- ocurrencias semanales desde la fecha de inicio hasta hoy que aún no existan.
-- Así se rellenan fechas históricas que nunca se materializaron.
--
-- Ejecutar en Supabase SQL Editor (puede tardar según el volumen de datos).
-- ============================================================================

create or replace function public.backfill_recurring_dates_to_today(
  p_parent_id bigint default null,  -- null = todos los parents; o un id específico
  p_weeks_back int default 52       -- cuántas semanas hacia atrás desde hoy buscar inicio
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  today_cdmx date;
  tpl record;
  weekday int;
  start_date date;
  min_fecha date;
  max_fecha_past date;
  inserted_total int := 0;
  inserted int := 0;
  weeks_back_actual int;
begin
  today_cdmx := (now() at time zone 'America/Mexico_City')::date;
  weeks_back_actual := greatest(coalesce(p_weeks_back, 52), 1);

  -- Por cada serie recurrente (plantilla con dia_semana)
  for tpl in
    select distinct on (ed.parent_id, ed.dia_semana, coalesce(ed.nombre, ''))
      ed.*,
      coalesce(ed.organizer_id, ep.organizer_id) as org_id
    from public.events_date ed
    join public.events_parent ep on ep.id = ed.parent_id
    where ed.dia_semana is not null
      and (p_parent_id is null or ed.parent_id = p_parent_id)
    order by ed.parent_id, ed.dia_semana, coalesce(ed.nombre, ''), ed.updated_at desc nulls last, ed.id desc
  loop
    weekday := tpl.dia_semana;

    -- Fecha mínima de la serie existente (para no generar antes de lo ya creado)
    select min(fecha), max(fecha)
    into min_fecha, max_fecha_past
    from public.events_date
    where parent_id = tpl.parent_id
      and dia_semana = weekday
      and coalesce(nombre, '') = coalesce(tpl.nombre, '')
      and fecha is not null
      and fecha <= today_cdmx;

    -- start_date: desde cuándo generar hacia adelante
    -- Si ya hay fechas pasadas, generamos desde (min - 7) hasta min, y luego hasta today
    -- Otra opción: si tpl.fecha existe, usarla; si no, usar (today - weeks_back_actual semanas)
    if min_fecha is not null then
      start_date := min_fecha - (weeks_back_actual * 7);
    elsif tpl.fecha is not null and tpl.fecha <= today_cdmx then
      start_date := tpl.fecha;
    else
      -- Sin fechas previas: generar desde hace N semanas
      start_date := today_cdmx - (weeks_back_actual * 7);
    end if;

    -- Alinear start_date al dia_semana correcto (0=dom, 1=lun, ..., 6=sáb)
    start_date := (start_date + (((weekday - extract(dow from start_date))::int + 7) % 7))::date;

    if start_date > today_cdmx then
      continue;  -- no hay fechas pasadas que generar para esta serie
    end if;

    -- Solo generar fechas <= hoy
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
      tpl.parent_id,
      tpl.org_id,
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
      from generate_series(0, (today_cdmx - start_date)::int / 7) as s(i)
    ) gen
    left join public.events_date existing
      on existing.parent_id = tpl.parent_id
     and existing.fecha = gen.fecha
     and coalesce(existing.nombre, '') = coalesce(tpl.nombre, '')
    where existing.id is null
      and gen.fecha <= today_cdmx;

    get diagnostics inserted = row_count;
    inserted_total := inserted_total + inserted;
  end loop;

  return inserted_total;
end;
$$;

grant execute on function public.backfill_recurring_dates_to_today(bigint, int) to service_role;
grant execute on function public.backfill_recurring_dates_to_today(bigint, int) to postgres;

-- Ejecutar backfill (descomenta para correr tras crear la función)
-- do $$
-- declare
--   n int;
-- begin
--   n := backfill_recurring_dates_to_today(null, 52);
--   raise notice 'Backfill completado: se insertaron % fechas retroactivas.', n;
-- end $$;

-- O ejecuta directamente: select backfill_recurring_dates_to_today(null, 52);
