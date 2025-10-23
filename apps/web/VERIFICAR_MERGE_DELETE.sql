-- Script para verificar que la función jsonb_deep_merge_delete funciona correctamente
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que la función existe
SELECT 
  routine_name, 
  routine_type, 
  data_type
FROM information_schema.routines 
WHERE routine_name = 'jsonb_deep_merge_delete';

-- 2. Probar la función con datos de prueba
DO $$
DECLARE
  test_a jsonb := '{"instagram": "ejemplo", "tiktok": "alonso", "youtube": "alonso", "facebook": "ejemploejemploejemplo", "whatsapp": "+525511981149"}';
  test_b jsonb := '{"tiktok": "", "youtube": "", "facebook": ""}';
  result jsonb;
BEGIN
  result := jsonb_deep_merge_delete(test_a, test_b);
  
  RAISE NOTICE 'Test A (original): %', test_a;
  RAISE NOTICE 'Test B (patch con vacíos): %', test_b;
  RAISE NOTICE 'Resultado (debería eliminar tiktok, youtube, facebook): %', result;
  
  -- Verificar que las claves vacías se eliminaron
  IF result ? 'tiktok' OR result ? 'youtube' OR result ? 'facebook' THEN
    RAISE NOTICE '❌ ERROR: Las claves vacías NO se eliminaron correctamente';
  ELSE
    RAISE NOTICE '✅ SUCCESS: Las claves vacías se eliminaron correctamente';
  END IF;
END $$;

-- 3. Verificar que merge_profiles_user usa la función correcta
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'merge_profiles_user'
AND routine_definition LIKE '%jsonb_deep_merge_delete%';

-- 4. Probar la función merge_profiles_user con datos reales
DO $$
DECLARE
  test_user_id uuid := '0c20805f-519c-4e8e-9081-341ab64e504d';
  test_patch jsonb := '{"redes_sociales": {"tiktok": "", "youtube": "", "facebook": ""}}';
  result jsonb;
BEGIN
  -- Simular la llamada a merge_profiles_user
  SELECT jsonb_deep_merge_delete(
    (SELECT redes_sociales FROM profiles_user WHERE user_id = test_user_id),
    test_patch->'redes_sociales'
  ) INTO result;
  
  RAISE NOTICE 'Patch enviado: %', test_patch;
  RAISE NOTICE 'Resultado del merge: %', result;
END $$;
