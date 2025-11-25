-- ================================================
-- FUNCIÓN PARA ELIMINAR TRENDING
-- ================================================
-- Permite al dueño (created_by) o superadmin eliminar un trending
-- ================================================

CREATE OR REPLACE FUNCTION rpc_trending_delete(p_trending_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created_by UUID;
  v_current_user UUID;
BEGIN
  -- Obtener el usuario actual
  v_current_user := auth.uid();
  
  IF v_current_user IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para eliminar un trending';
  END IF;

  -- Obtener el creador del trending
  SELECT created_by INTO v_created_by
  FROM public.trendings
  WHERE id = p_trending_id;

  IF v_created_by IS NULL THEN
    RAISE EXCEPTION 'Trending no existe';
  END IF;

  -- Verificar permisos: debe ser el dueño o superadmin
  IF v_created_by != v_current_user AND NOT app_is_superadmin() THEN
    RAISE EXCEPTION 'Solo el dueño del trending o un superadmin puede eliminarlo';
  END IF;

  -- Eliminar el trending (CASCADE eliminará automáticamente:
  -- - trending_ritmos
  -- - trending_candidates
  -- - trending_votes
  -- - trending_rounds)
  DELETE FROM public.trendings
  WHERE id = p_trending_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se pudo eliminar el trending';
  END IF;
END;
$$;

-- Grant
GRANT EXECUTE ON FUNCTION rpc_trending_delete(BIGINT) TO authenticated;

-- Comentario
COMMENT ON FUNCTION rpc_trending_delete IS 'Elimina un trending. Solo el dueño (created_by) o superadmin pueden eliminarlo.';

