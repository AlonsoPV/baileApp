-- TEST_INSERT_DATE.sql
-- Script para probar la inserción de una fecha de prueba

-- 1. Verificar que existe al menos un events_parent
SELECT 
    'Verificando events_parent' as info,
    COUNT(*) as total_parents,
    MIN(id) as min_id,
    MAX(id) as max_id
FROM public.events_parent;

-- 2. Mostrar algunos events_parent disponibles
SELECT 
    id,
    nombre,
    organizer_id,
    created_at
FROM public.events_parent
ORDER BY created_at DESC
LIMIT 5;

-- 3. Insertar una fecha de prueba
INSERT INTO public.events_date (
    parent_id,
    nombre,
    biografia,
    fecha,
    hora_inicio,
    hora_fin,
    lugar,
    direccion,
    ciudad,
    zona,
    referencias,
    requisitos,
    estilos,
    zonas,
    cronograma,
    costos,
    media,
    estado_publicacion
) VALUES (
    (SELECT id FROM public.events_parent LIMIT 1),
    'Fecha de Prueba - Test',
    'Esta es una fecha de prueba para verificar que la inserción funciona',
    '2025-01-15',
    '18:00:00',
    '02:00:00',
    'Lugar de Prueba',
    'Dirección de Prueba 123',
    'Ciudad de Prueba',
    1,
    'Referencias de prueba',
    'Requisitos de prueba',
    ARRAY[1, 2],
    ARRAY[1, 2],
    '[{"hora": "18:00", "actividad": "Inicio"}]'::jsonb,
    '[{"tipo": "general", "precio": 100}]'::jsonb,
    '[]'::jsonb,
    'borrador'
);

-- 4. Verificar que la fecha se insertó correctamente
SELECT 
    'Verificación de inserción' as info,
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
WHERE nombre = 'Fecha de Prueba - Test';

-- 5. Mostrar todas las fechas del parent_id utilizado
SELECT 
    'Fechas del parent_id utilizado' as info,
    id,
    parent_id,
    nombre,
    fecha,
    estado_publicacion,
    created_at
FROM public.events_date
WHERE parent_id = (SELECT id FROM public.events_parent LIMIT 1)
ORDER BY created_at DESC;

-- 6. Limpiar la fecha de prueba (descomentar para usar)
/*
DELETE FROM public.events_date 
WHERE nombre = 'Fecha de Prueba - Test';
*/
