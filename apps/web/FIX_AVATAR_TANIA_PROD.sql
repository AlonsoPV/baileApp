-- ============================================================================
-- CORREGIR AVATAR DE TANIA SIFUENTES
-- ============================================================================
-- Problema: avatar_url tiene placeholder [path-correcto]
-- Solución: Usar la URL correcta del media (p2 o p3 que son JPEG)
-- ============================================================================

BEGIN;

-- 1. Ver datos actuales
SELECT 
    user_id,
    display_name,
    avatar_url,
    media->0->>'url' as media_p1_url,
    media->1->>'url' as media_p2_url,
    media->2->>'url' as media_p3_url
FROM public.profiles_user
WHERE user_id = '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9';

-- 2. Actualizar avatar_url con p2 (JPEG - compatible con todos los navegadores)
UPDATE public.profiles_user
SET avatar_url = media->1->>'url'
WHERE user_id = '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9';

-- Alternativa: Usar p3 si prefieres esa foto
-- UPDATE public.profiles_user
-- SET avatar_url = media->2->>'url'
-- WHERE user_id = '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9';

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver resultado
SELECT 
    user_id,
    display_name,
    avatar_url,
    CASE 
        WHEN avatar_url LIKE 'https://%' AND avatar_url NOT LIKE '%[path-correcto]%' THEN '✅ URL correcta'
        ELSE '❌ URL incorrecta'
    END as estado
FROM public.profiles_user
WHERE user_id = '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9';

-- Ver que la URL es accesible (debe retornar la ruta completa)
SELECT 
    'Avatar URL:' as campo,
    avatar_url as valor
FROM public.profiles_user
WHERE user_id = '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9';

