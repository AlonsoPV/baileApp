-- ============================================================================
-- PERMITIR ACCESO PÚBLICO A CHALLENGES APROBADOS
-- ============================================================================
-- Problema: Usuarios no autenticados no pueden ver challenges
-- Solución: Agregar políticas para usuarios anónimos (anon)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. POLÍTICAS PARA CHALLENGES
-- ============================================================================

-- Eliminar política existente de SELECT
DROP POLICY IF EXISTS challenges_select_public ON public.challenges;

-- Crear política que permite a TODOS (autenticados y anónimos) ver challenges abiertos
CREATE POLICY challenges_select_public ON public.challenges
    FOR SELECT 
    TO public  -- 'public' incluye tanto 'authenticated' como 'anon'
    USING (status = 'open');

-- ============================================================================
-- 2. POLÍTICAS PARA CHALLENGE_SUBMISSIONS
-- ============================================================================

-- Eliminar política existente de SELECT
DROP POLICY IF EXISTS submissions_select_public ON public.challenge_submissions;

-- Crear política que permite a TODOS ver submissions aprobadas
CREATE POLICY submissions_select_public ON public.challenge_submissions
    FOR SELECT 
    TO public
    USING (status = 'approved');

-- Mantener política para que usuarios vean sus propias submissions
DROP POLICY IF EXISTS submissions_select_own ON public.challenge_submissions;
CREATE POLICY submissions_select_own ON public.challenge_submissions
    FOR SELECT 
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================================================
-- 3. POLÍTICAS PARA CHALLENGE_VOTES
-- ============================================================================

-- Los votos NO deben ser visibles públicamente (privacidad)
-- Solo el usuario puede ver sus propios votos

DROP POLICY IF EXISTS votes_select_own ON public.challenge_votes;
CREATE POLICY votes_select_own ON public.challenge_votes
    FOR SELECT 
    TO authenticated
    USING (user_id = auth.uid());

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver políticas de challenges
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename IN ('challenges', 'challenge_submissions', 'challenge_votes')
ORDER BY tablename, policyname;

-- Probar acceso público (simular usuario anónimo)
-- Esto debería retornar challenges con status = 'open'
SELECT 
    id,
    title,
    status,
    created_at
FROM public.challenges
WHERE status = 'open'
LIMIT 5;

-- Contar challenges por estado
SELECT 
    status,
    COUNT(*) as total
FROM public.challenges
GROUP BY status
ORDER BY status;

