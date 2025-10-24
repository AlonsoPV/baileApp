-- TEST_DATES_SAVING.sql
-- Script para probar si las fechas se están guardando correctamente

-- 1. Ver todos los registros de events_date con información completa
SELECT 
    id,
    parent_id,
    nombre,
    biografia,
    fecha,
    hora_inicio,
    hora_fin,
    lugar,
    ciudad,
    estado_publicacion,
    created_at,
    updated_at
FROM public.events_date
ORDER BY created_at DESC;

-- 2. Verificar la relación con events_parent
SELECT 
    ed.id as date_id,
    ed.parent_id,
    ed.nombre as date_nombre,
    ed.fecha,
    ep.id as parent_id_check,
    ep.nombre as parent_nombre,
    ep.organizer_id
FROM public.events_date ed
LEFT JOIN public.events_parent ep ON ed.parent_id = ep.id
ORDER BY ed.created_at DESC;

-- 3. Contar fechas por social padre
SELECT 
    parent_id,
    COUNT(*) as total_fechas,
    COUNT(CASE WHEN nombre IS NOT NULL AND TRIM(nombre) != '' THEN 1 END) as fechas_con_nombre,
    COUNT(CASE WHEN nombre IS NULL OR TRIM(nombre) = '' THEN 1 END) as fechas_sin_nombre
FROM public.events_date
GROUP BY parent_id
ORDER BY parent_id;

-- 4. Verificar si hay fechas recientes (últimas 24 horas)
SELECT 
    id,
    parent_id,
    nombre,
    fecha,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as horas_desde_creacion
FROM public.events_date
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 5. Probar inserción de una fecha de prueba (descomentar para usar)
/*
INSERT INTO public.events_date (
    parent_id,
    nombre,
    fecha,
    hora_inicio,
    lugar,
    ciudad,
    estado_publicacion
) VALUES (
    (SELECT id FROM public.events_parent LIMIT 1),
    'Fecha de Prueba',
    '2025-01-01',
    '18:00:00',
    'Lugar de Prueba',
    'Ciudad de Prueba',
    'borrador'
);
*/

-- 6. Verificar políticas RLS para el usuario actual
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'events_date'
ORDER BY policyname;
