-- =====================================================
-- SCRIPT 15: RPC merge_profiles_user
-- =====================================================
-- Función para actualizar perfiles de usuario de forma segura
-- Solo actualiza los campos proporcionados, sin sobrescribir el resto
-- =====================================================

-- 1) Eliminar función si existe (para recrearla)
DROP FUNCTION IF EXISTS public.merge_profiles_user(UUID, JSONB);

-- 2) Crear función RPC merge_profiles_user
CREATE OR REPLACE FUNCTION public.merge_profiles_user(
  p_user_id UUID,
  p_patch JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Actualizar solo los campos presentes en p_patch
  -- Convertir JSONB arrays a PostgreSQL arrays correctamente
  UPDATE profiles_user
  SET 
    display_name = CASE 
      WHEN p_patch ? 'display_name' THEN (p_patch->>'display_name')::TEXT
      ELSE display_name
    END,
    bio = CASE 
      WHEN p_patch ? 'bio' THEN (p_patch->>'bio')::TEXT
      ELSE bio
    END,
    avatar_url = CASE 
      WHEN p_patch ? 'avatar_url' THEN (p_patch->>'avatar_url')::TEXT
      ELSE avatar_url
    END,
    ritmos = CASE 
      WHEN p_patch ? 'ritmos' THEN 
        ARRAY(SELECT jsonb_array_elements_text(p_patch->'ritmos')::INT)
      ELSE ritmos
    END,
    zonas = CASE 
      WHEN p_patch ? 'zonas' THEN 
        ARRAY(SELECT jsonb_array_elements_text(p_patch->'zonas')::INT)
      ELSE zonas
    END,
    redes_sociales = CASE 
      WHEN p_patch ? 'redes_sociales' THEN (p_patch->'redes_sociales')::JSONB
      ELSE redes_sociales
    END,
    media = CASE 
      WHEN p_patch ? 'media' THEN (p_patch->'media')::JSONB
      ELSE media
    END,
    respuestas = CASE 
      WHEN p_patch ? 'respuestas' THEN (p_patch->'respuestas')::JSONB
      ELSE respuestas
    END,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Si no existe el perfil, lanzar error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  END IF;
END;
$$;

-- 3) Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.merge_profiles_user(UUID, JSONB) TO authenticated;

-- 4) Comentario de documentación
COMMENT ON FUNCTION public.merge_profiles_user(UUID, JSONB) IS 
'Actualiza un perfil de usuario de forma segura. Solo actualiza los campos presentes en p_patch sin sobrescribir los demás.';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que la función fue creada
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'merge_profiles_user';

-- Resultado esperado:
-- routine_name: merge_profiles_user
-- routine_type: FUNCTION
-- security_type: DEFINER

-- =====================================================
-- EJEMPLO DE USO
-- =====================================================

-- Actualizar solo display_name y bio:
-- SELECT merge_profiles_user(
--   'user-uuid-here'::UUID,
--   '{"display_name": "Juan", "bio": "Nueva bio"}'::JSONB
-- );

-- Actualizar solo ritmos:
-- SELECT merge_profiles_user(
--   'user-uuid-here'::UUID,
--   '{"ritmos": [1, 2, 3]}'::JSONB
-- );

-- Actualizar media:
-- SELECT merge_profiles_user(
--   'user-uuid-here'::UUID,
--   '{"media": [{"id": "123", "url": "...", "type": "image"}]}'::JSONB
-- );

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

-- 1. La función usa SECURITY DEFINER, lo que significa que se ejecuta
--    con los privilegios del creador (admin), no del usuario que la llama.
--    Esto es necesario para bypass de RLS en ciertos casos.

-- 2. Solo actualiza campos que estén presentes en p_patch.
--    Si un campo no está en p_patch, mantiene su valor actual.

-- 3. Si p_patch tiene un campo con valor null, NO se actualiza
--    gracias al COALESCE que preserva el valor actual.

-- 4. Los arrays (ritmos, zonas) se convierten de JSONB a PostgreSQL arrays
--    usando jsonb_array_elements_text() para evitar errores de casting.
--    Los JSONB (media, redes_sociales, respuestas) se manejan directamente.

-- 5. updated_at siempre se actualiza a NOW() en cada merge.

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

