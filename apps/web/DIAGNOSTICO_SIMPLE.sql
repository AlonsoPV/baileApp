-- ============================================
-- DIAGNÓSTICO SIMPLE
-- Verificar si existe tu perfil
-- ============================================

-- 1) Verificar si tienes perfil
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.profiles_user WHERE user_id = auth.uid()) 
        THEN '✅ TIENES PERFIL'
        ELSE '❌ NO TIENES PERFIL'
    END as estado_perfil;

-- 2) Si tienes perfil, mostrar datos básicos
SELECT 
    user_id,
    email,
    display_name,
    bio,
    ritmos,
    zonas,
    redes_sociales,
    onboarding_complete
FROM public.profiles_user
WHERE user_id = auth.uid();

-- 3) Contar total de usuarios vs perfiles
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_usuarios,
    (SELECT COUNT(*) FROM public.profiles_user) as total_perfiles,
    (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM public.profiles_user) as usuarios_sin_perfil;
