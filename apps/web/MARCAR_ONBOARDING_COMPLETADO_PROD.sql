-- ============================================================================
-- MARCAR ONBOARDING COMO COMPLETADO PARA USUARIOS EXISTENTES
-- ============================================================================
-- Ejecuta esto SOLO si los usuarios ya tienen datos básicos
-- ============================================================================

-- 1. Ver usuarios y sus datos actuales
SELECT 
    user_id,
    display_name,
    array_length(ritmos, 1) as cant_ritmos,
    array_length(zonas, 1) as cant_zonas,
    onboarding_completed,
    created_at
FROM public.profiles_user
ORDER BY created_at DESC;

-- 2. Marcar como completado SOLO usuarios con datos completos
-- (tienen display_name, al menos 1 ritmo, y al menos 1 zona)
UPDATE public.profiles_user
SET onboarding_completed = true
WHERE display_name IS NOT NULL
  AND display_name != ''
  AND ritmos IS NOT NULL 
  AND array_length(ritmos, 1) > 0
  AND zonas IS NOT NULL 
  AND array_length(zonas, 1) > 0
  AND onboarding_completed = false;

-- 3. Verificar resultado
SELECT 
    onboarding_completed,
    COUNT(*) as total_usuarios
FROM public.profiles_user
GROUP BY onboarding_completed
ORDER BY onboarding_completed;

-- 4. Ver usuarios que AÚN NO tienen onboarding completado
SELECT 
    user_id,
    email,
    display_name,
    array_length(ritmos, 1) as cant_ritmos,
    array_length(zonas, 1) as cant_zonas,
    onboarding_completed,
    created_at
FROM public.profiles_user
WHERE onboarding_completed = false
ORDER BY created_at DESC;

