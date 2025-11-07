-- ============================================================================
-- DIAGNÓSTICO: Por qué no puedo aprobar submissions en producción
-- ============================================================================

-- 1. Verificar que eres superadmin
SELECT 
    user_id,
    role_slug,
    granted_at
FROM public.user_roles
WHERE user_id = '0c20805f-519c-4e8e-9081-341ab64e504d';
-- Debe mostrar: role_slug = 'superadmin'

-- 2. Verificar función is_superadmin
SELECT public.is_superadmin('0c20805f-519c-4e8e-9081-341ab64e504d') as soy_superadmin;
-- Debe retornar: true

-- 3. Verificar que existen las funciones RPC de moderación
SELECT 
    proname,
    proargnames
FROM pg_proc
WHERE proname IN (
    'challenge_approve_submission',
    'challenge_reject_submission'
)
ORDER BY proname;
-- Debe mostrar ambas funciones

-- 4. Ver definición de challenge_approve_submission
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'challenge_approve_submission';

-- 5. Ver políticas RLS de challenge_submissions
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'challenge_submissions'
ORDER BY policyname;

-- 6. Ver submissions pendientes
SELECT 
    id,
    challenge_id,
    user_id,
    status,
    created_at
FROM public.challenge_submissions
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- 7. Intentar aprobar manualmente (para ver el error exacto)
-- REEMPLAZA 'SUBMISSION_ID' con el ID real de una submission pendiente
-- SELECT public.challenge_approve_submission(SUBMISSION_ID);

