-- Script de prueba para verificar el campo 'nombre' en events_date

-- 1. Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events_date' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Mostrar todos los registros actuales
SELECT id, parent_id, nombre, fecha, hora_inicio, lugar, ciudad, created_at
FROM public.events_date 
ORDER BY created_at DESC;

-- 3. Actualizar registros existentes sin nombre (opcional)
-- Descomenta las siguientes líneas si quieres agregar nombres de prueba
/*
UPDATE public.events_date 
SET nombre = 'Fecha ' || id || ' - ' || TO_CHAR(fecha, 'DD/MM/YYYY')
WHERE nombre IS NULL OR nombre = '';

-- Verificar los cambios
SELECT id, parent_id, nombre, fecha, hora_inicio, lugar, ciudad
FROM public.events_date 
WHERE nombre IS NOT NULL AND nombre != '';
*/

-- 4. Crear un registro de prueba (opcional)
-- Descomenta las siguientes líneas si quieres crear una fecha de prueba
/*
INSERT INTO public.events_date (
    parent_id, 
    nombre, 
    fecha, 
    hora_inicio, 
    hora_fin, 
    lugar, 
    ciudad, 
    estado_publicacion
) VALUES (
    1, -- Cambia por un parent_id existente
    'Fecha de Prueba',
    '2024-12-25',
    '20:00',
    '23:00',
    'Sala de Baile Central',
    'Ciudad de Prueba',
    'publicado'
);

-- Verificar el registro creado
SELECT id, parent_id, nombre, fecha, hora_inicio, lugar, ciudad
FROM public.events_date 
WHERE nombre = 'Fecha de Prueba';
*/

-- 5. Estadísticas de nombres
SELECT 
    COUNT(*) as total_fechas,
    COUNT(nombre) as fechas_con_nombre,
    COUNT(*) - COUNT(nombre) as fechas_sin_nombre,
    ROUND((COUNT(nombre)::float / COUNT(*)) * 100, 2) as porcentaje_con_nombre
FROM public.events_date;
