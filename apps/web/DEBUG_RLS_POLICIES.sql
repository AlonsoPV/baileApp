-- DEBUG_RLS_POLICIES.sql
-- Script para verificar si las políticas RLS están bloqueando las consultas

-- 1. Verificar el usuario actual y su rol
SELECT 
    'Información del usuario' as info,
    current_user,
    session_user,
    auth.uid() as user_id,
    auth.role() as user_role;

-- 2. Verificar si RLS está habilitado en events_date
SELECT 
    'Estado de RLS en events_date' as info,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'events_date';

-- 3. Ver todas las políticas de events_date
SELECT 
    'Políticas de events_date' as info,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'events_date'
ORDER BY policyname;

-- 4. Probar consulta directa sin RLS (como superusuario)
SELECT 
    'Consulta directa sin RLS' as info,
    COUNT(*) as total_fechas
FROM public.events_date;

-- 5. Probar consulta con filtro por parent_id
SELECT 
    'Consulta con filtro parent_id=20' as info,
    id,
    parent_id,
    nombre,
    fecha,
    estado_publicacion
FROM public.events_date
WHERE parent_id = 20;

-- 6. Probar consulta con filtro por parent_id=9
SELECT 
    'Consulta con filtro parent_id=9' as info,
    id,
    parent_id,
    nombre,
    fecha,
    estado_publicacion
FROM public.events_date
WHERE parent_id = 9;

-- 7. Verificar si hay problemas con la autenticación
-- (Esto requiere que el usuario esté autenticado en la aplicación)
SELECT 
    'Verificación de autenticación' as info,
    auth.uid() as current_user_id,
    auth.role() as current_role,
    CASE 
        WHEN auth.uid() IS NULL THEN 'Usuario no autenticado'
        ELSE 'Usuario autenticado'
    END as auth_status;

-- 8. Probar consulta con diferentes filtros de estado
SELECT 
    'Consulta por estado_publicacion' as info,
    estado_publicacion,
    COUNT(*) as cantidad
FROM public.events_date
GROUP BY estado_publicacion;

-- 9. Verificar si hay problemas con las políticas específicas
-- Probar si las políticas están funcionando correctamente
SELECT 
    'Prueba de políticas RLS' as info,
    id,
    parent_id,
    nombre,
    estado_publicacion
FROM public.events_date
WHERE estado_publicacion = 'publicado'
ORDER BY created_at DESC;
