-- ========================================
-- 👁️ CREAR VISTA PÚBLICA DE USUARIOS
-- ========================================
-- Vista para mostrar perfiles de usuarios de forma pública
-- (sin datos sensibles como email, pin_hash, etc.)

-- 1. Eliminar vista anterior si existe
DROP VIEW IF EXISTS public.v_user_public CASCADE;
DROP VIEW IF EXISTS public.users_live CASCADE;

-- 2. Crear vista pública de usuarios
CREATE OR REPLACE VIEW public.v_user_public AS
SELECT 
  pu.user_id,
  pu.display_name,
  pu.bio,
  pu.avatar_url,
  pu.ritmos,
  pu.ritmos_seleccionados,
  pu.zonas,
  pu.media,
  pu.redes_sociales,
  pu.respuestas,
  pu.onboarding_complete,
  pu.created_at,
  pu.updated_at
FROM public.profiles_user pu
WHERE pu.onboarding_complete = true
  AND pu.display_name IS NOT NULL;

-- 3. Crear alias 'users_live' (por compatibilidad)
CREATE OR REPLACE VIEW public.users_live AS
SELECT * FROM public.v_user_public;

-- 4. Políticas RLS (las vistas heredan de la tabla base)
-- Asegurar que profiles_user tenga política de SELECT pública para perfiles completos
DROP POLICY IF EXISTS "Anyone can view completed profiles" ON public.profiles_user;
CREATE POLICY "Anyone can view completed profiles"
ON public.profiles_user FOR SELECT
USING (
  onboarding_complete = true 
  AND display_name IS NOT NULL
);

-- 5. Mantener política para que usuarios vean su propio perfil (incluso si incompleto)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles_user;
CREATE POLICY "Users can view own profile"
ON public.profiles_user FOR SELECT
USING (user_id = auth.uid());

-- 6. Verificar vistas creadas
SELECT 
  '✅ VISTAS CREADAS' as status,
  table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('v_user_public', 'users_live')
ORDER BY table_name;

-- 7. Verificar políticas
SELECT 
  '🔐 POLÍTICAS DE PROFILES_USER' as info,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'profiles_user'
ORDER BY cmd, policyname;

-- 8. Ver usuarios públicos (los que se mostrarán)
SELECT 
  user_id,
  display_name,
  bio,
  avatar_url,
  array_length(ritmos_seleccionados, 1) as num_ritmos,
  array_length(zonas, 1) as num_zonas,
  onboarding_complete
FROM public.v_user_public
ORDER BY created_at DESC
LIMIT 10;

-- Deberías ver a todos los usuarios con onboarding completo

