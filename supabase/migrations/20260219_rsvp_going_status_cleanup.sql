-- RSVP: add 'going' status, event_parent_id, updated_at, expiration cleanup
-- Expiration: event_end_ts = fecha + hora_fin OR hora_inicio OR 23:59:59 (America/Mexico_City)

-- 1) Alter event_rsvp: add 'going' to status, add event_parent_id and updated_at
ALTER TABLE public.event_rsvp
  DROP CONSTRAINT IF EXISTS event_rsvp_status_check;

ALTER TABLE public.event_rsvp
  ADD CONSTRAINT event_rsvp_status_check
  CHECK (status IN ('interesado', 'going'));

ALTER TABLE public.event_rsvp
  ADD COLUMN IF NOT EXISTS event_parent_id bigint REFERENCES public.events_parent(id) ON DELETE SET NULL;

ALTER TABLE public.event_rsvp
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_event_rsvp_user_created
  ON public.event_rsvp(user_id, created_at DESC);

-- 2) Update upsert_event_rsvp to accept 'going' and set event_parent_id
DROP FUNCTION IF EXISTS public.upsert_event_rsvp(bigint, text);
CREATE OR REPLACE FUNCTION public.upsert_event_rsvp(p_event_date_id bigint, p_status text)
RETURNS jsonb AS $$
DECLARE
  v_stats record;
  v_status text;
  v_parent_id bigint;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;
  IF p_status NOT IN ('interesado', 'going') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  SELECT parent_id INTO v_parent_id
  FROM public.events_date
  WHERE id = p_event_date_id
  LIMIT 1;

  INSERT INTO public.event_rsvp (event_date_id, user_id, status, event_parent_id, updated_at)
  VALUES (p_event_date_id, auth.uid(), p_status, v_parent_id, now())
  ON CONFLICT (event_date_id, user_id)
  DO UPDATE SET status = EXCLUDED.status, event_parent_id = COALESCE(EXCLUDED.event_parent_id, event_rsvp.event_parent_id), updated_at = now();

  SELECT * INTO v_stats FROM public.get_event_rsvp_stats(p_event_date_id);
  SELECT public.get_user_rsvp_status(p_event_date_id) INTO v_status;

  RETURN jsonb_build_object(
    'success', true,
    'user_status', v_status,
    'stats', jsonb_build_object(
      'interesado', v_stats.interesado,
      'going', v_stats.going,
      'total', v_stats.total
    )
  );
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Update get_event_rsvp_stats to return going + interesado + total, use hora_fin for expiration
DROP FUNCTION IF EXISTS public.get_event_rsvp_stats(bigint);
CREATE OR REPLACE FUNCTION public.get_event_rsvp_stats(event_id bigint)
RETURNS TABLE (interesado integer, going integer, total integer) AS $$
DECLARE
  event_fecha date;
  event_hora_inicio time;
  event_hora_fin time;
  event_end_ts timestamp;
  now_cdmx timestamp;
BEGIN
  SELECT ed.fecha, ed.hora_inicio, ed.hora_fin
  INTO event_fecha, event_hora_inicio, event_hora_fin
  FROM public.events_date ed
  WHERE ed.id = event_id;

  IF event_fecha IS NULL THEN
    RETURN QUERY SELECT 0::int AS interesado, 0::int AS going, 0::int AS total;
    RETURN;
  END IF;

  -- Compute event_end_ts: fecha + hora_fin, else hora_inicio, else 23:59:59
  IF event_hora_fin IS NOT NULL THEN
    event_end_ts := (event_fecha::text || ' ' || event_hora_fin::text)::timestamp;
  ELSIF event_hora_inicio IS NOT NULL THEN
    event_end_ts := (event_fecha::text || ' ' || event_hora_inicio::text)::timestamp;
  ELSE
    event_end_ts := (event_fecha::text || ' 23:59:59')::timestamp;
  END IF;

  now_cdmx := (NOW() AT TIME ZONE 'America/Mexico_City');
  event_end_ts := event_end_ts AT TIME ZONE 'America/Mexico_City';

  IF event_end_ts < now_cdmx THEN
    RETURN QUERY SELECT 0::int AS interesado, 0::int AS going, 0::int AS total;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE r.status = 'interesado'), 0)::int AS interesado,
    COALESCE(COUNT(*) FILTER (WHERE r.status = 'going'), 0)::int AS going,
    COALESCE(COUNT(*), 0)::int AS total
  FROM public.event_rsvp r
  WHERE r.event_date_id = event_id;
END; $$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_event_rsvp_stats(bigint) IS
'Counts RSVPs for future events only. Expiration: fecha + hora_fin, else hora_inicio, else 23:59:59. Timezone: America/Mexico_City.';

-- 4) recalc_event_rsvp_counts: count both going and interesado
CREATE OR REPLACE FUNCTION public.recalc_event_rsvp_counts(p_event_date_id bigint)
RETURNS void AS $$
BEGIN
  UPDATE public.events_date ed
  SET rsvp_interesado_count = COALESCE((
    SELECT COUNT(*) FROM public.event_rsvp r
    WHERE r.event_date_id = p_event_date_id
      AND r.status IN ('interesado', 'going')
  ), 0)
  WHERE ed.id = p_event_date_id;
END; $$ LANGUAGE plpgsql;

-- 5) cleanup_expired_rsvps: delete RSVPs whose event has ended
CREATE OR REPLACE FUNCTION public.cleanup_expired_rsvps()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
  event_end_ts timestamp;
  now_cdmx timestamp;
BEGIN
  now_cdmx := (NOW() AT TIME ZONE 'America/Mexico_City');

  WITH expired AS (
    SELECT r.id
    FROM public.event_rsvp r
    JOIN public.events_date ed ON ed.id = r.event_date_id
    WHERE ed.fecha IS NOT NULL
      AND (
        -- event_end_ts = fecha + hora_fin, else hora_inicio, else 23:59:59 (America/Mexico_City)
        (
          (ed.fecha::text || ' ' || COALESCE(ed.hora_fin::text, ed.hora_inicio::text, '23:59:59'))::timestamp
        ) < now_cdmx
      )
  )
  DELETE FROM public.event_rsvp
  WHERE id IN (SELECT id FROM expired);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_expired_rsvps() IS
'Deletes RSVPs whose event has ended. Expiration: fecha + hora_fin, else hora_inicio, else 23:59:59. Timezone: America/Mexico_City. Schedule via pg_cron (e.g. daily at 2:00).';

GRANT EXECUTE ON FUNCTION public.cleanup_expired_rsvps() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_rsvps() TO authenticated;

-- 6) Update recalc_user_rsvp_events to include both 'going' and 'interesado'
CREATE OR REPLACE FUNCTION public.recalc_user_rsvp_events(p_user_id uuid)
RETURNS void AS $$
DECLARE
  evs jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(to_jsonb(r.event_date_id)),'[]'::jsonb)
  INTO evs
  FROM public.event_rsvp r
  WHERE r.user_id = p_user_id AND r.status IN ('interesado', 'going');

  UPDATE public.profiles_user pu
  SET rsvp_events = evs
  WHERE pu.user_id = p_user_id;
END; $$ LANGUAGE plpgsql;

-- 7) pg_cron schedule (if extension is enabled)
-- Run daily at 3:00 AM Mexico City time
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-expired-rsvps',
      '0 9 * * *',  -- 9:00 UTC ≈ 3:00 AM Mexico City (simplified; DST may vary)
      $$SELECT public.cleanup_expired_rsvps()$$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available or schedule failed: %. Run cleanup_expired_rsvps() manually or via Supabase Edge Function.', SQLERRM;
END $$;
