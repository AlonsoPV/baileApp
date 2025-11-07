-- ============================================================================
-- HOMOLOGAR profiles_organizer EN PRODUCCIÓN CON STAGING
-- ============================================================================
-- Objetivo: Ajustar columnas para coincidir con staging
-- IMPORTANTE: Este script elimina la columna 'respuestas' y sus dependencias
-- ============================================================================

BEGIN;

-- 1. Agregar columnas faltantes
ALTER TABLE public.profiles_organizer
ADD COLUMN IF NOT EXISTS faq jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles_organizer
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.profiles_organizer
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Eliminar vista que depende de 'respuestas' (si existe)
DROP VIEW IF EXISTS public.v_organizers_public CASCADE;

-- 3. Eliminar columna 'respuestas' (si existe)
ALTER TABLE public.profiles_organizer
DROP COLUMN IF EXISTS respuestas CASCADE;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver estructura completa
SELECT column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_organizer'
ORDER BY ordinal_position;

-- Ver datos
SELECT id, user_id, nombre_publico, 
       faq IS NOT NULL as tiene_faq,
       created_at, updated_at
FROM public.profiles_organizer
LIMIT 5;

