-- ========================================
-- 🔧 FIX: RLS y RPC para profiles_user
-- ========================================

-- 1. Crear/actualizar políticas RLS para profiles_user
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles_user;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles_user;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles_user;

-- SELECT: Usuario puede ver su propio perfil
CREATE POLICY "Users can view own profile"
ON public.profiles_user FOR SELECT
USING (user_id = auth.uid());

-- INSERT: Usuario puede crear su propio perfil
CREATE POLICY "Users can insert own profile"
ON public.profiles_user FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE: Usuario puede actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles_user FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2. Crear función merge_profiles_user (para upserts)
DROP FUNCTION IF EXISTS public.merge_profiles_user(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.merge_profiles_user(
  p_user_id uuid,
  p_patch jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario autenticado es el owner
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'No tienes permisos para modificar este perfil';
  END IF;

  -- Hacer upsert con merge de JSONB
  INSERT INTO public.profiles_user (
    user_id,
    email,
    display_name,
    bio,
    avatar_url,
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
    (p_patch->>'display_name')::text,
    (p_patch->>'bio')::text,
    (p_patch->>'avatar_url')::text,
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
    ritmos = COALESCE(EXCLUDED.ritmos, profiles_user.ritmos),
    ritmos_seleccionados = COALESCE(EXCLUDED.ritmos_seleccionados, profiles_user.ritmos_seleccionados),
    zonas = COALESCE(EXCLUDED.zonas, profiles_user.zonas),
    onboarding_complete = COALESCE(EXCLUDED.onboarding_complete, profiles_user.onboarding_complete),
    media = profiles_user.media || EXCLUDED.media, -- Merge JSONB
    redes_sociales = profiles_user.redes_sociales || EXCLUDED.redes_sociales,
    respuestas = profiles_user.respuestas || EXCLUDED.respuestas,
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

