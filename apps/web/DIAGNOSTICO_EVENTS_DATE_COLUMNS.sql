-- ============================================
-- DIAGNÓSTICO: Columnas de events_date
-- ============================================

-- 1. Ver todas las columnas de events_date
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'events_date'
ORDER BY ordinal_position;

-- 2. Ver un registro de ejemplo
SELECT *
FROM public.events_date
LIMIT 1;

-- 3. Verificar columnas específicas que se están solicitando
SELECT 
  column_name,
  CASE 
    WHEN column_name IN (
      'id', 'parent_id', 'nombre', 'biografia', 'fecha', 'hora_inicio', 'hora_fin', 
      'lugar', 'direccion', 'ciudad', 'zona', 'referencias', 'requisitos', 'estilos', 
      'ritmos_seleccionados', 'zonas', 'cronograma', 'costos', 'media', 'flyer_url', 
      'estado_publicacion', 'ubicaciones', 'created_at', 'updated_at'
    ) THEN '✅ Existe'
    ELSE '❌ No solicitada'
  END as estado
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'events_date'
ORDER BY ordinal_position;

-- 4. Buscar columnas que podrían estar causando el error
SELECT 
  'Columnas solicitadas que NO existen:' as mensaje,
  string_agg(col, ', ') as columnas_faltantes
FROM (
  SELECT unnest(ARRAY[
    'id', 'parent_id', 'nombre', 'biografia', 'fecha', 'hora_inicio', 'hora_fin', 
    'lugar', 'direccion', 'ciudad', 'zona', 'referencias', 'requisitos', 'estilos', 
    'ritmos_seleccionados', 'zonas', 'cronograma', 'costos', 'media', 'flyer_url', 
    'estado_publicacion', 'ubicaciones', 'created_at', 'updated_at'
  ]) as col
) requested
WHERE NOT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'events_date' 
    AND column_name = requested.col
);

