-- Limita cada serie recurrente a un máximo de 30 fechas futuras.
-- Serie recurrente = (parent_id, dia_semana, nombre).
-- "Futuras" = fecha > hoy (America/Mexico_City).

-- 1) Ajustar el generador para no materializar más de 30 futuras por serie.
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
  if p_parent_id is null then
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
    where parent_id = p_parent_id
      and dia_semana is not null
    order by dia_semana, updated_at desc nulls last, created_at desc nulls last, id desc
  loop
    weekday := tpl.dia_semana;

    select max(fecha)
    into max_fecha_weekly
    from public.events_date
    where parent_id = p_parent_id
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
    where parent_id = p_parent_id
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
      from generate_series(0, least(v_weeks_to_generate, slots_left) - 1) as s(i)
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

-- 2) Limpiar series que hoy excedan 30 fechas futuras (conserva las 30 más próximas).
with ranked as (
  select
    id,
    row_number() over (
      partition by parent_id, dia_semana, coalesce(nombre, '')
      order by fecha asc, id asc
    ) as rn
  from public.events_date
  where dia_semana is not null
    and fecha > ((now() at time zone 'America/Mexico_City')::date)
)
delete from public.events_date d
using ranked r
where d.id = r.id
  and r.rn > 30;

-- 3) Trigger de protección para INSERT/UPDATE manuales.
create or replace function public.enforce_recurring_future_limit_30()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  today_cdmx date;
  future_count int := 0;
begin
  if new.dia_semana is null or new.parent_id is null or new.fecha is null then
    return new;
  end if;

  today_cdmx := (now() at time zone 'America/Mexico_City')::date;
  if new.fecha <= today_cdmx then
    return new;
  end if;

  select count(*)
  into future_count
  from public.events_date e
  where e.parent_id = new.parent_id
    and e.dia_semana = new.dia_semana
    and coalesce(e.nombre, '') = coalesce(new.nombre, '')
    and e.fecha > today_cdmx
    and (tg_op = 'INSERT' or e.id <> new.id);

  if future_count >= 30 then
    raise exception
      'Máximo 30 fechas futuras permitidas para esta serie recurrente (parent_id=%, dia_semana=%, nombre=%).',
      new.parent_id, new.dia_semana, coalesce(new.nombre, '')
      using errcode = '23514',
            hint = 'Elimina o mueve fechas futuras para dejar menos de 30.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_recurring_future_limit_30 on public.events_date;

create trigger trg_enforce_recurring_future_limit_30
before insert or update of parent_id, dia_semana, nombre, fecha
on public.events_date
for each row
execute function public.enforce_recurring_future_limit_30();

