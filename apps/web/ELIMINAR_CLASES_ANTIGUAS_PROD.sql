-- ============================================================================
-- ELIMINAR TABLAS DE CLASES ANTIGUAS EN PRODUCCIÓN
-- ============================================================================
-- IMPORTANTE: Solo ejecuta esto si confirmaste que no se usan
-- ============================================================================

BEGIN;

-- 1. Ver datos actuales (para backup mental)
SELECT 'classes_parent' as tabla, COUNT(*) as registros FROM public.classes_parent
UNION ALL
SELECT 'classes_session', COUNT(*) FROM public.classes_session;

-- 2. Eliminar vistas dependientes primero
DROP VIEW IF EXISTS public.classes_live CASCADE;
DROP VIEW IF EXISTS public.sessions_live CASCADE;
DROP VIEW IF EXISTS public.v_classes_parent_with_owner CASCADE;

-- 3. Eliminar tablas
DROP TABLE IF EXISTS public.classes_session CASCADE;
DROP TABLE IF EXISTS public.classes_parent CASCADE;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver que solo quedan las tablas nuevas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%class%'
ORDER BY table_name;
-- Debe mostrar solo: academy_classes, teacher_classes

-- Verificar tipos de estilos (todos deben ser _int4)
SELECT 
    table_name,
    column_name,
    udt_name,
    CASE WHEN udt_name = '_int4' THEN '✅' ELSE '❌' END as correcto
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'estilos'
ORDER BY table_name;
-- Todos deben tener ✅

