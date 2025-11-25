-- ================================================
-- FIX: Asegurar que candidatos se activen en ronda 1
-- ================================================
-- Este script corrige candidatos que no fueron activados
-- cuando se inició la primera ronda
-- ================================================

-- Función para activar candidatos pendientes en la ronda actual
CREATE OR REPLACE FUNCTION rpc_trending_activate_pending_candidates(
  p_trending_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_round INT;
BEGIN
  -- Obtener la ronda actual del trending
  SELECT current_round_number INTO v_current_round
  FROM public.trendings
  WHERE id = p_trending_id;

  IF v_current_round IS NULL OR v_current_round = 0 THEN
    RAISE EXCEPTION 'Trending no tiene ronda activa';
  END IF;

  -- Activar todos los candidatos que no tienen round_number o is_active_in_round = FALSE
  -- y asignarlos a la ronda actual
  UPDATE public.trending_candidates
  SET 
    round_number = v_current_round,
    is_active_in_round = TRUE
  WHERE trending_id = p_trending_id
    AND (round_number IS NULL OR round_number = 0 OR round_number != v_current_round OR is_active_in_round = FALSE);

  RAISE NOTICE 'Candidatos activados para ronda %', v_current_round;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_trending_activate_pending_candidates(BIGINT) TO authenticated;

-- Mejorar la función de inicio de primera ronda para asegurar que todos los candidatos se activen
CREATE OR REPLACE FUNCTION rpc_trending_start_first_round(
  p_trending_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rounds_config JSONB;
  v_first_round JSONB;
  v_starts_at TIMESTAMPTZ;
  v_ends_at TIMESTAMPTZ;
  v_duration_type TEXT;
  v_duration_value INT;
  v_candidate_count INT;
BEGIN
  IF NOT app_is_superadmin() THEN
    RAISE EXCEPTION 'Solo superadmin puede iniciar rondas';
  END IF;

  -- Obtener configuración de rondas
  SELECT rounds_config INTO v_rounds_config
  FROM public.trendings
  WHERE id = p_trending_id;

  IF v_rounds_config IS NULL THEN
    RAISE EXCEPTION 'Trending no tiene configuración de rondas';
  END IF;

  -- Obtener primera ronda
  v_first_round := v_rounds_config->'rounds'->0;
  
  IF v_first_round IS NULL THEN
    RAISE EXCEPTION 'No hay rondas configuradas';
  END IF;

  v_duration_type := v_first_round->>'duration_type';
  v_duration_value := (v_first_round->>'duration_value')::INT;
  v_starts_at := NOW();

  -- Calcular fecha de fin según tipo de duración
  IF v_duration_type = 'days' THEN
    v_ends_at := v_starts_at + (v_duration_value || ' days')::INTERVAL;
  ELSIF v_duration_type = 'hours' THEN
    v_ends_at := v_starts_at + (v_duration_value || ' hours')::INTERVAL;
  ELSE
    v_ends_at := NULL; -- unlimited
  END IF;

  -- Crear registro de ronda
  INSERT INTO public.trending_rounds (
    trending_id,
    round_number,
    advances_per_list,
    duration_type,
    duration_value,
    starts_at,
    ends_at,
    status
  )
  VALUES (
    p_trending_id,
    1,
    (v_first_round->>'advances_per_list')::INT,
    v_duration_type,
    v_duration_value,
    v_starts_at,
    v_ends_at,
    'active'
  )
  ON CONFLICT (trending_id, round_number) DO UPDATE
  SET 
    advances_per_list = EXCLUDED.advances_per_list,
    duration_type = EXCLUDED.duration_type,
    duration_value = EXCLUDED.duration_value,
    starts_at = EXCLUDED.starts_at,
    ends_at = EXCLUDED.ends_at,
    status = 'active';

  -- Actualizar trending
  UPDATE public.trendings
  SET current_round_number = 1
  WHERE id = p_trending_id;

  -- Activar TODOS los candidatos en la ronda 1
  -- Esto incluye candidatos que ya existían y los que se agreguen después
  UPDATE public.trending_candidates
  SET 
    round_number = 1,
    is_active_in_round = TRUE
  WHERE trending_id = p_trending_id;

  -- Contar candidatos activados
  GET DIAGNOSTICS v_candidate_count = ROW_COUNT;
  RAISE NOTICE 'Candidatos activados en ronda 1: %', v_candidate_count;
END;
$$;

-- Comentario
COMMENT ON FUNCTION rpc_trending_activate_pending_candidates IS 'Activa candidatos pendientes en la ronda actual del trending';

