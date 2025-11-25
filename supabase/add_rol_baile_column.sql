-- ========================================
-- 🎭 AÑADIR CAMPO "Como te identificas" (rol_baile)
-- ========================================
-- Añade la columna rol_baile a profiles_user para identificar si el usuario
-- se identifica como lead, follow o ambos

-- 1. Añadir columna rol_baile a profiles_user
ALTER TABLE public.profiles_user
ADD COLUMN IF NOT EXISTS rol_baile TEXT 
CHECK (rol_baile IS NULL OR rol_baile IN ('lead', 'follow', 'ambos'));

-- 2. Añadir comentario a la columna
COMMENT ON COLUMN public.profiles_user.rol_baile IS 
'Rol de baile del usuario: lead (guía), follow (seguidor), ambos (puede hacer ambos roles)';

-- 3. Verificar que la columna se creó correctamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_user'
  AND column_name = 'rol_baile';

-- 4. Verificar constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles_user'::regclass
  AND conname LIKE '%rol_baile%';

-- 5. Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Columna rol_baile añadida exitosamente a profiles_user';
  RAISE NOTICE '📋 Valores permitidos: lead, follow, ambos';
END $$;

