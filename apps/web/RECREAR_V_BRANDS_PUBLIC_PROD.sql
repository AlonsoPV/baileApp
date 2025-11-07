-- ============================================================================
-- RECREAR v_brands_public EN PRODUCCIÓN
-- ============================================================================
-- Objetivo: Alinear la vista pública de marcas con staging
-- Agregar: user_id, estado_aprobacion, updated_at
-- ============================================================================

BEGIN;

-- 1. Eliminar la vista actual
DROP VIEW IF EXISTS public.v_brands_public;

-- 2. Recrear la vista con la estructura completa de staging
CREATE VIEW public.v_brands_public AS
SELECT
    id,
    user_id,
    nombre_publico,
    bio,
    avatar_url,
    portada_url,
    ritmos,
    zonas,
    redes_sociales,
    media,
    productos,
    estado_aprobacion,
    created_at,
    updated_at
FROM public.profiles_brand
WHERE estado_aprobacion = 'aprobado';

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- 1. Verificar estructura de la vista
SELECT column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'v_brands_public'
ORDER BY ordinal_position;

-- 2. Ver datos de la vista
SELECT id, user_id, nombre_publico, estado_aprobacion, created_at, updated_at
FROM public.v_brands_public
LIMIT 5;

-- 3. Contar registros
SELECT COUNT(*) as total_marcas_aprobadas
FROM public.v_brands_public;

