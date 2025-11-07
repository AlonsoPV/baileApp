-- ============================================
-- FIX: Agregar columnas faltantes a events_date
-- ============================================

-- 1. Agregar columnas cronograma, costos, ubicaciones si no existen
ALTER TABLE public.events_date 
ADD COLUMN IF NOT EXISTS cronograma JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.events_date 
ADD COLUMN IF NOT EXISTS costos JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.events_date 
ADD COLUMN IF NOT EXISTS ubicaciones JSONB DEFAULT '[]'::jsonb;

-- 2. Verificar las columnas
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'events_date'
  AND column_name IN ('cronograma', 'costos', 'ubicaciones')
ORDER BY column_name;

-- 3. Ver un registro de ejemplo
SELECT 
  id,
  nombre,
  fecha,
  cronograma,
  costos,
  ubicaciones
FROM public.events_date
LIMIT 1;

