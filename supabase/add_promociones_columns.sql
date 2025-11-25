-- Añade la columna `promociones` a los perfiles de academia y maestro si aún no existe.
-- Ejecutar este script en el proyecto de Supabase (SQL Editor o CLI).

DO $$
BEGIN
  -- === profiles_academy.promociones ===
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles_academy'
      AND column_name  = 'promociones'
  ) THEN
    ALTER TABLE public.profiles_academy
      ADD COLUMN promociones jsonb DEFAULT '[]'::jsonb;

    -- Fuerza valor por defecto en registros existentes
    UPDATE public.profiles_academy
      SET promociones = '[]'::jsonb
      WHERE promociones IS NULL;
  ELSE
    -- Asegura default y que no haya NULLs si la columna ya existía.
    ALTER TABLE public.profiles_academy
      ALTER COLUMN promociones SET DEFAULT '[]'::jsonb;

    UPDATE public.profiles_academy
      SET promociones = '[]'::jsonb
      WHERE promociones IS NULL;
  END IF;

  -- === profiles_teacher.promociones ===
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles_teacher'
      AND column_name  = 'promociones'
  ) THEN
    ALTER TABLE public.profiles_teacher
      ADD COLUMN promociones jsonb DEFAULT '[]'::jsonb;

    UPDATE public.profiles_teacher
      SET promociones = '[]'::jsonb
      WHERE promociones IS NULL;
  ELSE
    ALTER TABLE public.profiles_teacher
      ALTER COLUMN promociones SET DEFAULT '[]'::jsonb;

    UPDATE public.profiles_teacher
      SET promociones = '[]'::jsonb
      WHERE promociones IS NULL;
  END IF;
END
$$;

-- Refresca la caché de PostgREST para que la API REST vea la nueva columna.
NOTIFY pgrst, 'reload schema';

