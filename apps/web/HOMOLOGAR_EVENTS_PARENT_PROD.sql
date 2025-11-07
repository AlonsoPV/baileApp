-- ============================================================================
-- HOMOLOGAR events_parent EN PRODUCCIÓN CON STAGING
-- ============================================================================
-- Objetivo: Alinear tipos de datos con staging
-- ============================================================================

BEGIN;

-- 0. Eliminar vistas que dependen de events_parent (si existen)
DROP VIEW IF EXISTS public.v_events_parent_public CASCADE;
DROP VIEW IF EXISTS public.events_live CASCADE;

-- 1. Cambiar tipo de array 'estilos' de _int8 a _int4
ALTER TABLE public.events_parent
ALTER COLUMN estilos TYPE integer[] USING estilos::integer[];

-- 2. Recrear vista pública de events_parent (si existía)
CREATE OR REPLACE VIEW public.v_events_parent_public AS
SELECT
    id,
    nombre,
    descripcion,
    biografia,
    organizer_id,
    estilos,
    ritmos_seleccionados,
    zonas,
    sede_general,
    ubicaciones,
    faq,
    media,
    created_at,
    updated_at
FROM public.events_parent;

-- 3. Recrear vista events_live (si existía)
CREATE OR REPLACE VIEW public.events_live AS
SELECT
    ep.id,
    ep.nombre,
    ep.descripcion,
    ep.biografia,
    ep.organizer_id,
    ep.estilos,
    ep.ritmos_seleccionados,
    ep.zonas,
    ep.sede_general,
    ep.ubicaciones,
    ep.faq,
    ep.media,
    ep.created_at,
    ep.updated_at
FROM public.events_parent ep;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver estructura completa actualizada
SELECT 
    column_name, 
    data_type, 
    udt_name, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'events_parent'
ORDER BY ordinal_position;

-- Ver datos de ejemplo
SELECT 
    id, 
    nombre,
    organizer_id,
    estilos,
    ritmos_seleccionados,
    zonas,
    created_at,
    updated_at
FROM public.events_parent
LIMIT 5;

-- Contar registros
SELECT COUNT(*) as total_eventos_parent FROM public.events_parent;

-- Verificar que la vista se recreó correctamente
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'v_events_parent_public'
ORDER BY ordinal_position;

-- Ver datos de la vista pública
SELECT COUNT(*) as total_eventos_publicos 
FROM public.v_events_parent_public;

-- Verificar que events_live se recreó correctamente
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'events_live'
ORDER BY ordinal_position;

-- Ver datos de events_live
SELECT COUNT(*) as total_eventos_live 
FROM public.events_live;

