-- ============================================================================
-- DIAGNÓSTICO Y CORRECCIÓN DE user_roles EN PRODUCCIÓN
-- ============================================================================

-- 1. Ver estructura actual de user_roles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- 2. Ver datos actuales (si existen)
SELECT * FROM public.user_roles LIMIT 10;

-- 3. Ver si la tabla existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
) as table_exists;

