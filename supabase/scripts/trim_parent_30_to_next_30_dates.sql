-- One-off: conservar solo las 30 fechas futuras más cercanas para parent_id = 30.
-- Futuras = fecha >= hoy en America/Mexico_City.

begin;

with ranked as (
  select
    id,
    row_number() over (order by fecha asc, id asc) as rn
  from public.events_date
  where parent_id = 30
    and fecha >= ((now() at time zone 'America/Mexico_City')::date)
)
delete from public.events_date d
using ranked r
where d.id = r.id
  and r.rn > 30;

commit;

-- Verificación rápida:
-- select id, fecha, nombre
-- from public.events_date
-- where parent_id = 30
--   and fecha >= ((now() at time zone 'America/Mexico_City')::date)
-- order by fecha asc, id asc;
