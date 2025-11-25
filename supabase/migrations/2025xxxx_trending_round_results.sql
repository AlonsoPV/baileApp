-- ================================================
-- FUNCIÓN: Obtener resultados finales de una ronda
-- ================================================
-- Retorna los resultados finales (votos) de una ronda cerrada
-- Agrupados por lista y ordenados por número de votos
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
  advanced BOOLEAN -- Indica si avanzó a la siguiente ronda
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
    -- Verificar si el candidato avanzó a la siguiente ronda
    (c.round_number > p_round_number OR c.advanced_from_round = p_round_number) as advanced
  FROM public.trending_candidates c
  LEFT JOIN public.trending_votes v
    ON v.trending_id = c.trending_id
    AND v.candidate_id = c.id
    AND v.round_number = p_round_number
  WHERE c.trending_id = p_trending_id
    -- Incluir candidatos que participaron en esta ronda:
    -- 1. Candidatos que aún están en esta ronda (round_number = p_round_number) - activos o inactivos
    -- 2. Candidatos que avanzaron desde esta ronda (advanced_from_round = p_round_number)
    AND (
      (c.round_number = p_round_number) 
      OR (c.advanced_from_round = p_round_number)
    )
  GROUP BY c.id, c.user_id, c.display_name, c.avatar_url, c.bio_short, c.list_name, c.ritmo_slug, c.round_number, c.advanced_from_round
  ORDER BY c.list_name, votes DESC, c.id ASC;
$$;

GRANT EXECUTE ON FUNCTION rpc_trending_get_round_results(BIGINT, INT) TO anon, authenticated;

COMMENT ON FUNCTION rpc_trending_get_round_results IS 'Obtiene los resultados finales (votos) de una ronda cerrada, agrupados por lista y ordenados por número de votos. Incluye información sobre si el candidato avanzó a la siguiente ronda.';

