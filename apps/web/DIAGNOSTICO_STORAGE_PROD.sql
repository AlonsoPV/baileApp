-- ============================================================================
-- DIAGNÓSTICO DE STORAGE EN PRODUCCIÓN
-- ============================================================================

-- 1. Ver si existe el esquema storage
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'storage';

-- 2. Ver todas las tablas en el esquema storage (si existe)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'storage'
ORDER BY table_name;

-- 3. Ver si existe la tabla storage.buckets
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'storage' 
    AND table_name = 'buckets'
) as tabla_buckets_existe;

-- 4. Ver si existe la tabla storage.objects
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'storage' 
    AND table_name = 'objects'
) as tabla_objects_existe;

-- 5. Intentar ver buckets (si la tabla existe)
-- Si esto falla, significa que no tienes acceso al esquema storage
SELECT * FROM storage.buckets LIMIT 5;

-- 6. Ver políticas RLS en storage.objects (método alternativo)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

