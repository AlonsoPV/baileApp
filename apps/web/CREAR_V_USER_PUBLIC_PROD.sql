-- ============================================================================
-- CREAR VISTA v_user_public EN PRODUCCIÓN
-- ============================================================================
-- Vista pública de usuarios que completaron el onboarding
-- ============================================================================

BEGIN;

-- 1. Eliminar vista existente (si existe)
DROP VIEW IF EXISTS public.v_user_public CASCADE;

-- También eliminar vista antigua 'user_public' (sin v_)
DROP VIEW IF EXISTS public.user_public CASCADE;

-- 2. Crear vista v_user_public (solo con columnas que existen en producción)
CREATE VIEW public.v_user_public AS
SELECT
    user_id,
    display_name,
    bio,
    avatar_url,
    media,
    ritmos,
    ritmos_seleccionados,
    zonas,
    redes_sociales,
    email,
    created_at,
    updated_at,
    onboarding_complete,
    onboarding_completed,
    pin_hash,
    pin_verified_at,
    premios,
    respuestas,
    rsvp_events
FROM public.profiles_user
WHERE (onboarding_completed = true OR onboarding_complete = true)
  AND display_name IS NOT NULL
  AND display_name != '';

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver estructura de la vista
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'v_user_public'
ORDER BY ordinal_position;

-- Contar usuarios en la vista
SELECT COUNT(*) as total_usuarios_publicos
FROM public.v_user_public;

-- Ver datos de ejemplo
SELECT 
    user_id,
    display_name,
    bio,
    avatar_url,
    array_length(ritmos, 1) as cant_ritmos,
    array_length(zonas, 1) as cant_zonas,
    onboarding_completed
FROM public.v_user_public
LIMIT 10;

-- Comparar con tabla base
SELECT 
    'profiles_user' as tabla,
    COUNT(*) as total
FROM public.profiles_user
UNION ALL
SELECT 'v_user_public', COUNT(*)
FROM public.v_user_public;

