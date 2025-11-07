-- ============================================================================
-- HOMOLOGAR profiles_teacher EN PRODUCCIÓN CON STAGING
-- ============================================================================
-- Objetivo: Ajustar columnas para coincidir con staging
-- ============================================================================

BEGIN;

-- 1. Agregar updated_at si no existe
ALTER TABLE public.profiles_teacher
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Hacer user_id NULLABLE (staging lo tiene así)
ALTER TABLE public.profiles_teacher
ALTER COLUMN user_id DROP NOT NULL;

-- 3. Hacer nombre_publico NOT NULL (staging lo tiene así)
ALTER TABLE public.profiles_teacher
ALTER COLUMN nombre_publico SET NOT NULL;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver estructura completa
SELECT column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_teacher'
ORDER BY ordinal_position;

-- Ver datos
SELECT id, user_id, nombre_publico, created_at, updated_at
FROM public.profiles_teacher
LIMIT 5;

