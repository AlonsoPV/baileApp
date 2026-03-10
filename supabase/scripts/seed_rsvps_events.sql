-- Simula RSVPs para los eventos (event_date_id): 12951, 12984, 12609, 12648
-- Usa usuarios existentes de profiles_user (hasta 12 por evento, status going/interesado).
-- Si no hay usuarios en profiles_user, no se inserta nada. Ejecutar en Supabase SQL Editor.

-- 1) Insertar RSVPs (varios usuarios por evento, status 'going' o 'interesado')
WITH target_events AS (
  SELECT id AS event_date_id, parent_id AS event_parent_id
  FROM public.events_date
  WHERE id IN (12951, 12984, 12609, 12648)
),
users_numbered AS (
  SELECT user_id, row_number() OVER () AS rn
  FROM (SELECT user_id FROM public.profiles_user LIMIT 50) t
),
-- 10–12 RSVPs por evento; repartimos usuarios entre eventos
rsvp_rows AS (
  SELECT
    e.event_date_id,
    e.event_parent_id,
    u.user_id,
    CASE (u.rn + e.event_date_id) % 2
      WHEN 0 THEN 'going'
      ELSE 'interesado'
    END AS status
  FROM target_events e
  CROSS JOIN LATERAL (
    SELECT u.user_id, u.rn
    FROM users_numbered u
    ORDER BY (u.rn * 7 + e.event_date_id::int) % 50
    LIMIT 12
  ) u
)
INSERT INTO public.event_rsvp (event_date_id, user_id, status, event_parent_id, updated_at)
SELECT event_date_id, user_id, status, event_parent_id, now()
FROM rsvp_rows
ON CONFLICT (event_date_id, user_id)
DO UPDATE SET status = EXCLUDED.status, event_parent_id = COALESCE(EXCLUDED.event_parent_id, event_rsvp.event_parent_id), updated_at = now();

-- 2) Recalcular contadores por evento
SELECT public.recalc_event_rsvp_counts(v) FROM (VALUES (12951), (12984), (12609), (12648)) AS t(v);

-- 3) Recalcular rsvp_events en profiles_user para los usuarios que tocamos
DO $$
DECLARE
  u uuid;
BEGIN
  FOR u IN
    SELECT DISTINCT user_id FROM public.event_rsvp
    WHERE event_date_id IN (12951, 12984, 12609, 12648)
  LOOP
    PERFORM public.recalc_user_rsvp_events(u);
  END LOOP;
END $$;

-- Resumen
SELECT
  event_date_id,
  COUNT(*) AS rsvps,
  COUNT(*) FILTER (WHERE status = 'going') AS going,
  COUNT(*) FILTER (WHERE status = 'interesado') AS interesado
FROM public.event_rsvp
WHERE event_date_id IN (12951, 12984, 12609, 12648)
GROUP BY event_date_id
ORDER BY event_date_id;
