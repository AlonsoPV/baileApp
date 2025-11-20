-- Script para agregar columna 'reseñas' a profiles_academy y profiles_teacher
-- Las reseñas se almacenan como JSONB con estructura:
-- [
--   {
--     "author": "Nombre del alumno",
--     "location": "Ciudad / zona (opcional)",
--     "rating": 5,
--     "text": "Comentario del alumno"
--   }
-- ]

-- Agregar columna 'reseñas' a profiles_academy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_academy' 
    AND column_name = 'reseñas'
  ) THEN
    ALTER TABLE public.profiles_academy
    ADD COLUMN reseñas JSONB DEFAULT '[]'::jsonb;
    
    COMMENT ON COLUMN public.profiles_academy.reseñas IS 'Reseñas de alumnos de la academia. Array de objetos con author, location (opcional), rating (1-5), y text.';
  END IF;
END $$;

-- Agregar columna 'reseñas' a profiles_teacher
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_teacher' 
    AND column_name = 'reseñas'
  ) THEN
    ALTER TABLE public.profiles_teacher
    ADD COLUMN reseñas JSONB DEFAULT '[]'::jsonb;
    
    COMMENT ON COLUMN public.profiles_teacher.reseñas IS 'Reseñas de alumnos del maestro. Array de objetos con author, location (opcional), rating (1-5), y text.';
  END IF;
END $$;

-- Verificar que las columnas se agregaron correctamente
SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles_academy', 'profiles_teacher')
  AND column_name = 'reseñas'
ORDER BY table_name;

