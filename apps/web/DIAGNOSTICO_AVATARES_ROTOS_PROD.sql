-- ============================================================================
-- DIAGNÓSTICO: Avatares rotos en producción
-- ============================================================================

-- 1. Ver todos los avatares de usuarios
SELECT 
    user_id,
    display_name,
    avatar_url,
    CASE 
        WHEN avatar_url IS NULL THEN 'Sin avatar'
        WHEN avatar_url LIKE 'https://%' THEN 'URL completa'
        WHEN avatar_url LIKE 'media/%' THEN 'Path relativo (bucket/path)'
        WHEN avatar_url LIKE '%/%' THEN 'Path con bucket'
        ELSE 'Formato desconocido'
    END as formato_url,
    LENGTH(avatar_url) as longitud,
    created_at
FROM public.profiles_user
WHERE avatar_url IS NOT NULL
ORDER BY created_at DESC;

-- 2. Ver avatares que NO son URLs completas (probablemente rotos)
SELECT 
    user_id,
    display_name,
    avatar_url,
    media
FROM public.profiles_user
WHERE avatar_url IS NOT NULL
  AND avatar_url NOT LIKE 'https://%'
  AND avatar_url NOT LIKE 'http://%'
ORDER BY created_at DESC;

-- 3. Ver usuarios con media pero sin avatar_url
SELECT 
    user_id,
    display_name,
    avatar_url,
    media,
    media IS NOT NULL as tiene_media,
    jsonb_array_length(COALESCE(media, '[]'::jsonb)) as cant_media
FROM public.profiles_user
WHERE media IS NOT NULL
  AND jsonb_array_length(media) > 0
  AND (avatar_url IS NULL OR avatar_url = '')
LIMIT 10;

-- 4. Ver estructura del campo media
SELECT 
    user_id,
    display_name,
    media
FROM public.profiles_user
WHERE media IS NOT NULL
  AND jsonb_array_length(media) > 0
LIMIT 5;

-- 5. Buscar usuario específico (reemplaza con el user_id del usuario con avatar roto)
-- SELECT 
--     user_id,
--     display_name,
--     avatar_url,
--     media,
--     redes_sociales,
--     respuestas
-- FROM public.profiles_user
-- WHERE user_id = 'USER_ID_AQUI';

