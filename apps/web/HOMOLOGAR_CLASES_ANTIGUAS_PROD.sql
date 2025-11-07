-- ============================================================================
-- HOMOLOGAR TABLAS DE CLASES ANTIGUAS EN PRODUCCIÓN
-- ============================================================================
-- Corrige tipos de datos en tablas de clases antiguas
-- ============================================================================

BEGIN;

-- 1. Verificar si las tablas existen y se usan
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.tables t 
     WHERE t.table_name = tables.table_name) as existe
FROM (VALUES 
    ('classes_parent'),
    ('classes_session'),
    ('classes_live'),
    ('sessions_live')
) AS tables(table_name);

-- 2. OPCIÓN A: Homologar tipos (si las tablas se usan)
-- Descomenta si decides mantener estas tablas

-- -- Eliminar vistas dependientes
-- DROP VIEW IF EXISTS public.classes_live CASCADE;
-- DROP VIEW IF EXISTS public.sessions_live CASCADE;
-- DROP VIEW IF EXISTS public.v_classes_parent_with_owner CASCADE;

-- -- Cambiar tipos en classes_parent
-- ALTER TABLE public.classes_parent
-- ALTER COLUMN estilos TYPE integer[] USING estilos::integer[];

-- -- Cambiar tipos en classes_session
-- ALTER TABLE public.classes_session
-- ALTER COLUMN estilos TYPE integer[] USING estilos::integer[];

-- -- Recrear vistas con tipos correctos
-- -- (Aquí necesitarías las definiciones originales de las vistas)

-- 3. OPCIÓN B: Eliminar tablas antiguas (si NO se usan)
-- Descomenta SOLO si estás seguro de que no se usan

-- DROP VIEW IF EXISTS public.classes_live CASCADE;
-- DROP VIEW IF EXISTS public.sessions_live CASCADE;
-- DROP VIEW IF EXISTS public.v_classes_parent_with_owner CASCADE;
-- DROP TABLE IF EXISTS public.classes_session CASCADE;
-- DROP TABLE IF EXISTS public.classes_parent CASCADE;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver qué tablas de clases existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%class%' OR table_name LIKE '%session%')
ORDER BY table_name;

-- Ver tipos de estilos en todas las tablas
SELECT 
    table_name,
    column_name,
    udt_name,
    CASE WHEN udt_name = '_int4' THEN '✅' ELSE '❌' END as correcto
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'estilos'
ORDER BY table_name;

