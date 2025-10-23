-- ============================================
-- DIAGNÓSTICO COMPLETO: Redes Sociales
-- Script completo para diagnosticar y solucionar
-- ============================================

-- 1) Verificar si tienes perfil
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.profiles_user WHERE user_id = auth.uid()) 
        THEN '✅ TIENES PERFIL'
        ELSE '❌ NO TIENES PERFIL'
    END as estado_perfil;

-- 2) Si no tienes perfil, crear uno básico
INSERT INTO public.profiles_user (user_id, email, onboarding_complete, created_at)
SELECT 
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    false,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles_user WHERE user_id = auth.uid())
ON CONFLICT (user_id) DO NOTHING;

-- 3) Verificar que la función RPC existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'merge_profiles_user')
        THEN '✅ FUNCIÓN RPC EXISTE'
        ELSE '❌ FUNCIÓN RPC NO EXISTE - Ejecuta SCRIPT_15_MERGE_PROFILES_USER_RPC.sql'
    END as estado_rpc;

-- 4) Probar actualización de redes sociales
UPDATE public.profiles_user 
SET redes_sociales = '{
    "instagram": "https://instagram.com/test_usuario",
    "tiktok": "https://tiktok.com/@test_usuario", 
    "youtube": "https://youtube.com/@test_canal"
}'::jsonb
WHERE user_id = auth.uid();

-- 5) Verificar que se guardó
SELECT 
    user_id,
    redes_sociales,
    redes_sociales->>'instagram' as instagram,
    redes_sociales->>'tiktok' as tiktok,
    redes_sociales->>'youtube' as youtube
FROM public.profiles_user
WHERE user_id = auth.uid();

-- 6) Probar con RPC (método que usa la app)
SELECT merge_profiles_user(
    auth.uid(),
    '{
        "redes_sociales": {
            "instagram": "https://instagram.com/test_rpc",
            "tiktok": "https://tiktok.com/@test_rpc", 
            "youtube": "https://youtube.com/@test_rpc"
        }
    }'::jsonb
);

-- 7) Verificar resultado del RPC
SELECT 
    user_id,
    redes_sociales,
    redes_sociales->>'instagram' as instagram_rpc,
    redes_sociales->>'tiktok' as tiktok_rpc,
    redes_sociales->>'youtube' as youtube_rpc
FROM public.profiles_user
WHERE user_id = auth.uid();

-- 8) Verificar políticas RLS
SELECT 
    policyname,
    cmd as operation,
    roles,
    qual as using_expression
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles_user'
  AND cmd = 'UPDATE'
ORDER BY policyname;
