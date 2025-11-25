-- ========================================
-- 🔧 FIX: Permitir acceso público a profiles_user con onboarding completo
-- ========================================
-- Esto permite que la búsqueda de usuarios funcione en competition groups

-- 1. Asegurar que existe la política para ver perfiles completos
-- Similar a profiles_teacher que permite ver maestros aprobados
DROP POLICY IF EXISTS "Anyone can view completed profiles" ON public.profiles_user;
DROP POLICY IF EXISTS "profiles_user_select_public_or_owner" ON public.profiles_user;

CREATE POLICY "profiles_user_select_public_or_owner"
ON public.profiles_user FOR SELECT
USING (
  -- Cualquiera puede ver usuarios con onboarding completo
  (
    (onboarding_complete = true OR onboarding_completed = true)
    AND display_name IS NOT NULL
    AND display_name != ''
  )
  OR
  -- O el usuario puede ver su propio perfil (incluso si incompleto)
  user_id = auth.uid()
);

-- 2. Mantener políticas de INSERT y UPDATE
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles_user;
CREATE POLICY "Users can insert own profile"
ON public.profiles_user FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles_user;
CREATE POLICY "Users can update own profile"
ON public.profiles_user FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Crear función RPC como alternativa para buscar usuarios
-- Esto evita problemas de RLS y exposición de tablas
CREATE OR REPLACE FUNCTION public.search_users_for_invitation(
  p_search_term TEXT DEFAULT NULL,
  p_exclude_user_id UUID DEFAULT NULL,
  p_limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pu.user_id,
    pu.display_name,
    pu.avatar_url
  FROM public.profiles_user pu
  WHERE 
    (pu.onboarding_complete = true OR pu.onboarding_completed = true)
    AND pu.display_name IS NOT NULL
    AND pu.display_name != ''
    AND (p_exclude_user_id IS NULL OR pu.user_id != p_exclude_user_id)
    AND (
      p_search_term IS NULL 
      OR pu.display_name ILIKE '%' || p_search_term || '%'
      OR pu.user_id::TEXT ILIKE '%' || p_search_term || '%'
    )
  ORDER BY pu.display_name
  LIMIT p_limit_count;
$$;

-- 4. Otorgar permisos a la función RPC
GRANT EXECUTE ON FUNCTION public.search_users_for_invitation(TEXT, UUID, INTEGER) TO authenticated, anon;

-- 5. Verificar políticas
SELECT 
  '🔐 POLÍTICAS DE PROFILES_USER' as info,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles_user'
ORDER BY policyname;

