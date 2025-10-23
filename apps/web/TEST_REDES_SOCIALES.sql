-- ============================================
-- TEST: Actualizar Redes Sociales
-- Script para probar la actualización de redes sociales
-- ============================================

-- 1) Verificar que tienes perfil
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.profiles_user WHERE user_id = auth.uid()) 
        THEN '✅ TIENES PERFIL'
        ELSE '❌ NO TIENES PERFIL - Ejecuta SCRIPT_12_FIX_MISSING_PROFILES.sql primero'
    END as estado_perfil;

-- 2) Actualizar redes sociales de prueba
UPDATE public.profiles_user 
SET redes_sociales = '{
    "instagram": "https://instagram.com/tu_usuario",
    "tiktok": "https://tiktok.com/@tu_usuario", 
    "youtube": "https://youtube.com/@tu_canal",
    "facebook": "https://facebook.com/tu_perfil",
    "whatsapp": "+1234567890"
}'::jsonb
WHERE user_id = auth.uid();

-- 3) Verificar que se actualizó
SELECT 
    user_id,
    redes_sociales,
    redes_sociales->>'instagram' as instagram,
    redes_sociales->>'tiktok' as tiktok,
    redes_sociales->>'youtube' as youtube
FROM public.profiles_user
WHERE user_id = auth.uid();

-- 4) También actualizar en respuestas.redes (por si acaso)
UPDATE public.profiles_user 
SET respuestas = COALESCE(respuestas, '{}'::jsonb) || '{
    "redes": {
        "instagram": "https://instagram.com/tu_usuario",
        "tiktok": "https://tiktok.com/@tu_usuario", 
        "youtube": "https://youtube.com/@tu_canal"
    }
}'::jsonb
WHERE user_id = auth.uid();

-- 5) Verificar ambas ubicaciones
SELECT 
    user_id,
    redes_sociales,
    respuestas->'redes' as redes_en_respuestas
FROM public.profiles_user
WHERE user_id = auth.uid();
