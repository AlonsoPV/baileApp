-- ============================================
-- FIX: Estado de Aprobación en Brand y Teacher
-- ============================================

-- 1. Verificar columna estado_aprobacion en profiles_brand
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles_brand' 
      AND column_name = 'estado_aprobacion'
  ) THEN
    ALTER TABLE public.profiles_brand 
    ADD COLUMN estado_aprobacion TEXT DEFAULT 'borrador';
    
    RAISE NOTICE '✅ Columna estado_aprobacion agregada a profiles_brand';
  ELSE
    RAISE NOTICE '✅ Columna estado_aprobacion ya existe en profiles_brand';
  END IF;
END $$;

-- 2. Verificar columna estado_aprobacion en profiles_teacher
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles_teacher' 
      AND column_name = 'estado_aprobacion'
  ) THEN
    ALTER TABLE public.profiles_teacher 
    ADD COLUMN estado_aprobacion TEXT DEFAULT 'borrador';
    
    RAISE NOTICE '✅ Columna estado_aprobacion agregada a profiles_teacher';
  ELSE
    RAISE NOTICE '✅ Columna estado_aprobacion ya existe en profiles_teacher';
  END IF;
END $$;

-- 3. Actualizar perfiles existentes a 'aprobado' si tienen contenido
UPDATE public.profiles_brand
SET estado_aprobacion = 'aprobado'
WHERE nombre_publico IS NOT NULL 
  AND nombre_publico != ''
  AND (estado_aprobacion IS NULL OR estado_aprobacion = 'borrador');

UPDATE public.profiles_teacher
SET estado_aprobacion = 'aprobado'
WHERE nombre_publico IS NOT NULL 
  AND nombre_publico != ''
  AND (estado_aprobacion IS NULL OR estado_aprobacion = 'borrador');

-- 4. Verificar resultados
SELECT 
  'profiles_brand' as tabla,
  id,
  nombre_publico,
  estado_aprobacion,
  updated_at
FROM public.profiles_brand
ORDER BY updated_at DESC
LIMIT 3;

SELECT 
  'profiles_teacher' as tabla,
  id,
  nombre_publico,
  estado_aprobacion,
  updated_at
FROM public.profiles_teacher
ORDER BY updated_at DESC
LIMIT 3;

-- 5. Verificar estructura de columnas
SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles_brand', 'profiles_teacher')
  AND column_name = 'estado_aprobacion';

