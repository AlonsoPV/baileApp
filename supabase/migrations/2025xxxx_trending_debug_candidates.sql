-- ================================================
-- FUNCIÓN DE DIAGNÓSTICO PARA CANDIDATOS
-- ================================================
-- Ayuda a diagnosticar por qué no se ven los candidatos
-- ================================================

CREATE OR REPLACE FUNCTION rpc_trending_debug_candidates(
  p_trending_id BIGINT
)
RETURNS TABLE (
  candidate_id BIGINT,
  user_id UUID,
  display_name TEXT,
  list_name TEXT,
  round_number INT,
  is_active_in_round BOOLEAN,
  ritmo_slug TEXT
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
    c.list_name,
    c.round_number,
    c.is_active_in_round,
    c.ritmo_slug
  FROM public.trending_candidates c
  WHERE c.trending_id = p_trending_id
  ORDER BY c.list_name, c.round_number, c.id;
$$;

GRANT EXECUTE ON FUNCTION rpc_trending_debug_candidates(BIGINT) TO authenticated;

-- Mejorar función get_round_candidates para ser más flexible
CREATE OR REPLACE FUNCTION rpc_trending_get_round_candidates(
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
  votes BIGINT
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
    COUNT(v.voter_user_id) as votes
  FROM public.trending_candidates c
  LEFT JOIN public.trending_votes v
    ON v.trending_id = c.trending_id
    AND v.candidate_id = c.id
    AND v.round_number = p_round_number
  WHERE c.trending_id = p_trending_id
    -- Si round_number es NULL o 0, también incluirlo (candidatos sin ronda asignada)
    AND (c.round_number = p_round_number OR c.round_number IS NULL OR c.round_number = 0)
    -- Si is_active_in_round es NULL, también incluirlo
    AND (c.is_active_in_round = TRUE OR c.is_active_in_round IS NULL)
  GROUP BY c.id, c.user_id, c.display_name, c.avatar_url, c.bio_short, c.list_name, c.ritmo_slug
  ORDER BY c.list_name, votes DESC, c.id ASC;
$$;

COMMENT ON FUNCTION rpc_trending_debug_candidates IS 'Función de diagnóstico para ver el estado de todos los candidatos de un trending';

