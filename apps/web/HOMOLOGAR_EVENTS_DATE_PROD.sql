-- ============================================================================
-- HOMOLOGAR events_date EN PRODUCCIÓN CON STAGING
-- ============================================================================
-- Objetivo: Alinear tipos de datos y constraints con staging
-- ============================================================================

BEGIN;

-- 0. Eliminar vistas que dependen de events_date
DROP VIEW IF EXISTS public.v_events_dates_public CASCADE;

-- 1. Cambiar tipo de columna 'zona' de bigint a integer
ALTER TABLE public.events_date
ALTER COLUMN zona TYPE integer USING zona::integer;

-- 2. Cambiar tipo de array 'estilos' de _int8 a _int4
ALTER TABLE public.events_date
ALTER COLUMN estilos TYPE integer[] USING estilos::integer[];

-- 3. Cambiar tipo de array 'zonas' de _int8 a _int4
ALTER TABLE public.events_date
ALTER COLUMN zonas TYPE integer[] USING zonas::integer[];

-- 4. Hacer 'ritmos_seleccionados' NULLABLE (staging lo tiene así)
ALTER TABLE public.events_date
ALTER COLUMN ritmos_seleccionados DROP NOT NULL;

-- 5. Hacer 'ubicaciones' NULLABLE (staging lo tiene así, aunque no existe allá)
-- Nota: En staging 'ubicaciones' no existe, pero en prod sí
-- La dejamos NULLABLE para que el frontend pueda funcionar sin ella
ALTER TABLE public.events_date
ALTER COLUMN ubicaciones DROP NOT NULL;

-- 6. Hacer 'rsvp_interesado_count' NULLABLE (staging lo tiene así)
ALTER TABLE public.events_date
ALTER COLUMN rsvp_interesado_count DROP NOT NULL;

-- 7. Recrear vista pública de events_date (si existía)
CREATE OR REPLACE VIEW public.v_events_dates_public AS
SELECT
    id,
    parent_id,
    nombre,
    biografia,
    fecha,
    hora_inicio,
    hora_fin,
    lugar,
    direccion,
    ciudad,
    zona,
    referencias,
    requisitos,
    estilos,
    ritmos_seleccionados,
    cronograma,
    costos,
    media,
    flyer_url,
    rsvp_interesado_count,
    created_at,
    updated_at,
    zonas,
    estado_publicacion
FROM public.events_date
WHERE estado_publicacion = 'publicado';

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
  AND table_name = 'events_date'
ORDER BY ordinal_position;

-- Ver datos de ejemplo
SELECT 
    id, 
    parent_id, 
    nombre, 
    fecha,
    zona,
    estilos,
    zonas,
    ritmos_seleccionados,
    ubicaciones IS NULL as ubicaciones_null,
    rsvp_interesado_count
FROM public.events_date
LIMIT 5;

-- Contar registros
SELECT COUNT(*) as total_fechas FROM public.events_date;

-- Verificar que la vista se recreó correctamente
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'v_events_dates_public'
ORDER BY ordinal_position;

-- Ver datos de la vista pública
SELECT COUNT(*) as total_fechas_publicas 
FROM public.v_events_dates_public;

