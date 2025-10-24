-- TEST_DATES_LOADING.sql
-- Script para simular la consulta que hace useDatesByParent

-- 1. Simular la consulta exacta que hace useDatesByParent para parent_id = 20
SELECT 
    'Simulación de useDatesByParent para parent_id=20' as info,
    id,
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
    estado_publicacion,
    created_at,
    updated_at
FROM public.events_date
WHERE parent_id = 20
ORDER BY fecha ASC;

-- 2. Simular la consulta exacta que hace useDatesByParent para parent_id = 9
SELECT 
    'Simulación de useDatesByParent para parent_id=9' as info,
    id,
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
    estado_publicacion,
    created_at,
    updated_at
FROM public.events_date
WHERE parent_id = 9
ORDER BY fecha ASC;

-- 3. Verificar si hay fechas con estado_publicacion = 'publicado'
SELECT 
    'Fechas publicadas por parent_id' as info,
    parent_id,
    COUNT(*) as total_publicadas
FROM public.events_date
WHERE estado_publicacion = 'publicado'
GROUP BY parent_id
ORDER BY parent_id;

-- 4. Verificar si hay fechas con estado_publicacion = 'borrador'
SELECT 
    'Fechas en borrador por parent_id' as info,
    parent_id,
    COUNT(*) as total_borrador
FROM public.events_date
WHERE estado_publicacion = 'borrador'
GROUP BY parent_id
ORDER BY parent_id;

-- 5. Verificar si hay fechas con nombre null o vacío
SELECT 
    'Fechas sin nombre por parent_id' as info,
    parent_id,
    COUNT(*) as total_sin_nombre
FROM public.events_date
WHERE nombre IS NULL OR TRIM(nombre) = ''
GROUP BY parent_id
ORDER BY parent_id;

-- 6. Verificar si hay fechas con nombre
SELECT 
    'Fechas con nombre por parent_id' as info,
    parent_id,
    COUNT(*) as total_con_nombre
FROM public.events_date
WHERE nombre IS NOT NULL AND TRIM(nombre) != ''
GROUP BY parent_id
ORDER BY parent_id;
