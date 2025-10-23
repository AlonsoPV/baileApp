-- ============================================
-- TEST: Verificar que la función funciona
-- ============================================

-- 1. Verificar que la función existe
SELECT 
  routine_name, 
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'merge_profiles_organizer' 
  AND routine_schema = 'public';

-- 2. Verificar parámetros
SELECT 
  parameter_name,
  parameter_mode,
  data_type,
  ordinal_position
FROM information_schema.parameters 
WHERE specific_name = (
  SELECT specific_name 
  FROM information_schema.routines 
  WHERE routine_name = 'merge_profiles_organizer' 
    AND routine_schema = 'public'
);

-- 3. Verificar estructura de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles_organizer' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Test de la función (solo si hay datos)
DO $$
DECLARE
  test_org_id bigint;
  test_user_id uuid;
BEGIN
  -- Buscar un organizador existente para probar
  SELECT id, user_id INTO test_org_id, test_user_id 
  FROM public.profiles_organizer 
  LIMIT 1;
  
  IF test_org_id IS NOT NULL THEN
    RAISE NOTICE '✅ Encontrado organizador ID: %', test_org_id;
    RAISE NOTICE '✅ Usuario: %', test_user_id;
    
    -- Test con patch vacío
    BEGIN
      PERFORM public.merge_profiles_organizer(
        test_org_id, 
        test_user_id, 
        '{}'::jsonb
      );
      RAISE NOTICE '✅ Test de función exitoso';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Error en test: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '⚠️ No hay organizadores para probar';
  END IF;
END $$;
