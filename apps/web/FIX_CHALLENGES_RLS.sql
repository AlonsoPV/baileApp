-- FIX CHALLENGES RLS: Verificar y corregir políticas RLS

-- ================================================
-- Verificar políticas actuales
-- ================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('challenges', 'challenge_submissions', 'challenge_votes')
ORDER BY tablename, policyname;

-- ================================================
-- Verificar columnas de la tabla challenges
-- ================================================
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'challenges'
ORDER BY ordinal_position;

-- ================================================
-- Verificar si el usuario tiene rol permitido
-- ================================================
SELECT 
  auth.uid() as current_user_id,
  ur.role_slug,
  CASE 
    WHEN ur.role_slug IN ('usuario', 'superadmin') THEN true
    ELSE false
  END as can_create_challenges
FROM public.user_roles ur
WHERE ur.user_id = auth.uid();

-- ================================================
-- Verificar función challenge_create
-- ================================================
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  prosrc as source
FROM pg_proc
WHERE proname = 'challenge_create';

-- ================================================
-- Asegurar políticas RLS correctas
-- ================================================

-- Política de INSERT: usuarios y superadmin pueden crear
DROP POLICY IF EXISTS challenges_insert_allowed ON public.challenges;
CREATE POLICY challenges_insert_allowed ON public.challenges
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug IN ('usuario', 'superadmin')
  )
);

-- Política de UPDATE para owner en draft/rejected
DROP POLICY IF EXISTS challenges_update_owner ON public.challenges;
CREATE POLICY challenges_update_owner ON public.challenges
FOR UPDATE TO authenticated
USING (
  owner_id = auth.uid() AND status IN ('draft', 'rejected')
)
WITH CHECK (
  owner_id = auth.uid() AND status IN ('draft', 'rejected')
);

-- Política de UPDATE para superadmin (cualquier estado)
DROP POLICY IF EXISTS challenges_update_superadmin ON public.challenges;
CREATE POLICY challenges_update_superadmin ON public.challenges
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
)
WITH CHECK (true);

-- Política de SELECT pública
DROP POLICY IF EXISTS challenges_select_public ON public.challenges;
CREATE POLICY challenges_select_public ON public.challenges
FOR SELECT TO authenticated
USING (
  status IN ('open', 'closed', 'archived')
  OR owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- Política de DELETE para owner y superadmin
DROP POLICY IF EXISTS challenges_delete_owner ON public.challenges;
CREATE POLICY challenges_delete_owner ON public.challenges
FOR DELETE TO authenticated
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- ================================================
-- Verificar que RLS está habilitado
-- ================================================
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_votes ENABLE ROW LEVEL SECURITY;

-- ================================================
-- Test: Intentar insertar un challenge de prueba
-- ================================================
-- Descomenta esto para probar (reemplaza los valores)
/*
SELECT challenge_create(
  p_title := 'Test Challenge',
  p_description := 'Descripción de prueba',
  p_ritmo_slug := 'salsa',
  p_cover_image_url := NULL,
  p_owner_video_url := NULL,
  p_submission_deadline := NULL,
  p_voting_deadline := NULL
);
*/

-- ================================================
-- Ver challenges existentes
-- ================================================
SELECT 
  id,
  owner_id,
  title,
  status,
  cover_image_url,
  owner_video_url,
  created_at
FROM public.challenges
ORDER BY created_at DESC
LIMIT 5;

