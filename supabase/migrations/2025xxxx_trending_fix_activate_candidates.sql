-- ================================================
-- FIX: Mejorar activación de candidatos en rondas
-- ================================================
-- Asegura que todos los candidatos se activen correctamente
-- en la ronda actual cuando se llama a la función
-- ================================================

-- Eliminar función existente si existe
DROP FUNCTION IF EXISTS rpc_trending_activate_pending_candidates(BIGINT);

-- Mejorar función para activar candidatos pendientes
CREATE FUNCTION rpc_trending_activate_pending_candidates(
  p_trending_id BIGINT
)
RETURNS TABLE (
  activated_count BIGINT,
  total_candidates BIGINT,
  current_round INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_round INT;
  v_activated_count BIGINT := 0;
  v_total_candidates BIGINT := 0;
BEGIN
  IF NOT app_is_superadmin() THEN
    RAISE EXCEPTION 'Solo superadmin puede activar candidatos';
  END IF;

  -- Obtener la ronda actual del trending
  SELECT current_round_number INTO v_current_round
  FROM public.trendings
  WHERE id = p_trending_id;

  IF v_current_round IS NULL OR v_current_round = 0 THEN
    -- Si no hay ronda activa, retornar información
    SELECT COUNT(*) INTO v_total_candidates
    FROM public.trending_candidates
    WHERE trending_id = p_trending_id;
    
    RETURN QUERY SELECT 0::BIGINT as activated_count, v_total_candidates, NULL::INT as current_round;
    RETURN;
  END IF;

  -- Contar total de candidatos
  SELECT COUNT(*) INTO v_total_candidates
  FROM public.trending_candidates
  WHERE trending_id = p_trending_id;

  -- Activar SOLO candidatos "pendientes" para la ronda actual
  -- IMPORTANTE:
  --  - NO debemos mover candidatos que ya participaron en rondas anteriores
  --    ni reactivar perdedores.
  --  - Solo:
  --    1) Candidatos sin round_number (nuevos agregados después de iniciar la ronda)
  --    2) Candidatos que YA están en la ronda actual pero con is_active_in_round en FALSE/NULL
  UPDATE public.trending_candidates
  SET 
    round_number = COALESCE(round_number, v_current_round),
    is_active_in_round = TRUE
  WHERE trending_id = p_trending_id
    AND (
      -- Candidatos nuevos sin ronda asignada
      round_number IS NULL 
      OR round_number = 0
      -- Candidatos de la ronda actual desactivados por error
      OR (
        round_number = v_current_round
        AND (is_active_in_round = FALSE OR is_active_in_round IS NULL)
      )
    );

  GET DIAGNOSTICS v_activated_count = ROW_COUNT;

  RETURN QUERY SELECT v_activated_count, v_total_candidates, v_current_round;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_trending_activate_pending_candidates(BIGINT) TO authenticated;

COMMENT ON FUNCTION rpc_trending_activate_pending_candidates IS 'Activa todos los candidatos pendientes en la ronda actual del trending. Retorna el número de candidatos activados, el total de candidatos y la ronda actual.';

-- Mejorar función para agregar candidatos
CREATE OR REPLACE FUNCTION public.rpc_trending_add_candidate(
  p_trending_id BIGINT,
  p_ritmo_slug TEXT,
  p_user_id UUID,
  p_display_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_bio_short TEXT DEFAULT NULL,
  p_list_name TEXT DEFAULT NULL
) 
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_round INT;
  v_candidate_id BIGINT;
BEGIN
  IF NOT app_is_superadmin() THEN 
    RAISE EXCEPTION 'Solo superadmin puede agregar candidatos'; 
  END IF;
  
  -- Insertar o actualizar candidato
  INSERT INTO public.trending_candidates (
    trending_id, 
    ritmo_slug, 
    user_id, 
    display_name, 
    avatar_url, 
    bio_short, 
    list_name,
    round_number,
    is_active_in_round
  )
  VALUES (
    p_trending_id, 
    p_ritmo_slug, 
    p_user_id, 
    p_display_name, 
    p_avatar_url, 
    p_bio_short, 
    p_list_name,
    NULL, -- Se asignará después si hay ronda activa
    FALSE -- Se activará después si hay ronda activa
  )
  ON CONFLICT (trending_id, ritmo_slug, user_id) 
  DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, trending_candidates.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, trending_candidates.avatar_url),
    bio_short = COALESCE(EXCLUDED.bio_short, trending_candidates.bio_short),
    list_name = COALESCE(EXCLUDED.list_name, trending_candidates.list_name);
  
  -- Obtener el ID del candidato (ya sea nuevo o existente)
  SELECT id INTO v_candidate_id
  FROM public.trending_candidates
  WHERE trending_id = p_trending_id
    AND ritmo_slug = p_ritmo_slug
    AND user_id = p_user_id;
  
  -- Si el trending tiene una ronda activa, activar el candidato en esa ronda
  SELECT current_round_number INTO v_current_round
  FROM public.trendings
  WHERE id = p_trending_id;
  
  IF v_current_round IS NOT NULL AND v_current_round > 0 THEN
    -- Activar el candidato en la ronda actual
    UPDATE public.trending_candidates
    SET 
      round_number = v_current_round,
      is_active_in_round = TRUE
    WHERE id = v_candidate_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_trending_add_candidate(BIGINT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.rpc_trending_add_candidate IS 'Agrega o actualiza un candidato a un trending. Si el trending tiene una ronda activa, activa automáticamente el candidato en esa ronda.';

