-- Script para verificar si las fechas tienen nombres
-- y diagnosticar por qué no se muestran en las cards

-- 1. Verificar estructura de la tabla events_date
SELECT 
  'Estructura de events_date' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'events_date' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar fechas existentes y sus nombres
SELECT 
  'Fechas existentes' as info,
  id,
  parent_id,
  nombre,
  fecha,
  lugar,
  estado_publicacion,
  created_at
FROM events_date 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Contar fechas con y sin nombre
SELECT 
  'Estadísticas de nombres' as info,
  COUNT(*) as total_fechas,
  COUNT(nombre) as fechas_con_nombre,
  COUNT(*) - COUNT(nombre) as fechas_sin_nombre,
  COUNT(CASE WHEN nombre IS NOT NULL AND nombre != '' THEN 1 END) as fechas_con_nombre_no_vacio
FROM events_date;

-- 4. Verificar fechas recientes (últimas 24 horas)
SELECT 
  'Fechas recientes' as info,
  id,
  parent_id,
  nombre,
  fecha,
  lugar,
  estado_publicacion,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as horas_desde_creacion
FROM events_date 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 5. Verificar fechas por parent_id
SELECT 
  'Fechas por parent' as info,
  parent_id,
  COUNT(*) as total_fechas,
  COUNT(nombre) as fechas_con_nombre,
  MAX(created_at) as ultima_fecha_creada
FROM events_date 
GROUP BY parent_id
ORDER BY parent_id;
