-- ============================================================================
-- VERIFICAR SISTEMA DE ONBOARDING EN PRODUCCIÓN
-- ============================================================================

-- 1. Verificar columna onboarding_completed en profiles_user
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_user'
  AND column_name = 'onboarding_completed';

-- 2. Ver estructura completa de profiles_user
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_user'
ORDER BY ordinal_position;

-- 3. Verificar si existe columna pin_hash para autenticación PIN
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_user'
  AND column_name IN ('pin_hash', 'pin_verified_at');

-- 4. Ver usuarios con onboarding completado
SELECT 
    user_id,
    display_name,
    onboarding_completed,
    created_at
FROM public.profiles_user
WHERE onboarding_completed = true
LIMIT 5;

-- 5. Ver usuarios sin onboarding completado
SELECT 
    user_id,
    display_name,
    onboarding_completed,
    created_at
FROM public.profiles_user
WHERE onboarding_completed = false OR onboarding_completed IS NULL
LIMIT 5;

-- 6. Estadísticas de onboarding
SELECT 
    onboarding_completed,
    COUNT(*) as total_usuarios
FROM public.profiles_user
GROUP BY onboarding_completed
ORDER BY onboarding_completed;

-- 7. Verificar campos requeridos para onboarding
SELECT 
    COUNT(*) FILTER (WHERE display_name IS NOT NULL) as con_nombre,
    COUNT(*) FILTER (WHERE ritmos IS NOT NULL AND array_length(ritmos, 1) > 0) as con_ritmos,
    COUNT(*) FILTER (WHERE zonas IS NOT NULL AND array_length(zonas, 1) > 0) as con_zonas,
    COUNT(*) as total
FROM public.profiles_user;

