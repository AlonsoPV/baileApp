-- Agrega la columna 'djs' a events_date para describir los DJs presentes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events_date'
      AND column_name = 'djs'
  ) THEN
    ALTER TABLE public.events_date
    ADD COLUMN djs TEXT NULL;
    
    COMMENT ON COLUMN public.events_date.djs IS 
      'Texto libre para describir los DJs que estarán presentes en la fecha.';
  END IF;
END $$;


