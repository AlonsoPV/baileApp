-- =====================================================
-- SCRIPT 15: RPC merge_profiles_user
-- =====================================================
-- Función para actualizar perfiles de usuario de forma segura
-- Solo actualiza los campos proporcionados, sin sobrescribir el resto
-- =====================================================

-- 1) Eliminar función si existe (para recrearla)
DROP FUNCTION IF EXISTS public.merge_profiles_user(UUID, JSONB);

-- 2) Crear función RPC merge_profiles_user (versión robusta)
CREATE OR REPLACE FUNCTION public.merge_profiles_user(
  p_user_id UUID,
  p_patch JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name TEXT;
  v_bio          TEXT;
  v_avatar_url   TEXT;
  v_ritmos       INT[];
  v_zonas        INT[];
  v_respuestas   JSONB;
  v_media        JSONB;
  v_redes_sociales JSONB;
BEGIN
  -- Strings: si vienen en patch, se usan; si no, se conservan los actuales
  v_display_name := COALESCE(p_patch->>'display_name', (SELECT display_name FROM profiles_user WHERE user_id = p_user_id));
  v_bio          := COALESCE(p_patch->>'bio',          (SELECT bio          FROM profiles_user WHERE user_id = p_user_id));
  v_avatar_url   := COALESCE(p_patch->>'avatar_url',   (SELECT avatar_url   FROM profiles_user WHERE user_id = p_user_id));

  -- Arrays INT[]: si vienen como array JSON, se convierten; si no, se conservan
  IF p_patch ? 'ritmos' THEN
    SELECT COALESCE(ARRAY_AGG((x)::INT), '{}')
    INTO v_ritmos
    FROM jsonb_array_elements_text(p_patch->'ritmos') AS x;
  ELSE
    v_ritmos := (SELECT ritmos FROM profiles_user WHERE user_id = p_user_id);
  END IF;

  IF p_patch ? 'zonas' THEN
    SELECT COALESCE(ARRAY_AGG((x)::INT), '{}')
    INTO v_zonas
    FROM jsonb_array_elements_text(p_patch->'zonas') AS x;
  ELSE
    v_zonas := (SELECT zonas FROM profiles_user WHERE user_id = p_user_id);
  END IF;

  -- JSONB: si viene, se usa; si no, se conserva
  v_respuestas     := COALESCE(p_patch->'respuestas',     (SELECT respuestas     FROM profiles_user WHERE user_id = p_user_id));
  v_media          := COALESCE(p_patch->'media',          (SELECT media          FROM profiles_user WHERE user_id = p_user_id));
  v_redes_sociales := COALESCE(p_patch->'redes_sociales', (SELECT redes_sociales FROM profiles_user WHERE user_id = p_user_id));

  -- Actualizar el perfil
  UPDATE profiles_user
  SET 
    display_name   = v_display_name,
    bio            = v_bio,
    avatar_url     = v_avatar_url,
    ritmos         = v_ritmos,
    zonas          = v_zonas,
    respuestas     = v_respuestas,
    media          = v_media,
    redes_sociales = v_redes_sociales,
    updated_at     = NOW()
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
-- 5) TRIGGER: Proteger media de ser null accidentalmente
-- =====================================================

-- Crear función del trigger
CREATE OR REPLACE FUNCTION public.keep_media_on_null()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si el nuevo valor de media es null, mantener el antiguo
  IF NEW.media IS NULL THEN
    NEW.media := OLD.media;
  END IF;
  RETURN NEW;
END;
$$;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trg_profiles_user_keep_media ON public.profiles_user;

-- Crear trigger
CREATE TRIGGER trg_profiles_user_keep_media
  BEFORE UPDATE ON public.profiles_user
  FOR EACH ROW
  EXECUTE FUNCTION public.keep_media_on_null();

COMMENT ON FUNCTION public.keep_media_on_null() IS 
'Trigger function que previene que el campo media sea establecido a null accidentalmente durante updates.';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

