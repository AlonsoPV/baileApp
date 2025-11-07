-- ============================================================================
-- DIAGNÓSTICO: Por qué no aparecen DancerCards en producción
-- ============================================================================

-- 1. Verificar si existe la vista v_user_public
SELECT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'v_user_public'
) as vista_v_user_public_existe;

-- 2. Ver estructura de v_user_public (si existe)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'v_user_public'
ORDER BY ordinal_position;

-- 3. Ver definición de la vista
SELECT pg_get_viewdef('public.v_user_public', true) as view_definition;

-- 4. Contar usuarios en v_user_public
SELECT COUNT(*) as total_usuarios_publicos
FROM public.v_user_public;

-- 5. Ver datos de ejemplo de v_user_public
SELECT 
    user_id,
    display_name,
    bio,
    avatar_url,
    banner_url,
    portada_url,
    onboarding_completed
FROM public.v_user_public
LIMIT 5;

-- 6. Ver usuarios en profiles_user (tabla base)
SELECT 
    user_id,
    display_name,
    onboarding_completed,
    ritmos,
    zonas,
    created_at
FROM public.profiles_user
ORDER BY created_at DESC
LIMIT 10;

-- 7. Contar usuarios por estado de onboarding
SELECT 
    onboarding_completed,
    COUNT(*) as total
FROM public.profiles_user
GROUP BY onboarding_completed;

-- 8. Ver usuarios que DEBERÍAN aparecer en v_user_public
SELECT 
    user_id,
    display_name,
    onboarding_completed,
    display_name IS NOT NULL as tiene_nombre,
    display_name != '' as nombre_no_vacio
FROM public.profiles_user
WHERE onboarding_completed = true
  AND display_name IS NOT NULL
  AND display_name != ''
LIMIT 10;

