-- Script para agregar columnas de cuenta bancaria a profiles_academy, profiles_teacher y profiles_organizer
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columnas a profiles_academy
ALTER TABLE public.profiles_academy
ADD COLUMN IF NOT EXISTS cuenta_bancaria JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles_academy.cuenta_bancaria IS 'Datos de cuenta bancaria: {banco, nombre, concepto, clabe, cuenta}';

-- 2. Agregar columnas a profiles_teacher
ALTER TABLE public.profiles_teacher
ADD COLUMN IF NOT EXISTS cuenta_bancaria JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles_teacher.cuenta_bancaria IS 'Datos de cuenta bancaria: {banco, nombre, concepto, clabe, cuenta}';

-- 3. Agregar columnas a profiles_organizer
ALTER TABLE public.profiles_organizer
ADD COLUMN IF NOT EXISTS cuenta_bancaria JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles_organizer.cuenta_bancaria IS 'Datos de cuenta bancaria: {banco, nombre, concepto, clabe, cuenta}';

-- Verificar que las columnas se agregaron correctamente
SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles_academy', 'profiles_teacher', 'profiles_organizer')
  AND column_name = 'cuenta_bancaria'
ORDER BY table_name;

