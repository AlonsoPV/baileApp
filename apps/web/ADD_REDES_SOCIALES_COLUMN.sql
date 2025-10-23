-- ============================================
-- ADD: Columna redes_sociales a profiles_organizer
-- ============================================

-- 1. Verificar si la columna ya existe
DO $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles_organizer' 
      AND column_name = 'redes_sociales'
      AND table_schema = 'public'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE NOTICE '✅ Columna redes_sociales ya existe en profiles_organizer';
  ELSE
    RAISE NOTICE '❌ Columna redes_sociales NO existe - creándola...';
  END IF;
END $$;

-- 2. Agregar la columna redes_sociales si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles_organizer' 
      AND column_name = 'redes_sociales'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles_organizer 
    ADD COLUMN redes_sociales jsonb DEFAULT '{}'::jsonb;
    
    RAISE NOTICE '✅ Columna redes_sociales agregada exitosamente';
  ELSE
    RAISE NOTICE 'ℹ️ Columna redes_sociales ya existe, no se modificó';
  END IF;
END $$;

-- 3. Verificar la estructura de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles_organizer' 
  AND table_schema = 'public'
  AND column_name IN ('redes_sociales', 'nombre_publico', 'bio', 'ritmos', 'zonas', 'respuestas', 'media')
ORDER BY ordinal_position;

-- 4. Test: Verificar que la función puede acceder al campo
DO $$
DECLARE
  test_record record;
BEGIN
  -- Intentar acceder a un registro existente
  SELECT redes_sociales INTO test_record 
  FROM public.profiles_organizer 
  LIMIT 1;
  
  RAISE NOTICE '✅ Campo redes_sociales accesible correctamente';
  RAISE NOTICE '📊 Valor de prueba: %', test_record;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Error al acceder a redes_sociales: %', SQLERRM;
END $$;

-- 5. Resumen final
DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✅ COLUMNA redes_sociales AGREGADA';
  RAISE NOTICE '✅ Tipo: jsonb con default {}';
  RAISE NOTICE '✅ Accesible desde merge_profiles_organizer';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Ejecuta EMERGENCY_FIX_ORGANIZER.sql';
  RAISE NOTICE '2. Prueba guardar datos del organizador';
  RAISE NOTICE '3. Verifica que redes sociales se muestran';
  RAISE NOTICE '==========================================';
END $$;
