-- ============================================
-- TEST: Verificar función merge_profiles_organizer
-- ============================================

-- 1. Verificar si la función existe
SELECT 
  routine_name, 
  routine_type, 
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'merge_profiles_organizer' 
  AND routine_schema = 'public';

-- 2. Verificar parámetros de la función
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

-- 3. Verificar si existe la tabla profiles_organizer
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles_organizer' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar si existe la función jsonb_deep_merge
SELECT 
  routine_name, 
  routine_type, 
  data_type
FROM information_schema.routines 
WHERE routine_name = 'jsonb_deep_merge' 
  AND routine_schema = 'public';
