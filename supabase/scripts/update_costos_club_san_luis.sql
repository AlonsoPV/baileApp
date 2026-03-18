-- Añade los costos indicados a los eventos de nombre "Club San Luis" en events_date.
-- Solo afecta a fechas con dia_semana 4, 5 o 6 (jueves, viernes, sábado si 0=domingo).
-- Ejecutar en Supabase SQL Editor.

UPDATE public.events_date ed
SET
  costos = '[
    {"nombre": "Gabinetes", "descripcion": "4 personas consumo minimo", "tipo": "taquilla", "precio": 2200, "monto": 2200},
    {"nombre": "Mesa de salón", "descripcion": "5 personas consumo minimo", "tipo": "taquilla", "precio": 2400, "monto": 2400},
    {"nombre": "Mesa de pista", "descripcion": "4 personas consumo minimo", "tipo": "taquilla", "precio": 3500, "monto": 3500}
  ]'::jsonb,
  updated_at = COALESCE(ed.updated_at, now())
WHERE
  ed.dia_semana IN (4, 5, 6)
  AND (
    TRIM(COALESCE(ed.nombre, '')) ILIKE 'Club San Luis'
    OR ed.parent_id IN (
      SELECT id
      FROM public.events_parent
      WHERE TRIM(COALESCE(nombre, '')) ILIKE 'Club San Luis'
    )
  );

-- Verificación: listar las filas actualizadas (Club San Luis con dia_semana 4, 5 o 6)
SELECT id, nombre, parent_id, dia_semana, costos, updated_at
FROM public.events_date
WHERE
  dia_semana IN (4, 5, 6)
  AND (
    TRIM(COALESCE(nombre, '')) ILIKE 'Club San Luis'
    OR parent_id IN (SELECT id FROM public.events_parent WHERE TRIM(COALESCE(nombre, '')) ILIKE 'Club San Luis')
  );
