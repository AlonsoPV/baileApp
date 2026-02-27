-- Materializa ocurrencias semanales (events_date) para un parent recurrente.
-- Fuente de verdad:
-- - Ocurrencias reales: events_date.fecha (DATE) siempre lleno.
-- - dia_semana se usa como configuración/plantilla; las ocurrencias generadas se insertan con dia_semana = NULL.
--
-- Nota: evitamos depender de un índice/constraint único existente para (parent_id, fecha),
-- usando LEFT JOIN para no duplicar. (Luego se puede agregar constraint único cuando la data esté limpia.)
--
-- Importante (caso real): algunos `parent_id` contienen múltiples "series" distintas (nombres diferentes).
-- En ese caso, deduplicar solo por (parent_id, fecha) puede bloquear la materialización.
-- Aquí deduplicamos por (parent_id, fecha, nombre) para permitir múltiples eventos el mismo día bajo un parent.

create or replace function public.ensure_weekly_occurrences(
  p_parent_id bigint,
  p_weeks_ahead int default 12
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
  max_fecha_weekly date;
  horizon_max date;
  inserted_total int := 0;
  inserted int := 0;
begin
  if p_parent_id is null then
    return 0;
  end if;
  if p_weeks_ahead is null or p_weeks_ahead < 1 then
    return 0;
  end if;

  today_cdmx := (now() at time zone 'America/Mexico_City')::date;
  -- Ventana de seguridad: ignorar "max(fecha)" absurdamente lejano.
  -- (Si existe basura como 2038+, NO debe empujar el start_date.)
  horizon_max := (today_cdmx + ((greatest(p_weeks_ahead, 12) + 2) * 7))::date;

  -- 1) Generar por cada serie recurrente (dia_semana) dentro del parent.
  -- Si un parent tiene 2 plantillas (ej. miércoles y jueves), materializamos ambas.
  for tpl in
    select distinct on (dia_semana) *
    from public.events_date
    where parent_id = p_parent_id
      and dia_semana is not null
    order by dia_semana, updated_at desc nulls last, created_at desc nulls last, id desc
  loop
    weekday := tpl.dia_semana;

    -- Última ocurrencia de esta serie (mismo parent + mismo dia_semana)
    select max(fecha)
    into max_fecha_weekly
    from public.events_date
    where parent_id = p_parent_id
      and dia_semana = weekday
      and coalesce(nombre, '') = coalesce(tpl.nombre, '')
      and fecha is not null
      and fecha <= horizon_max;

    -- Regla: generar siempre hacia adelante, empezando una semana después de la última fecha conocida
    if max_fecha_weekly is not null then
      start_date := (max_fecha_weekly + 7)::date;
    elsif tpl.fecha is not null then
      start_date := (tpl.fecha + 7)::date;
    else
      start_date := today_cdmx;
    end if;

    start_date := greatest(start_date, today_cdmx);
    start_date := (start_date + (((weekday - extract(dow from start_date))::int + 7) % 7))::date;

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
      from generate_series(0, p_weeks_ahead - 1) as s(i)
    ) gen
    left join public.events_date existing
      on existing.parent_id = tpl.parent_id
     and existing.fecha = gen.fecha
     and coalesce(existing.nombre, '') = coalesce(tpl.nombre, '')
    where existing.id is null;

    get diagnostics inserted = row_count;
    inserted_total := inserted_total + inserted;
  end loop;

  return inserted_total;
end;
$$;

grant execute on function public.ensure_weekly_occurrences(bigint, int) to anon, authenticated;

-- Recomendado: evitar duplicados por (parent_id, fecha)
-- Lo creamos SOLO si no hay duplicados existentes (para no romper migración en prod).
do $$
begin
  if exists (
    select 1
    from public.events_date
    where fecha is not null
    group by parent_id, fecha, nombre
    having count(*) > 1
    limit 1
  ) then
    raise notice 'Skipping unique index events_date(parent_id, fecha, nombre): duplicates exist (run backfill/cleanup first).';
    return;
  end if;

  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'events_date_parent_id_fecha_nombre_uniq_idx'
  ) then
    execute 'create unique index events_date_parent_id_fecha_nombre_uniq_idx on public.events_date (parent_id, fecha, nombre) where fecha is not null;';
  end if;
end $$;

-- Recomendado: un recurrente (dia_semana) debe estar ligado a un parent.
-- Lo creamos SOLO si no existen filas inválidas (dia_semana not null AND parent_id is null).
do $$
begin
  if exists (
    select 1
    from public.events_date
    where dia_semana is not null
      and parent_id is null
    limit 1
  ) then
    raise notice 'Skipping constraint recurrent_requires_parent: rows exist with dia_semana and parent_id NULL (backfill first).';
    return;
  end if;

  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'events_date'
      and constraint_name = 'events_date_recurrent_requires_parent_chk'
  ) then
    alter table public.events_date
      add constraint events_date_recurrent_requires_parent_chk
      check (dia_semana is null or parent_id is not null);
  end if;
end $$;

