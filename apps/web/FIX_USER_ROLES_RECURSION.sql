-- Fix User Roles Infinite Recursion - Arreglar recursión infinita en políticas RLS
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- PROBLEMA: La política user_roles_select_superadmin
-- hace una consulta a user_roles dentro de la misma
-- política, causando recursión infinita.
-- ============================================

-- ============================================
-- SOLUCIÓN: Usar una función SECURITY DEFINER
-- que evita la recursión
-- ============================================

-- 1. Eliminar función existente si tiene firma diferente
DROP FUNCTION IF EXISTS public.is_superadmin(uuid);
DROP FUNCTION IF EXISTS public.is_superadmin();

-- 2. Crear función helper para verificar si es superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = check_user_id 
    AND role_slug = 'superadmin'
  );
END;
$$;

-- 3. Eliminar políticas existentes
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_public" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_superadmin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_superadmin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_superadmin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_superadmin" ON public.user_roles;

-- 4. Crear políticas SIN recursión

-- SELECT: Los usuarios pueden ver sus propios roles
CREATE POLICY "user_roles_select_own"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- SELECT: Los superadmins pueden ver todos los roles (usando función SECURITY DEFINER)
CREATE POLICY "user_roles_select_superadmin"
ON public.user_roles
FOR SELECT
USING (public.is_superadmin(auth.uid()));

-- INSERT: Solo superadmins pueden insertar roles
CREATE POLICY "user_roles_insert_superadmin"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_superadmin(auth.uid()));

-- UPDATE: Solo superadmins pueden actualizar roles
CREATE POLICY "user_roles_update_superadmin"
ON public.user_roles
FOR UPDATE
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

-- DELETE: Solo superadmins pueden eliminar roles
CREATE POLICY "user_roles_delete_superadmin"
ON public.user_roles
FOR DELETE
USING (public.is_superadmin(auth.uid()));

-- ============================================
-- 5. VERIFICAR POLÍTICAS CREADAS
-- ============================================
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_roles'
ORDER BY policyname;

-- ============================================
-- 6. TEST: Verificar que el usuario puede ver sus roles
-- ============================================
-- Descomenta para probar (reemplaza con tu user_id)
/*
SELECT 
  role_slug,
  created_at
FROM public.user_roles
WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285'::UUID;
*/

-- ============================================
-- 7. VERIFICAR FUNCIÓN HELPER
-- ============================================
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  provolatile as volatility
FROM pg_proc
WHERE proname = 'is_superadmin';

