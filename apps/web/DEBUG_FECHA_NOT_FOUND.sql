-- DEBUG_FECHA_NOT_FOUND.sql
-- Script para diagnosticar por qué no se encuentra la fecha

-- 1. Verificar estructura de la tabla events_date
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'events_date'
ORDER BY ordinal_position;

-- 2. Ver todas las fechas existentes
SELECT 
    id,
    parent_id,
    nombre,
    fecha,
    hora_inicio,
    lugar,
    ciudad,
    estado_publicacion,
    created_at
FROM public.events_date
ORDER BY id DESC
LIMIT 10;

-- 3. Contar total de fechas
SELECT COUNT(*) as total_fechas FROM public.events_date;

-- 4. Verificar si existe la fecha con ID específico (cambiar el ID según sea necesario)
SELECT 
    id,
    parent_id,
    nombre,
    fecha,
    hora_inicio,
    lugar,
    ciudad,
    estado_publicacion
FROM public.events_date
WHERE id = 7; -- Cambiar este ID por el que estás intentando acceder

-- 5. Verificar RLS (Row Level Security) en events_date
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

-- 8. Probar consulta directa (esto debería funcionar si no hay problemas de RLS)
SELECT 
    id,
    parent_id,
    nombre,
    fecha,
    estado_publicacion
FROM public.events_date
WHERE id = 7
LIMIT 1;
