-- ============================================================================
-- REORDENAR MEDIA DE TANIA PARA MOSTRAR JPEG PRIMERO
-- ============================================================================
-- Problema: Primera foto es HEIC (no compatible con escritorio)
-- Solución: Reordenar para que JPEG aparezcan primero
-- ============================================================================

BEGIN;

-- 1. Ver orden actual de media
SELECT 
    user_id,
    display_name,
    jsonb_pretty(media) as media_actual
FROM public.profiles_user
WHERE user_id = '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9';

-- 2. Reordenar media: poner JPEG primero, HEIC al final
UPDATE public.profiles_user
SET media = jsonb_build_array(
    -- p2 (JPEG) como primera foto
    jsonb_build_object(
        'url', 'https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/user-media/3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9/p2.jpeg',
        'kind', 'photo',
        'slot', 'p1',
        'title', 'Foto P1'
    ),
    -- p3 (JPEG) como segunda foto
    jsonb_build_object(
        'url', 'https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/user-media/3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9/p3.jpeg',
        'kind', 'photo',
        'slot', 'p2',
        'title', 'Foto P2'
    ),
    -- p1 (HEIC) como tercera foto (solo visible en iOS)
    jsonb_build_object(
        'url', 'https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/user-media/3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9/p1.heic',
        'kind', 'photo',
        'slot', 'p3',
        'title', 'Foto P3'
    )
),
-- También actualizar avatar_url con la primera foto (p2.jpeg)
avatar_url = 'https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/user-media/3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9/p2.jpeg'
WHERE user_id = '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9';

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver resultado
SELECT 
    user_id,
    display_name,
    avatar_url,
    jsonb_pretty(media) as media_reordenado
FROM public.profiles_user
WHERE user_id = '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9';

-- Verificar que avatar_url es JPEG
SELECT 
    user_id,
    display_name,
    avatar_url,
    CASE 
        WHEN avatar_url LIKE '%.jpeg' OR avatar_url LIKE '%.jpg' THEN '✅ JPEG (compatible)'
        WHEN avatar_url LIKE '%.heic' THEN '❌ HEIC (solo iOS)'
        ELSE '⚠️ Otro formato'
    END as formato
FROM public.profiles_user
WHERE user_id = '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9';

