-- DEBUG_EVENTS_PARENT_STRUCTURE.sql
-- Script para diagnosticar la estructura de la tabla events_parent

-- 1. Verificar si la tabla events_parent existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'events_parent'
) as table_exists;

-- 2. Ver estructura de la tabla events_parent
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'events_parent'
ORDER BY ordinal_position;

-- 3. Ver todos los registros de events_parent
SELECT 
    id,
    organizer_id,
    nombre,
    descripcion,
    estado_aprobacion,
    created_at
FROM public.events_parent
ORDER BY id DESC
LIMIT 10;

-- 4. Contar total de registros
SELECT COUNT(*) as total_parents FROM public.events_parent;

-- 5. Verificar si existe el registro con ID 16
SELECT 
    id,
    organizer_id,
    nombre,
    descripcion,
    estado_aprobacion
FROM public.events_parent
WHERE id = 16;

-- 6. Verificar RLS en events_parent
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'events_parent';

-- 7. Ver políticas RLS de events_parent
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'events_parent';

-- 8. Verificar permisos del usuario actual
SELECT current_user, session_user;

-- 9. Probar consulta directa (esto debería funcionar si no hay problemas de RLS)
SELECT 
    id,
    organizer_id,
    nombre,
    descripcion
FROM public.events_parent
WHERE id = 16
LIMIT 1;
