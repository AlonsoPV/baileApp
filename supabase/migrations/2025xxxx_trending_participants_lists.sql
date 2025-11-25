-- ================================================
-- COLUMNA PARA GUARDAR PARTICIPANTES Y LISTAS
-- ================================================
-- Agrega una columna JSONB para guardar los nombres,
-- IDs de participantes y en qué lista están
-- ================================================

-- Agregar columna participants_lists a la tabla trendings
ALTER TABLE IF EXISTS public.trendings
  ADD COLUMN IF NOT EXISTS participants_lists JSONB DEFAULT '{"lists":[]}'::jsonb;

COMMENT ON COLUMN public.trendings.participants_lists IS 'Almacena los participantes y sus listas: {"lists": [{"name": "Lista1", "participants": [{"id": "uuid", "name": "Nombre", "avatar": "url"}]}]}';

-- Función RPC para actualizar participants_lists
CREATE OR REPLACE FUNCTION rpc_trending_set_participants_lists(
  p_trending_id BIGINT,
  p_participants_lists JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT app_is_superadmin() THEN
    RAISE EXCEPTION 'Solo superadmin puede actualizar participants_lists';
  END IF;

  UPDATE public.trendings
  SET participants_lists = p_participants_lists
  WHERE id = p_trending_id;
END;
$$;

GRANT EXECUTE ON FUNCTION rpc_trending_set_participants_lists(BIGINT, JSONB) TO authenticated;

COMMENT ON FUNCTION rpc_trending_set_participants_lists IS 'Actualiza la información de participantes y listas de un trending';

