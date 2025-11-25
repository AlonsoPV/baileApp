-- Agrega la columna 'ubicaciones' a events_parent si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events_parent'
      AND column_name = 'ubicaciones'
  ) THEN
    ALTER TABLE public.events_parent
    ADD COLUMN ubicaciones jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Índice GIN opcional para búsquedas por contenido en ubicaciones
CREATE INDEX IF NOT EXISTS events_parent_ubicaciones_gin
ON public.events_parent
USING GIN (ubicaciones);


