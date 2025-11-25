-- ================================================
-- FUNCIÓN PARA ELIMINAR CANDIDATO DE TRENDING
-- ================================================

CREATE OR REPLACE FUNCTION rpc_trending_remove_candidate(
  p_trending_id BIGINT,
  p_candidate_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT app_is_superadmin() THEN
    RAISE EXCEPTION 'Solo superadmin puede eliminar candidatos';
  END IF;

  -- Verificar que el candidato pertenece al trending
  IF NOT EXISTS (
    SELECT 1 FROM public.trending_candidates
    WHERE id = p_candidate_id AND trending_id = p_trending_id
  ) THEN
    RAISE EXCEPTION 'Candidato no encontrado en este trending';
  END IF;

  -- Eliminar el candidato (CASCADE eliminará los votos)
  DELETE FROM public.trending_candidates
  WHERE id = p_candidate_id AND trending_id = p_trending_id;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_trending_remove_candidate(BIGINT, BIGINT) TO authenticated;

COMMENT ON FUNCTION rpc_trending_remove_candidate IS 'Elimina un candidato de un trending. Solo superadmin.';

