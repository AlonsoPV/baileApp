-- ============================================================================
-- Borrar todos los eventos del organizer_id 14
-- ============================================================================
-- Ejecutar en Supabase SQL Editor.
-- Orden: primero RSVPs, luego events_date, luego events_parent.
-- ============================================================================

BEGIN;

-- 1. RSVPs asociados a fechas del organizer 14
DELETE FROM public.event_rsvp
WHERE event_date_id IN (
  SELECT ed.id
  FROM public.events_date ed
  JOIN public.events_parent ep ON ep.id = ed.parent_id
  WHERE ep.organizer_id = 14
);

-- 2. Fechas de eventos del organizer 14
DELETE FROM public.events_date
WHERE parent_id IN (
  SELECT id FROM public.events_parent WHERE organizer_id = 14
);

-- 3. Eventos padre (sociales) del organizer 14
DELETE FROM public.events_parent
WHERE organizer_id = 14;

COMMIT;
