-- Fix User Roles RLS - Asegurar que los usuarios puedan leer sus propios roles
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar tabla user_roles
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_roles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar si RLS está habilitado
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'user_roles';

-- 3. Ver políticas actuales
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_roles';

-- 4. Eliminar políticas existentes
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_public" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_superadmin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_superadmin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_superadmin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_superadmin" ON public.user_roles;

-- 5. Crear política para que usuarios puedan ver sus propios roles
CREATE POLICY "user_roles_select_own"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- 6. Crear política para que superadmin pueda ver todos los roles
CREATE POLICY "user_roles_select_superadmin"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- 7. Crear política para que superadmin pueda insertar roles
CREATE POLICY "user_roles_insert_superadmin"
ON public.user_roles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- 8. Crear política para que superadmin pueda actualizar roles
CREATE POLICY "user_roles_update_superadmin"
ON public.user_roles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- 9. Crear política para que superadmin pueda eliminar roles
CREATE POLICY "user_roles_delete_superadmin"
ON public.user_roles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- 10. Verificar políticas creadas
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_roles'
ORDER BY policyname;

-- 11. Verificar que el usuario puede ver sus roles
SELECT 
  role_slug,
  created_at
FROM public.user_roles
WHERE user_id = auth.uid();

