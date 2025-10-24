-- DEBUG_EVENTS_DATE_STRUCTURE.sql
-- Script para verificar la estructura de la tabla events_date

-- 1. Verificar si la tabla events_date existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'events_date'
) as table_exists;

-- 2. Ver estructura de la tabla events_date
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'events_date'
ORDER BY ordinal_position;

-- 3. Ver todos los registros de events_date
SELECT 
    id,
    parent_id,
    nombre,
    fecha,
    hora_inicio,
    hora_fin,
    lugar,
    ciudad,
    estado_publicacion,
    created_at
FROM public.events_date
ORDER BY id DESC
LIMIT 10;

-- 4. Contar total de registros
SELECT COUNT(*) as total_dates FROM public.events_date;

-- 5. Verificar RLS en events_date
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'events_date';

-- 6. Ver políticas RLS de events_date
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'events_date';

-- 7. Verificar permisos del usuario actual
SELECT current_user, session_user;

-- 8. Probar consulta directa
SELECT 
    id,
    parent_id,
    nombre,
    fecha
FROM public.events_date
LIMIT 5;
