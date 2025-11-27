-- Script para agregar columna 'respuestas' a profiles_academy
-- La columna respuestas almacena datos como dato_curioso, ver_mas_link, etc.
-- Ejecutar en Supabase SQL Editor

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_academy' 
    AND column_name = 'respuestas'
  ) THEN
    ALTER TABLE public.profiles_academy
    ADD COLUMN respuestas JSONB DEFAULT '{}'::jsonb;
    
    COMMENT ON COLUMN public.profiles_academy.respuestas IS 'Respuestas del perfil de academia. Objeto JSONB con campos como dato_curioso, ver_mas_link, gusta_bailar, redes, etc.';
    
    RAISE NOTICE '✅ Columna respuestas agregada a profiles_academy';
  ELSE
    RAISE NOTICE '⏭️  Columna respuestas ya existe en profiles_academy';
  END IF;
END $$;

-- Verificar que la columna se agregó correctamente
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_academy'
  AND column_name = 'respuestas';

