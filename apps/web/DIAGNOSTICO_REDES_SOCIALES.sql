-- ============================================
-- DIAGNÓSTICO: Redes Sociales
-- Verificar datos de redes sociales del usuario
-- ============================================

-- 1) Ver tu perfil completo con redes sociales
SELECT 
    user_id,
    email,
    display_name,
    redes_sociales,
    respuestas,
    created_at
FROM public.profiles_user
WHERE user_id = auth.uid();

-- 2) Verificar estructura de redes_sociales
SELECT 
    user_id,
    redes_sociales,
    redes_sociales->>'instagram' as instagram,
    redes_sociales->>'tiktok' as tiktok,
    redes_sociales->>'youtube' as youtube,
    redes_sociales->>'facebook' as facebook,
    redes_sociales->>'whatsapp' as whatsapp
FROM public.profiles_user
WHERE user_id = auth.uid();

-- 3) Verificar estructura de respuestas.redes
SELECT 
    user_id,
    respuestas,
    respuestas->'redes' as redes_en_respuestas,
    respuestas->'redes'->>'instagram' as instagram_respuestas,
    respuestas->'redes'->>'tiktok' as tiktok_respuestas,
    respuestas->'redes'->>'youtube' as youtube_respuestas
FROM public.profiles_user
WHERE user_id = auth.uid();

-- 4) Verificar si el campo redes_sociales existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles_user' 
  AND column_name = 'redes_sociales';

-- 5) Verificar políticas RLS para UPDATE
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
