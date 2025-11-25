-- Asegura columnas ciudad y zona_id en organizer_locations (entornos ya creados)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizer_locations'
      AND column_name = 'ciudad'
  ) THEN
    -- ya existe
    NULL;
  ELSE
    ALTER TABLE public.organizer_locations
      ADD COLUMN ciudad TEXT;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizer_locations'
      AND column_name = 'zona_id'
  ) THEN
    NULL;
  ELSE
    ALTER TABLE public.organizer_locations
      ADD COLUMN zona_id INT;
  END IF;
END $$;


