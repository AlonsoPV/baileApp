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
-- Usar CASCADE para eliminar también las políticas que dependen de ella
DROP FUNCTION IF EXISTS public.is_superadmin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_superadmin() CASCADE;

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
-- 5. RECREAR POLÍTICAS DE CHALLENGES (eliminadas por CASCADE)
-- ============================================

-- 5.1 Verificar si la tabla challenges existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'challenges') THEN
        -- Recrear políticas de challenges
        DROP POLICY IF EXISTS "challenges_select_public" ON public.challenges;
        CREATE POLICY "challenges_select_public"
        ON public.challenges
        FOR SELECT
        USING (status IN ('open', 'closed'));

        DROP POLICY IF EXISTS "challenges_update_superadmin" ON public.challenges;
        CREATE POLICY "challenges_update_superadmin"
        ON public.challenges
        FOR UPDATE
        USING (public.is_superadmin(auth.uid()));

        RAISE NOTICE '✅ Políticas de challenges recreadas';
    ELSE
        RAISE NOTICE '⏭️  Tabla challenges no existe (saltando)';
    END IF;
END $$;

-- 5.2 Verificar si la tabla challenge_submissions existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'challenge_submissions') THEN
        -- Recrear políticas de challenge_submissions
        DROP POLICY IF EXISTS "cs_select" ON public.challenge_submissions;
        CREATE POLICY "cs_select"
        ON public.challenge_submissions
        FOR SELECT
        USING (
          status = 'approved'
          OR user_id = auth.uid()
          OR public.is_superadmin(auth.uid())
        );

        DROP POLICY IF EXISTS "cs_update_moderation" ON public.challenge_submissions;
        CREATE POLICY "cs_update_moderation"
        ON public.challenge_submissions
        FOR UPDATE
        USING (
          user_id = auth.uid()
          OR public.is_superadmin(auth.uid())
        );

        DROP POLICY IF EXISTS "cs_delete" ON public.challenge_submissions;
        CREATE POLICY "cs_delete"
        ON public.challenge_submissions
        FOR DELETE
        USING (
          user_id = auth.uid()
          OR public.is_superadmin(auth.uid())
        );

        RAISE NOTICE '✅ Políticas de challenge_submissions recreadas';
    ELSE
        RAISE NOTICE '⏭️  Tabla challenge_submissions no existe (saltando)';
    END IF;
END $$;

-- 5.3 Verificar si la tabla challenge_votes existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'challenge_votes') THEN
        -- Recrear políticas de challenge_votes
        DROP POLICY IF EXISTS "votes_delete" ON public.challenge_votes;
        CREATE POLICY "votes_delete"
        ON public.challenge_votes
        FOR DELETE
        USING (
          voter_user_id = auth.uid()
          OR public.is_superadmin(auth.uid())
        );

        RAISE NOTICE '✅ Políticas de challenge_votes recreadas';
    ELSE
        RAISE NOTICE '⏭️  Tabla challenge_votes no existe (saltando)';
    END IF;
END $$;

-- ============================================
-- 6. VERIFICAR POLÍTICAS CREADAS
-- ============================================

-- 6.1 Políticas de user_roles
SELECT 
  '=== USER_ROLES POLICIES ===' as section,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_roles'
ORDER BY policyname;

-- 6.2 Políticas de challenges (si existe)
SELECT 
  '=== CHALLENGES POLICIES ===' as section,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'challenges'
ORDER BY policyname;

-- 6.3 Políticas de challenge_submissions (si existe)
SELECT 
  '=== CHALLENGE_SUBMISSIONS POLICIES ===' as section,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'challenge_submissions'
ORDER BY policyname;

-- 6.4 Políticas de challenge_votes (si existe)
SELECT 
  '=== CHALLENGE_VOTES POLICIES ===' as section,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'challenge_votes'
ORDER BY policyname;

-- ============================================
-- 7. TEST: Verificar que el usuario puede ver sus roles
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
-- 8. VERIFICAR FUNCIÓN HELPER
-- ============================================
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  provolatile as volatility
FROM pg_proc
WHERE proname = 'is_superadmin';

