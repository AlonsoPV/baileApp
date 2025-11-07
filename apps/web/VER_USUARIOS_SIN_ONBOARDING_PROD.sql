-- ============================================================================
-- VER USUARIOS SIN ONBOARDING COMPLETADO EN PRODUCCIÓN
-- ============================================================================

-- 1. Resumen por estado de onboarding
SELECT 
    CASE 
        WHEN onboarding_completed = true OR onboarding_complete = true THEN 'Completado'
        ELSE 'Incompleto'
    END as estado,
    COUNT(*) as total_usuarios
FROM public.profiles_user
GROUP BY 
    CASE 
        WHEN onboarding_completed = true OR onboarding_complete = true THEN 'Completado'
        ELSE 'Incompleto'
    END
ORDER BY estado;

-- 2. Ver usuarios SIN onboarding completado (detallado)
SELECT 
    user_id,
    email,
    display_name,
    onboarding_complete,
    onboarding_completed,
    array_length(ritmos, 1) as cant_ritmos,
    array_length(zonas, 1) as cant_zonas,
    avatar_url IS NOT NULL as tiene_avatar,
    bio IS NOT NULL as tiene_bio,
    created_at
FROM public.profiles_user
WHERE (onboarding_completed IS NULL OR onboarding_completed = false)
  AND (onboarding_complete IS NULL OR onboarding_complete = false)
ORDER BY created_at DESC;

-- 3. Ver usuarios CON onboarding completado
SELECT 
    user_id,
    email,
    display_name,
    onboarding_complete,
    onboarding_completed,
    array_length(ritmos, 1) as cant_ritmos,
    array_length(zonas, 1) as cant_zonas,
    created_at
FROM public.profiles_user
WHERE onboarding_completed = true OR onboarding_complete = true
ORDER BY created_at DESC;

-- 4. Ver usuarios que DEBERÍAN tener onboarding completado
-- (tienen display_name, ritmos y zonas pero el flag está en false)
SELECT 
    user_id,
    email,
    display_name,
    onboarding_complete,
    onboarding_completed,
    array_length(ritmos, 1) as cant_ritmos,
    array_length(zonas, 1) as cant_zonas,
    created_at
FROM public.profiles_user
WHERE display_name IS NOT NULL
  AND display_name != ''
  AND ritmos IS NOT NULL
  AND array_length(ritmos, 1) > 0
  AND zonas IS NOT NULL
  AND array_length(zonas, 1) > 0
  AND (onboarding_completed IS NULL OR onboarding_completed = false)
  AND (onboarding_complete IS NULL OR onboarding_complete = false)
ORDER BY created_at DESC;

-- 5. Contar por categoría
SELECT 
    'Total usuarios' as categoria,
    COUNT(*) as cantidad
FROM public.profiles_user
UNION ALL
SELECT 
    'Con onboarding completado',
    COUNT(*)
FROM public.profiles_user
WHERE onboarding_completed = true OR onboarding_complete = true
UNION ALL
SELECT 
    'Sin onboarding completado',
    COUNT(*)
FROM public.profiles_user
WHERE (onboarding_completed IS NULL OR onboarding_completed = false)
  AND (onboarding_complete IS NULL OR onboarding_complete = false)
UNION ALL
SELECT 
    'Con datos completos pero flag en false',
    COUNT(*)
FROM public.profiles_user
WHERE display_name IS NOT NULL
  AND display_name != ''
  AND ritmos IS NOT NULL
  AND array_length(ritmos, 1) > 0
  AND zonas IS NOT NULL
  AND array_length(zonas, 1) > 0
  AND (onboarding_completed IS NULL OR onboarding_completed = false)
  AND (onboarding_complete IS NULL OR onboarding_complete = false);

