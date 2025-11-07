-- ============================================================================
-- HOMOLOGAR profiles_brand EN PRODUCCIÓN CON STAGING
-- ============================================================================
-- Objetivo: Hacer que size_guide, fit_tips, policies, conversion sean NULLABLE
-- en producción para coincidir con staging
-- ============================================================================

BEGIN;

-- Hacer las columnas NULLABLE (permitir NULL)
ALTER TABLE public.profiles_brand
ALTER COLUMN size_guide DROP NOT NULL;

ALTER TABLE public.profiles_brand
ALTER COLUMN fit_tips DROP NOT NULL;

ALTER TABLE public.profiles_brand
ALTER COLUMN policies DROP NOT NULL;

ALTER TABLE public.profiles_brand
ALTER COLUMN conversion DROP NOT NULL;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- 1. Verificar que las columnas ahora son NULLABLE
SELECT column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_brand'
  AND column_name IN ('size_guide', 'fit_tips', 'policies', 'conversion')
ORDER BY ordinal_position;

-- 2. Ver estructura completa de profiles_brand
SELECT column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_brand'
ORDER BY ordinal_position;

-- 3. Ver datos actuales
SELECT id, user_id, nombre_publico, 
       size_guide IS NULL as sg_null,
       fit_tips IS NULL as ft_null,
       policies IS NULL as pol_null,
       conversion IS NULL as conv_null
FROM public.profiles_brand
LIMIT 5;

