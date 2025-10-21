-- ============================================
-- Public Profiles Configuration
-- BaileApp - Configuración de Perfiles Públicos
-- ============================================

-- ============================================
-- 1. POLÍTICA DE LECTURA PÚBLICA
-- ============================================

-- Eliminar política existente si la hay
DROP POLICY IF EXISTS "Public can read user profiles" ON profiles_user;
DROP POLICY IF EXISTS "read user profiles public" ON profiles_user;

-- Crear política para lectura pública de perfiles
CREATE POLICY "Public can read user profiles"
ON profiles_user FOR SELECT
TO public
USING (true);

-- ============================================
-- 2. VERIFICAR QUE RLS ESTÉ HABILITADO
-- ============================================

-- Verificar si RLS está habilitado en profiles_user
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles_user' 
  AND schemaname = 'public';

-- Si no está habilitado, habilitarlo
ALTER TABLE profiles_user ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. VERIFICAR POLÍTICAS EXISTENTES
-- ============================================

-- Ver todas las políticas de profiles_user
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles_user'
ORDER BY policyname;

-- ============================================
-- 4. OPCIONAL: AGREGAR FLAG DE PRIVACIDAD
-- ============================================

-- Si quieres control fino de privacidad, descomenta esto:
/*
-- Agregar columna is_public
ALTER TABLE profiles_user 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Actualizar política para usar el flag
DROP POLICY IF EXISTS "Public can read user profiles" ON profiles_user;

CREATE POLICY "Public can read public user profiles"
ON profiles_user FOR SELECT
TO public
USING (coalesce(is_public, true));
*/

-- ============================================
-- 5. VERIFICACIÓN FINAL
-- ============================================

-- Verificar que la política funciona
SELECT 
  user_id,
  display_name,
  bio,
  avatar_url,
  ritmos,
  zonas,
  media
FROM profiles_user 
LIMIT 3;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Resultado esperado:
-- ✅ Política de lectura pública configurada
-- ✅ RLS habilitado en profiles_user
-- ✅ Perfiles visibles públicamente
-- ✅ Enlaces /u/:id funcionando

-- Para probar:
-- 1. Ve a cualquier perfil público: /u/USER_ID
-- 2. Verifica que se carga la información
-- 3. Usa UserProfileLink en listados
