-- ============================================================================
-- Borrar fechas de evento (events_date) con id entre 13385 y 13413 (inclusive)
-- ============================================================================
-- Ejecutar en Supabase SQL Editor (o psql) con permisos de servicio / bypass RLS.
--
-- IMPORTANTE:
-- - En la app, el "evento" que ves en explore suele ser `public.events_date.id`.
-- - Si en realidad necesitas borrar `events_parent.id` (evento padre / serie),
--   usa el bloque comentado al final y NO mezcles rangos sin verificar.
--
-- Antes de borrar: revisa el SELECT de verificación.
-- ============================================================================

BEGIN;

-- 0) Vista previa: qué vas a borrar
SELECT ed.id, ed.nombre, ed.fecha, ed.parent_id, ed.organizer_id
FROM public.events_date ed
WHERE ed.id BETWEEN 13385 AND 13413
ORDER BY ed.id;

-- 1) Dependencias explícitas (por si en tu BD alguna FK no tiene CASCADE)
DELETE FROM public.event_rsvp
WHERE event_date_id BETWEEN 13385 AND 13413;

DELETE FROM public.user_favorites
WHERE event_date_id BETWEEN 13385 AND 13413;

-- 2) Fechas
DELETE FROM public.events_date
WHERE id BETWEEN 13385 AND 13413;

COMMIT;

-- ============================================================================
-- OPCIONAL: limpiar events_parent que hayan quedado sin ninguna events_date
-- (descomenta solo si quieres eliminar también los padres huérfanos)
-- ============================================================================
/*
BEGIN;

DELETE FROM public.events_parent ep
WHERE NOT EXISTS (
  SELECT 1 FROM public.events_date ed WHERE ed.parent_id = ep.id
);

COMMIT;
*/

-- ============================================================================
-- ALTERNATIVA: si los IDs 13385–13413 son de events_parent (no de events_date)
-- ============================================================================
/*
BEGIN;

SELECT ep.id, ep.nombre, ep.organizer_id
FROM public.events_parent ep
WHERE ep.id BETWEEN 13385 AND 13413
ORDER BY ep.id;

DELETE FROM public.event_rsvp
WHERE event_date_id IN (
  SELECT ed.id FROM public.events_date ed
  WHERE ed.parent_id BETWEEN 13385 AND 13413
);

DELETE FROM public.user_favorites
WHERE event_date_id IN (
  SELECT ed.id FROM public.events_date ed
  WHERE ed.parent_id BETWEEN 13385 AND 13413
);

DELETE FROM public.events_date
WHERE parent_id BETWEEN 13385 AND 13413;

DELETE FROM public.events_parent
WHERE id BETWEEN 13385 AND 13413;

COMMIT;
*/
