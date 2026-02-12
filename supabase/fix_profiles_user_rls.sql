-- ========================================
-- 🔧 FIX: RLS y RPC para profiles_user
-- ========================================

-- 1. Crear/actualizar políticas RLS para profiles_user
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles_user;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles_user;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles_user;

-- SELECT: Cualquiera puede ver cualquier perfil (perfiles públicos: avatar, bio, etc.)
-- El dueño sigue pudiendo ver el suyo; además, otros usuarios pueden cargar el perfil público para ver avatar_url, display_name, etc.
CREATE POLICY "Users can view own profile"
ON public.profiles_user FOR SELECT
USING (true);

-- INSERT: Usuario puede crear su propio perfil
CREATE POLICY "Users can insert own profile"
ON public.profiles_user FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE: Usuario puede actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles_user FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2.1. Crear función helper para merge profundo de JSONB
-- Drop función existente si tiene firma diferente
DROP FUNCTION IF EXISTS public.jsonb_deep_merge(jsonb, jsonb);
DROP FUNCTION IF EXISTS public.jsonb_deep_merge(a jsonb, b jsonb);

CREATE OR REPLACE FUNCTION public.jsonb_deep_merge(target jsonb, source jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result jsonb;
  key text;
  target_value jsonb;
  source_value jsonb;
BEGIN
  result := target;
  
  IF source IS NULL THEN
    RETURN result;
  END IF;
  
  FOR key IN SELECT * FROM jsonb_object_keys(source) LOOP
    target_value := result->key;
    source_value := source->key;
    
    -- Si ambos son objetos JSONB, hacer merge recursivo
    IF jsonb_typeof(target_value) = 'object' AND jsonb_typeof(source_value) = 'object' THEN
      result := jsonb_set(result, ARRAY[key], jsonb_deep_merge(target_value, source_value));
    ELSE
      -- Si no, reemplazar con el valor de source
      result := jsonb_set(result, ARRAY[key], source_value);
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$;

-- 2.2. Crear función merge_profiles_user (para upserts)
DROP FUNCTION IF EXISTS public.merge_profiles_user(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.merge_profiles_user(
  p_user_id uuid,
  p_patch jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rol_baile text;
BEGIN
  -- Verificar que el usuario autenticado es el owner
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'No tienes permisos para modificar este perfil';
  END IF;

  -- Hacer upsert con merge profundo de JSONB
  INSERT INTO public.profiles_user (
    user_id,
    email,
    display_name,
    bio,
    avatar_url,
    rol_baile,
    ritmos,
    ritmos_seleccionados,
    zonas,
    onboarding_complete,
    media,
    redes_sociales,
    respuestas,
    rsvp_events
  )
  VALUES (
    p_user_id,
    COALESCE((p_patch->>'email')::text, auth.email()),
    -- Evitar borrar nombre/bio/avatar: vacío o ausente → NULL → COALESCE conserva el valor existente
    NULLIF(TRIM((p_patch->>'display_name')::text), ''),
    NULLIF(TRIM((p_patch->>'bio')::text), ''),
    NULLIF(TRIM((p_patch->>'avatar_url')::text), ''),
    CASE 
      WHEN p_patch ? 'rol_baile' THEN NULLIF((p_patch->>'rol_baile')::text, '')
      ELSE NULL
    END,
    CASE 
      WHEN p_patch ? 'ritmos' THEN 
        (SELECT ARRAY(SELECT jsonb_array_elements_text(p_patch->'ritmos'))::integer[])
      ELSE NULL 
    END,
    CASE 
      WHEN p_patch ? 'ritmos_seleccionados' THEN 
        (SELECT ARRAY(SELECT jsonb_array_elements_text(p_patch->'ritmos_seleccionados')))
      ELSE NULL 
    END,
    CASE 
      WHEN p_patch ? 'zonas' THEN 
        (SELECT ARRAY(SELECT jsonb_array_elements_text(p_patch->'zonas'))::integer[])
      ELSE NULL 
    END,
    -- Nuevos usuarios: false si no se envía. En UPDATE se respeta existente si la clave no viene en el patch (ver SET más abajo).
    COALESCE((p_patch->>'onboarding_complete')::boolean, false),
    COALESCE(p_patch->'media', '[]'::jsonb),
    COALESCE(p_patch->'redes_sociales', '{}'::jsonb),
    COALESCE(p_patch->'respuestas', '{}'::jsonb),
    COALESCE(p_patch->'rsvp_events', '[]'::jsonb)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles_user.email),
    display_name = COALESCE(EXCLUDED.display_name, profiles_user.display_name),
    bio = COALESCE(EXCLUDED.bio, profiles_user.bio),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles_user.avatar_url),
    rol_baile = CASE 
      WHEN EXCLUDED.rol_baile IS NOT NULL THEN EXCLUDED.rol_baile
      ELSE profiles_user.rol_baile
    END,
    ritmos = COALESCE(EXCLUDED.ritmos, profiles_user.ritmos),
    ritmos_seleccionados = COALESCE(EXCLUDED.ritmos_seleccionados, profiles_user.ritmos_seleccionados),
    zonas = COALESCE(EXCLUDED.zonas, profiles_user.zonas),
    -- Solo actualizar onboarding_complete si viene en el patch; si no, conservar el valor existente (evita resetear a false en cada merge).
    onboarding_complete = CASE WHEN p_patch ? 'onboarding_complete' THEN COALESCE(EXCLUDED.onboarding_complete, profiles_user.onboarding_complete) ELSE profiles_user.onboarding_complete END,
    media = profiles_user.media || EXCLUDED.media, -- Merge JSONB
    redes_sociales = profiles_user.redes_sociales || EXCLUDED.redes_sociales,
    -- ✅ Fix: usar merge profundo para respuestas (preserva campos anidados como dato_curioso, gusta_bailar)
    respuestas = CASE 
      WHEN EXCLUDED.respuestas IS NOT NULL AND jsonb_typeof(EXCLUDED.respuestas) = 'object' THEN
        public.jsonb_deep_merge(COALESCE(profiles_user.respuestas, '{}'::jsonb), EXCLUDED.respuestas)
      ELSE COALESCE(EXCLUDED.respuestas, profiles_user.respuestas)
    END,
    rsvp_events = COALESCE(EXCLUDED.rsvp_events, profiles_user.rsvp_events),
    updated_at = now();
END;
$$;

-- 3. Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.merge_profiles_user(uuid, jsonb) TO authenticated;

-- 4. Verificar políticas creadas
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ Ver'
    WHEN cmd = 'INSERT' THEN '➕ Crear'
    WHEN cmd = 'UPDATE' THEN '✏️ Editar'
    WHEN cmd = 'DELETE' THEN '🗑️ Eliminar'
  END as accion
FROM pg_policies
WHERE tablename = 'profiles_user'
ORDER BY cmd;

-- Deberías ver:
-- INSERT | ➕ Crear
-- SELECT | 👁️ Ver
-- UPDATE | ✏️ Editar

