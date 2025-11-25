-- Agrega la columna 'dia_semana' a events_date para fechas recurrentes
-- dia_semana: 0=Domingo, 1=Lunes, ..., 6=Sábado
-- NULL = fecha específica (no recurrente)
-- NOT NULL = fecha fija que se repite semanalmente en ese día
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events_date'
      AND column_name = 'dia_semana'
  ) THEN
    ALTER TABLE public.events_date
    ADD COLUMN dia_semana INTEGER NULL;
    
    COMMENT ON COLUMN public.events_date.dia_semana IS 
      'Día de la semana para fechas recurrentes: 0=Domingo, 1=Lunes, ..., 6=Sábado. NULL = fecha específica (no recurrente)';
  END IF;
END $$;

-- Índice opcional para búsquedas por día de la semana
CREATE INDEX IF NOT EXISTS events_date_dia_semana_idx
ON public.events_date (dia_semana)
WHERE dia_semana IS NOT NULL;

