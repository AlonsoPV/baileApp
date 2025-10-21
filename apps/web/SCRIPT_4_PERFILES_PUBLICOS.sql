-- ============================================
-- SCRIPT 4: PERFILES PÚBLICOS DE USUARIOS
-- BaileApp - RLS para acceso público a perfiles
-- ============================================

-- NOTA: Este script se ejecuta en el SQL Editor de Supabase
-- Asegúrate de tener permisos de administrador

-- ============================================
-- 1. POLÍTICAS RLS PARA "profiles_user"
-- ============================================

-- Habilitar RLS si no está habilitado
ALTER TABLE public.profiles_user ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que puedan entrar en conflicto
DROP POLICY IF EXISTS "select own and public profiles" ON public.profiles_user;
DROP POLICY IF EXISTS "read user profiles public" ON public.profiles_user;
DROP POLICY IF EXISTS "Public can view all user profiles" ON public.profiles_user;
DROP POLICY IF EXISTS "Authenticated users can view all user profiles" ON public.profiles_user;

-- Política: Todos pueden ver perfiles de usuario (público)
-- Esto asume que todos los perfiles son públicos por defecto.
-- Si se desea un control más granular, se puede añadir una columna `is_public`
-- a `profiles_user` y modificar esta política.
CREATE POLICY "Public can view all user profiles"
ON public.profiles_user FOR SELECT
TO public
USING (true);

-- Política: Usuarios autenticados pueden insertar su propio perfil
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles_user;
CREATE POLICY "Users can insert own profile"
ON public.profiles_user FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política: Usuarios autenticados pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles_user;
CREATE POLICY "Users can update own profile"
ON public.profiles_user FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Usuarios autenticados pueden eliminar su propio perfil
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles_user;
CREATE POLICY "Users can delete own profile"
ON public.profiles_user FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- 2. VERIFICACIÓN COMPLETA
-- ============================================

-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'profiles_user';

-- Ver todas las políticas RLS para profiles_user
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles_user'
ORDER BY policyname;

-- Verificar estructura de la tabla
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_user'
ORDER BY ordinal_position;

-- ============================================
-- FIN DEL SCRIPT 4
-- ============================================

-- Resultado esperado:
-- ✅ RLS habilitado en "profiles_user"
-- ✅ Política "Public can view all user profiles" configurada para SELECT (público)
-- ✅ Políticas INSERT/UPDATE/DELETE para usuarios autenticados (solo su perfil)
-- ✅ Todos pueden ver todos los perfiles de usuario
-- ✅ Solo el dueño puede editar/eliminar su propio perfil

-- ============================================
-- OPCIONAL: Si deseas perfiles privados
-- ============================================

-- Si quieres agregar control de privacidad (opcional):
-- 1. Agregar columna is_public a profiles_user:
-- ALTER TABLE public.profiles_user ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- 2. Modificar la política de SELECT:
-- DROP POLICY IF EXISTS "Public can view all user profiles" ON public.profiles_user;
-- CREATE POLICY "Public can view public user profiles"
-- ON public.profiles_user FOR SELECT
-- TO public
-- USING (is_public = true OR auth.uid() = user_id);

-- Por ahora, todos los perfiles son públicos por defecto.
