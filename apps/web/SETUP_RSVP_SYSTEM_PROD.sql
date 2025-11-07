-- ============================================================================
-- SISTEMA RSVP COMPLETO PARA PRODUCCIÓN
-- ============================================================================
-- Sistema de RSVP con tabla, RLS, RPCs, triggers y contadores sincronizados
-- Idempotente y seguro para ejecutar múltiples veces
-- ============================================================================

BEGIN;

-- 0) Helpers
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 1) Tabla base event_rsvp
CREATE TABLE IF NOT EXISTS public.event_rsvp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date_id bigint NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('interesado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_date_id, user_id),
  CONSTRAINT fk_rsvp_event_date
    FOREIGN KEY (event_date_id)
    REFERENCES public.events_date(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_rsvp_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_event_rsvp_event_date ON public.event_rsvp(event_date_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvp_user ON public.event_rsvp(user_id);

-- 2) RLS
ALTER TABLE public.event_rsvp ENABLE ROW LEVEL SECURITY;

-- Drop políticas existentes
DROP POLICY IF EXISTS rsvp_select_own ON public.event_rsvp;
DROP POLICY IF EXISTS rsvp_insert_own ON public.event_rsvp;
DROP POLICY IF EXISTS rsvp_update_own ON public.event_rsvp;
DROP POLICY IF EXISTS rsvp_delete_own ON public.event_rsvp;

-- Recrear políticas
CREATE POLICY rsvp_select_own ON public.event_rsvp
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY rsvp_insert_own ON public.event_rsvp
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY rsvp_update_own ON public.event_rsvp
  FOR UPDATE USING (user_id = auth.uid())
           WITH CHECK (user_id = auth.uid());

CREATE POLICY rsvp_delete_own ON public.event_rsvp
  FOR DELETE USING (user_id = auth.uid());

-- 3) Agregar columnas de contadores (si no existen)
ALTER TABLE public.events_date
  ADD COLUMN IF NOT EXISTS rsvp_interesado_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.profiles_user
  ADD COLUMN IF NOT EXISTS rsvp_events jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 4) Funciones de trigger para mantener contadores sincronizados
CREATE OR REPLACE FUNCTION public.recalc_event_rsvp_counts(p_event_date_id bigint)
RETURNS void AS $$
BEGIN
  UPDATE public.events_date ed
  SET rsvp_interesado_count = COALESCE((
    SELECT COUNT(*) FROM public.event_rsvp r
    WHERE r.event_date_id = p_event_date_id AND r.status = 'interesado'
  ), 0)
  WHERE ed.id = p_event_date_id;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.recalc_user_rsvp_events(p_user_id uuid)
RETURNS void AS $$
DECLARE
  evs jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(to_jsonb(r.event_date_id)),'[]'::jsonb)
  INTO evs
  FROM public.event_rsvp r
  WHERE r.user_id = p_user_id AND r.status = 'interesado';

  UPDATE public.profiles_user pu
  SET rsvp_events = evs
  WHERE pu.user_id = p_user_id;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trg_after_event_rsvp()
RETURNS trigger AS $$
DECLARE
  v_event_date_id bigint;
  v_user_id uuid;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_event_date_id := NEW.event_date_id;
    v_user_id := NEW.user_id;
  ELSE
    v_event_date_id := OLD.event_date_id;
    v_user_id := OLD.user_id;
  END IF;

  PERFORM public.recalc_event_rsvp_counts(v_event_date_id);
  PERFORM public.recalc_user_rsvp_events(v_user_id);
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_event_rsvp_sync ON public.event_rsvp;
CREATE TRIGGER trg_event_rsvp_sync
AFTER INSERT OR UPDATE OR DELETE ON public.event_rsvp
FOR EACH ROW EXECUTE FUNCTION public.trg_after_event_rsvp();

-- 5) RPC: get_user_rsvp_status
DROP FUNCTION IF EXISTS public.get_user_rsvp_status(bigint);
CREATE OR REPLACE FUNCTION public.get_user_rsvp_status(event_id bigint)
RETURNS text AS $$
DECLARE
  v_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT r.status INTO v_status
  FROM public.event_rsvp r
  WHERE r.event_date_id = event_id AND r.user_id = auth.uid()
  LIMIT 1;
  RETURN v_status;
END; $$ LANGUAGE plpgsql STABLE;

-- 6) RPC: get_event_rsvp_stats
DROP FUNCTION IF EXISTS public.get_event_rsvp_stats(bigint);
CREATE OR REPLACE FUNCTION public.get_event_rsvp_stats(event_id bigint)
RETURNS TABLE (interesado integer, total integer) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE status = 'interesado'), 0)::int AS interesado,
    COALESCE(COUNT(*), 0)::int AS total
  FROM public.event_rsvp r
  WHERE r.event_date_id = event_id;
END; $$ LANGUAGE plpgsql STABLE;

-- 7) RPC: upsert_event_rsvp
DROP FUNCTION IF EXISTS public.upsert_event_rsvp(bigint, text);
CREATE OR REPLACE FUNCTION public.upsert_event_rsvp(p_event_date_id bigint, p_status text)
RETURNS jsonb AS $$
DECLARE
  v_stats record;
  v_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;
  IF p_status NOT IN ('interesado') THEN
    RAISE EXCEPTION 'invalid_status';
  END IF;

  INSERT INTO public.event_rsvp (event_date_id, user_id, status)
  VALUES (p_event_date_id, auth.uid(), p_status)
  ON CONFLICT (event_date_id, user_id)
  DO UPDATE SET status = EXCLUDED.status, created_at = now();

  SELECT * INTO v_stats FROM public.get_event_rsvp_stats(p_event_date_id);
  SELECT public.get_user_rsvp_status(p_event_date_id) INTO v_status;

  RETURN jsonb_build_object(
    'success', true,
    'user_status', v_status,
    'stats', jsonb_build_object('interesado', v_stats.interesado, 'total', v_stats.total)
  );
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8) RPC: delete_event_rsvp
DROP FUNCTION IF EXISTS public.delete_event_rsvp(bigint);
CREATE OR REPLACE FUNCTION public.delete_event_rsvp(p_event_date_id bigint)
RETURNS jsonb AS $$
DECLARE
  v_stats record;
  v_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;

  DELETE FROM public.event_rsvp r
  WHERE r.event_date_id = p_event_date_id AND r.user_id = auth.uid();

  SELECT * INTO v_stats FROM public.get_event_rsvp_stats(p_event_date_id);
  SELECT public.get_user_rsvp_status(p_event_date_id) INTO v_status;

  RETURN jsonb_build_object(
    'success', true,
    'user_status', v_status,
    'stats', jsonb_build_object('interesado', v_stats.interesado, 'total', v_stats.total)
  );
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9) Grants
GRANT ALL ON TABLE public.event_rsvp TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_rsvp_status(bigint) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_event_rsvp_stats(bigint) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.upsert_event_rsvp(bigint, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_event_rsvp(bigint) TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver estructura de event_rsvp
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'event_rsvp'
ORDER BY ordinal_position;

-- Ver funciones RPC
SELECT proname, proargnames
FROM pg_proc
WHERE proname LIKE '%rsvp%'
ORDER BY proname;

-- Ver triggers
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE '%rsvp%';

-- Ver políticas RLS
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'event_rsvp'
ORDER BY policyname;

-- Contar RSVPs existentes
SELECT COUNT(*) as total_rsvps FROM public.event_rsvp;

