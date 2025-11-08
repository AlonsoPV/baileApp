-- ============================================================================
-- DIAGNOSTICAR Y CORREGIR AVATAR DE USUARIO ESPECÍFICO
-- ============================================================================
-- Usuario: 3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9
-- ============================================================================

-- 1. Ver datos completos del usuario
SELECT 
    user_id,
    display_name,
    email,
    avatar_url,
    media,
    respuestas,
    created_at
FROM public.profiles_user
WHERE user_id = '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9';

-- 2. Ver solo el campo media (para analizar estructura)
SELECT 
    user_id,
    display_name,
    jsonb_pretty(media) as media_formatted
FROM public.profiles_user
WHERE user_id = '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9';

-- 3. Extraer URLs de media (si existen)
SELECT 
    user_id,
    display_name,
    avatar_url as avatar_url_actual,
    media->0->>'url' as media_0_url,
    media->0->>'path' as media_0_path,
    media->0->>'slot' as media_0_slot
FROM public.profiles_user
WHERE user_id = '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9';

-- ============================================================================
-- SOLUCIONES POSIBLES
-- ============================================================================

-- OPCIÓN A: Si media tiene la URL correcta, copiarla a avatar_url
-- (Descomenta y ejecuta si media->0->>'url' tiene la URL correcta)
/*
UPDATE public.profiles_user
SET avatar_url = media->0->>'url'
WHERE user_id = '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9'
  AND media->0->>'url' IS NOT NULL;
*/

-- OPCIÓN B: Si media tiene un path relativo, construir URL completa
-- (Descomenta y reemplaza [TU-PROYECTO-PROD] con tu URL de Supabase)
/*
UPDATE public.profiles_user
SET avatar_url = 'https://[TU-PROYECTO-PROD].supabase.co/storage/v1/object/public/' || (media->0->>'path')
WHERE user_id = '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9'
  AND media->0->>'path' IS NOT NULL;
*/

-- OPCIÓN C: Si avatar_url es un path relativo, convertirlo a URL completa
-- (Descomenta y reemplaza [TU-PROYECTO-PROD] con tu URL de Supabase)
/*
UPDATE public.profiles_user
SET avatar_url = 'https://[TU-PROYECTO-PROD].supabase.co/storage/v1/object/public/' || avatar_url
WHERE user_id = '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9'
  AND avatar_url IS NOT NULL
  AND avatar_url NOT LIKE 'https://%'
  AND avatar_url NOT LIKE 'http://%';
*/

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Ver resultado después de la corrección
SELECT 
    user_id,
    display_name,
    avatar_url,
    CASE 
        WHEN avatar_url LIKE 'https://%' THEN '✅ URL completa'
        WHEN avatar_url LIKE 'http://%' THEN '✅ URL completa'
        ELSE '❌ Formato incorrecto'
    END as estado
FROM public.profiles_user
WHERE user_id = '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9';

