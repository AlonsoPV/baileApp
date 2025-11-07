-- ============================================================================
-- VERIFICAR RPCs DE CHALLENGES EN PRODUCCIÓN
-- ============================================================================

-- 1. Ver todas las funciones relacionadas con challenges
SELECT 
    proname,
    proargnames,
    proargtypes::regtype[]
FROM pg_proc
WHERE proname LIKE 'challenge%'
ORDER BY proname;

-- 2. Verificar funciones específicas de moderación
SELECT proname 
FROM pg_proc
WHERE proname IN (
    'challenge_approve_submission',
    'challenge_reject_submission',
    'challenge_toggle_vote'
)
ORDER BY proname;

-- 3. Ver políticas RLS de challenge_submissions
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'challenge_submissions'
ORDER BY policyname;

-- 4. Ver si eres superadmin
SELECT * FROM public.user_roles
WHERE user_id = '0c20805f-519c-4e8e-9081-341ab64e504d'
  AND role_slug = 'superadmin';

-- 5. Probar función is_superadmin
SELECT public.is_superadmin('0c20805f-519c-4e8e-9081-341ab64e504d') as soy_superadmin;

