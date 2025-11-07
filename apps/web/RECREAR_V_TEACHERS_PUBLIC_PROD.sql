-- ============================================================================
-- RECREAR v_teachers_public EN PRODUCCIÓN
-- ============================================================================
-- Objetivo: Alinear la vista pública de maestros con staging
-- ============================================================================

BEGIN;

-- 1. Eliminar la vista actual
DROP VIEW IF EXISTS public.v_teachers_public;

-- 2. Recrear la vista con la estructura completa de staging
CREATE VIEW public.v_teachers_public AS
SELECT
    id,
    user_id,
    nombre_publico,
    bio,
    media,
    avatar_url,
    portada_url,
    ritmos,
    ritmos_seleccionados,
    zonas,
    redes_sociales,
    ubicaciones,
    cronograma,
    costos,
    faq,
    estado_aprobacion,
    created_at,
    updated_at
FROM public.profiles_teacher
WHERE estado_aprobacion = 'aprobado';

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- 1. Verificar estructura de la vista
SELECT column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'v_teachers_public'
ORDER BY ordinal_position;

-- 2. Ver datos de la vista
SELECT id, user_id, nombre_publico, estado_aprobacion, created_at, updated_at
FROM public.v_teachers_public
LIMIT 5;

-- 3. Contar registros
SELECT COUNT(*) as total_maestros_aprobados
FROM public.v_teachers_public;

