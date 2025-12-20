-- ================================================
-- SCRIPT: Aplicar funciones RPC de trending
-- ================================================
-- Ejecuta este script en el SQL Editor de Supabase
-- para crear las funciones necesarias
-- ================================================

-- ================================================
-- FUNCIÓN: Obtener resultados finales de una ronda
-- ================================================

DROP FUNCTION IF EXISTS rpc_trending_get_round_results(BIGINT, INT);
CREATE OR REPLACE FUNCTION rpc_trending_get_round_results(
  p_trending_id BIGINT,
  p_round_number INT
)
RETURNS TABLE (
  candidate_id BIGINT,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  bio_short TEXT,
  list_name TEXT,
  ritmo_slug TEXT,
  votes BIGINT,
  advanced BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id as candidate_id,
    c.user_id,
    COALESCE(c.display_name, 'Sin nombre') as display_name,
    c.avatar_url,
    c.bio_short,
    c.list_name,
    c.ritmo_slug,
    COUNT(v.voter_user_id) as votes,
    (c.round_number > p_round_number OR c.advanced_from_round = p_round_number) as advanced
  FROM public.trending_candidates c
  LEFT JOIN public.trending_votes v
    ON v.trending_id = c.trending_id
    AND v.candidate_id = c.id
    AND v.round_number = p_round_number
  WHERE c.trending_id = p_trending_id
    AND (
      (c.round_number = p_round_number) 
      OR (c.advanced_from_round = p_round_number)
    )
  GROUP BY c.id, c.user_id, c.display_name, c.avatar_url, c.bio_short, c.list_name, c.ritmo_slug, c.round_number, c.advanced_from_round
  ORDER BY c.list_name, votes DESC, c.id ASC;
$$;

GRANT EXECUTE ON FUNCTION rpc_trending_get_round_results(BIGINT, INT) TO anon, authenticated;

COMMENT ON FUNCTION rpc_trending_get_round_results IS 'Obtiene los resultados finales (votos) de una ronda cerrada, agrupados por lista y ordenados por número de votos.';

-- ================================================
-- FUNCIÓN: Obtener ganadores finales del trending
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
  final_position INT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_final_round INT;
BEGIN
  SELECT MAX(round_number) INTO v_final_round
  FROM public.trending_rounds
  WHERE trending_id = p_trending_id
    AND status IN ('closed', 'completed');
  
  IF v_final_round IS NULL THEN
    RETURN;
  END IF;
  
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
      ) as final_position
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
    rc.final_position::INT
  FROM ranked_candidates rc
  ORDER BY rc.list_name, rc.final_position ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_trending_get_final_winners(BIGINT) TO anon, authenticated;

COMMENT ON FUNCTION rpc_trending_get_final_winners IS 'Obtiene los ganadores finales del trending ordenados por posición agrupados por lista.';

