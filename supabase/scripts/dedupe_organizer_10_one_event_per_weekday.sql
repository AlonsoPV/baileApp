-- One-off: organizer_id = 10
-- Objetivo: dejar solo 1 evento futuro por día de semana entre martes y sábado.
-- Días incluidos (Postgres DOW): martes=2, miércoles=3, jueves=4, viernes=5, sábado=6.
-- Regla: se conserva el evento más cercano (fecha más próxima) por cada DOW y se eliminan los demás.

begin;

with candidates as (
  select
    id,
    fecha,
    extract(dow from fecha)::int as dow
  from public.events_date
  where organizer_id = 10
    and fecha >= ((now() at time zone 'America/Mexico_City')::date)
    and extract(dow from fecha)::int in (2, 3, 4, 5, 6)
),
ranked as (
  select
    id,
    dow,
    row_number() over (
      partition by dow
      order by fecha asc, id asc
    ) as rn
  from candidates
)
delete from public.events_date d
using ranked r
where d.id = r.id
  and r.rn > 1;

commit;

-- Verificación rápida:
-- select
--   extract(dow from fecha)::int as dow,
--   min(fecha) as fecha_mas_cercana,
--   count(*) as total_futuras
-- from public.events_date
-- where organizer_id = 10
--   and fecha >= ((now() at time zone 'America/Mexico_City')::date)
--   and extract(dow from fecha)::int in (2, 3, 4, 5, 6)
-- group by 1
-- order by 1;
