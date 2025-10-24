-- DEBUG_DATES_NOT_SAVING.sql
-- Script específico para diagnosticar por qué las fechas no se están guardando

-- 1. Verificar el estado actual de events_date
SELECT 
    'Estado actual de events_date' as info,
    COUNT(*) as total_fechas,
    COUNT(CASE WHEN estado_publicacion = 'publicado' THEN 1 END) as fechas_publicadas,
    COUNT(CASE WHEN estado_publicacion = 'borrador' THEN 1 END) as fechas_borrador,
    COUNT(CASE WHEN nombre IS NOT NULL AND TRIM(nombre) != '' THEN 1 END) as fechas_con_nombre,
    COUNT(CASE WHEN nombre IS NULL OR TRIM(nombre) = '' THEN 1 END) as fechas_sin_nombre
FROM public.events_date;

-- 2. Ver todas las fechas con información detallada
SELECT 
    id,
    parent_id,
    nombre,
    fecha,
    hora_inicio,
    lugar,
    ciudad,
    estado_publicacion,
    created_at,
    updated_at
FROM public.events_date
ORDER BY created_at DESC;

-- 3. Verificar la relación con events_parent
SELECT 
    ed.id as date_id,
    ed.parent_id,
    ed.nombre as date_nombre,
    ed.fecha,
    ed.estado_publicacion,
    ep.id as parent_id_check,
    ep.nombre as parent_nombre,
    ep.organizer_id,
    po.user_id as organizer_user_id
FROM public.events_date ed
LEFT JOIN public.events_parent ep ON ed.parent_id = ep.id
LEFT JOIN public.profiles_organizer po ON ep.organizer_id = po.id
ORDER BY ed.created_at DESC;

-- 4. Verificar si hay fechas recientes (últimas 2 horas)
SELECT 
    'Fechas recientes' as info,
    id,
    parent_id,
    nombre,
    fecha,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as horas_desde_creacion
FROM public.events_date
WHERE created_at > NOW() - INTERVAL '2 hours'
ORDER BY created_at DESC;

-- 5. Contar fechas por social padre
SELECT 
    parent_id,
    COUNT(*) as total_fechas,
    COUNT(CASE WHEN estado_publicacion = 'publicado' THEN 1 END) as fechas_publicadas,
    COUNT(CASE WHEN estado_publicacion = 'borrador' THEN 1 END) as fechas_borrador,
    MAX(created_at) as ultima_fecha_creada
FROM public.events_date
GROUP BY parent_id
ORDER BY parent_id;

-- 6. Verificar si hay problemas con las políticas RLS
-- (Esto requiere que el usuario esté autenticado)
SELECT 
    'Verificación de políticas RLS' as info,
    current_user,
    session_user,
    auth.uid() as current_user_id;

-- 7. Probar una consulta simple para verificar permisos
SELECT 
    'Prueba de consulta simple' as info,
    COUNT(*) as fechas_visibles
FROM public.events_date;

-- 8. Verificar si hay fechas con parent_id NULL o inválido
SELECT 
    'Fechas con parent_id problemático' as info,
    id,
    parent_id,
    nombre,
    fecha,
    created_at
FROM public.events_date
WHERE parent_id IS NULL 
   OR parent_id NOT IN (SELECT id FROM public.events_parent)
ORDER BY created_at DESC;

-- 9. Verificar la estructura de events_parent
SELECT 
    'Estructura de events_parent' as info,
    id,
    nombre,
    organizer_id,
    created_at
FROM public.events_parent
ORDER BY created_at DESC
LIMIT 5;

-- 10. Verificar si hay problemas con el usuario actual
SELECT 
    'Información del usuario actual' as info,
    auth.uid() as user_id,
    auth.role() as user_role,
    current_user,
    session_user;
