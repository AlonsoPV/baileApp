-- ============================================================================
-- ACTUALIZAR AVATARES DE CANDIDATOS EN TRENDING
-- ============================================================================
-- Problema: Los candidatos de trending no tienen avatar_url
-- Solución: Actualizar desde profiles_user
-- ============================================================================

BEGIN;

-- 1. Ver candidatos sin avatar
SELECT 
    tc.id,
    tc.trending_id,
    tc.user_id,
    tc.display_name,
    tc.avatar_url,
    tc.ritmo_slug,
    tc.list_name
FROM public.trending_candidates tc
WHERE tc.avatar_url IS NULL OR tc.avatar_url = ''
ORDER BY tc.trending_id, tc.id;

-- 2. Actualizar avatares desde profiles_user
UPDATE public.trending_candidates tc
SET avatar_url = pu.avatar_url
FROM public.profiles_user pu
WHERE tc.user_id = pu.user_id
  AND pu.avatar_url IS NOT NULL
  AND pu.avatar_url != ''
  AND (tc.avatar_url IS NULL OR tc.avatar_url = '');

-- 3. Ver resultado
SELECT 
    tc.id,
    tc.trending_id,
    tc.user_id,
    tc.display_name,
    tc.avatar_url,
    tc.avatar_url IS NOT NULL as tiene_avatar
FROM public.trending_candidates tc
ORDER BY tc.trending_id, tc.id;

-- 4. Contar candidatos con/sin avatar
SELECT 
    CASE 
        WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN 'Con avatar'
        ELSE 'Sin avatar'
    END as estado,
    COUNT(*) as total
FROM public.trending_candidates
GROUP BY 
    CASE 
        WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN 'Con avatar'
        ELSE 'Sin avatar'
    END;

COMMIT;

-- ============================================================================
-- BONUS: Actualizar también display_name y bio_short si están vacíos
-- ============================================================================

-- Actualizar display_name
UPDATE public.trending_candidates tc
SET display_name = COALESCE(pu.display_name, tc.display_name)
FROM public.profiles_user pu
WHERE tc.user_id = pu.user_id
  AND pu.display_name IS NOT NULL
  AND pu.display_name != ''
  AND (tc.display_name IS NULL OR tc.display_name = '');

-- Actualizar bio_short
UPDATE public.trending_candidates tc
SET bio_short = COALESCE(pu.bio, tc.bio_short)
FROM public.profiles_user pu
WHERE tc.user_id = pu.user_id
  AND pu.bio IS NOT NULL
  AND pu.bio != ''
  AND (tc.bio_short IS NULL OR tc.bio_short = '');

-- Verificar resultado final
SELECT 
    id,
    user_id,
    display_name,
    avatar_url IS NOT NULL as tiene_avatar,
    bio_short IS NOT NULL as tiene_bio
FROM public.trending_candidates
ORDER BY trending_id, id;

