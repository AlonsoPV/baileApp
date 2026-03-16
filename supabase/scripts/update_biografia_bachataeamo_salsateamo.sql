-- Añade la biografía "ISM | Meet - Learn - Dance" a los eventos de nombre BACHATAEAMO SALSATEAMO
-- en la tabla events_date (por nombre en la fecha o por nombre del parent).

UPDATE public.events_date ed
SET
  biografia = 'ISM | Meet - Learn - Dance',
  updated_at = COALESCE(ed.updated_at, now())
WHERE
  TRIM(COALESCE(ed.nombre, '')) ILIKE 'BACHATAEAMO SALSATEAMO'
  OR ed.parent_id IN (
    SELECT id
    FROM public.events_parent
    WHERE TRIM(COALESCE(nombre, '')) ILIKE 'BACHATAEAMO SALSATEAMO'
  );

-- Verificación: listar las filas actualizadas
SELECT id, nombre, parent_id, biografia
FROM public.events_date
WHERE biografia = 'ISM | Meet - Learn - Dance';
