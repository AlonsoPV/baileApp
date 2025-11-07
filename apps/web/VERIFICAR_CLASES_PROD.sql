-- ============================================================================
-- VERIFICAR TABLAS DE CLASES EN PRODUCCIÓN Y STAGING
-- ============================================================================

-- 1. Ver si existe la tabla academy_classes
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'academy_classes'
) as tabla_academy_classes_existe;

-- 2. Ver si existe la tabla teacher_classes
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'teacher_classes'
) as tabla_teacher_classes_existe;

-- 3. Ver si existe la tabla classes (genérica)
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'classes'
) as tabla_classes_existe;

-- 4. Listar todas las tablas relacionadas con clases
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%class%'
ORDER BY table_name;

-- 5. Ver estructura de academy_classes (si existe)
SELECT column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'academy_classes'
ORDER BY ordinal_position;

-- 6. Ver estructura de teacher_classes (si existe)
SELECT column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'teacher_classes'
ORDER BY ordinal_position;

-- 7. Ver vistas relacionadas con clases
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE '%class%'
ORDER BY table_name;

