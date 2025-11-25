-- ================================================
-- FUNCIÓN: Obtener ganadores finales del trending
-- ================================================
-- Retorna los ganadores finales ordenados por posición
-- Solo se usa cuando el trending está cerrado (ronda final completada)
-- ================================================

DROP FUNCTION IF EXISTS rpc_trending_get_final_winners(BIGINT);
CREATE OR REPLACE FUNCTION rpc_trending_get_final_winners(
  p_trending_id BIGINT
)
RETURNS TABLE (
  candidate_id BIGINT,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  bio_short TEXT,
  list_name TEXT,
  ritmo_slug TEXT,
  final_round_number INT,
  final_votes BIGINT,
  position INT -- Posición final (1° lugar, 2° lugar, etc.)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_final_round INT;
  v_list_name TEXT;
  v_position INT;
BEGIN
  -- Obtener la ronda final del trending
  SELECT MAX(round_number) INTO v_final_round
  FROM public.trending_rounds
  WHERE trending_id = p_trending_id
    AND status IN ('closed', 'completed');
  
  IF v_final_round IS NULL THEN
    -- Si no hay rondas cerradas, retornar vacío
    RETURN;
  END IF;
  
  -- Retornar ganadores agrupados por lista y ordenados por votos
  -- Solo incluir candidatos que participaron en la ronda final
  RETURN QUERY
  WITH ranked_candidates AS (
    SELECT 
      c.id as candidate_id,
      c.user_id,
      COALESCE(c.display_name, 'Sin nombre') as display_name,
      c.avatar_url,
      c.bio_short,
      c.list_name,
      c.ritmo_slug,
      v_final_round as final_round_number,
      COUNT(v.voter_user_id) as final_votes,
      ROW_NUMBER() OVER (
        PARTITION BY c.list_name 
        ORDER BY COUNT(v.voter_user_id) DESC, c.id ASC
      ) as position
    FROM public.trending_candidates c
    LEFT JOIN public.trending_votes v
      ON v.trending_id = c.trending_id
      AND v.candidate_id = c.id
      AND v.round_number = v_final_round
    WHERE c.trending_id = p_trending_id
      AND (
        c.round_number = v_final_round 
        OR c.advanced_from_round = v_final_round
      )
    GROUP BY c.id, c.user_id, c.display_name, c.avatar_url, c.bio_short, c.list_name, c.ritmo_slug
  )
  SELECT 
    rc.candidate_id,
    rc.user_id,
    rc.display_name,
    rc.avatar_url,
    rc.bio_short,
    rc.list_name,
    rc.ritmo_slug,
    rc.final_round_number,
    rc.final_votes,
    rc.position::INT
  FROM ranked_candidates rc
  ORDER BY rc.list_name, rc.position ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_trending_get_final_winners(BIGINT) TO anon, authenticated;

COMMENT ON FUNCTION rpc_trending_get_final_winners IS 'Obtiene los ganadores finales del trending ordenados por posición (1° lugar, 2° lugar, etc.) agrupados por lista. Solo funciona cuando el trending está cerrado.';

