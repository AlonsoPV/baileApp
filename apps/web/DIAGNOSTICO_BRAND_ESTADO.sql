-- ============================================
-- DIAGNÓSTICO: Estado de Aprobación en Brand
-- ============================================

-- 1. Verificar columnas de profiles_brand
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_brand'
ORDER BY ordinal_position;

-- 2. Verificar datos actuales
SELECT 
  id,
  user_id,
  nombre_publico,
  estado_aprobacion,
  created_at,
  updated_at
FROM public.profiles_brand
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar tipo ENUM si existe
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%estado%'
ORDER BY t.typname, e.enumsortorder;

