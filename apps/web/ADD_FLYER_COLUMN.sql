-- Agregar columna flyer_url a events_date si no existe
ALTER TABLE public.events_date
  ADD COLUMN IF NOT EXISTS flyer_url TEXT;
