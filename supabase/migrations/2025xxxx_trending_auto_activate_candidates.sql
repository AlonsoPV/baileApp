-- ================================================
-- FIX: Activar automáticamente candidatos cuando se agregan
-- ================================================
-- Cuando se agrega un candidato a un trending con ronda activa,
-- debe activarse automáticamente en esa ronda
-- ================================================

-- Actualizar función para agregar candidatos y activarlos automáticamente
DROP FUNCTION IF EXISTS public.rpc_trending_add_candidate(bigint, text, uuid, text, text, text, text);
CREATE OR REPLACE FUNCTION public.rpc_trending_add_candidate(
  p_trending_id bigint,
  p_ritmo_slug text,
  p_user_id uuid,
  p_display_name text default null,
  p_avatar_url text default null,
  p_bio_short text default null,
  p_list_name text default null
) 
RETURNS void 
LANGUAGE plpgsql 
AS $$
DECLARE
  v_current_round INT;
BEGIN
  IF NOT app_is_superadmin() THEN 
    RAISE EXCEPTION 'Solo superadmin'; 
  END IF;
  
  -- Insertar candidato
  INSERT INTO public.trending_candidates (
    trending_id, 
    ritmo_slug, 
    user_id, 
    display_name, 
    avatar_url, 
    bio_short, 
    list_name
  )
  VALUES (
    p_trending_id, 
    p_ritmo_slug, 
    p_user_id, 
    p_display_name, 
    p_avatar_url, 
    p_bio_short, 
    p_list_name
  )
  ON CONFLICT (trending_id, ritmo_slug, user_id) DO NOTHING;
  
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
    WHERE trending_id = p_trending_id
      AND ritmo_slug = p_ritmo_slug
      AND user_id = p_user_id
      AND (round_number IS NULL OR round_number != v_current_round OR is_active_in_round = FALSE);
  END IF;
END;
$$;

COMMENT ON FUNCTION public.rpc_trending_add_candidate IS 'Agrega un candidato a un trending. Si el trending tiene una ronda activa, activa automáticamente el candidato en esa ronda.';

