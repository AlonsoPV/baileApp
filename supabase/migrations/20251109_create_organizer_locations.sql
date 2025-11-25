-- Crea tabla de ubicaciones reutilizables a nivel organizador
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='organizer_locations'
  ) THEN
    CREATE TABLE public.organizer_locations (
      id BIGSERIAL PRIMARY KEY,
      organizer_id BIGINT NOT NULL,
      nombre TEXT,
      direccion TEXT,
      ciudad TEXT,
      referencias TEXT,
      zona_id INT,
      zona_ids INT[] DEFAULT ARRAY[]::INT[],
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Índices útiles
CREATE INDEX IF NOT EXISTS organizer_locations_org_idx ON public.organizer_locations (organizer_id);
CREATE INDEX IF NOT EXISTS organizer_locations_zonas_gin ON public.organizer_locations USING GIN (zona_ids);

-- Trigger para updated_at (función idempotente)
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql
AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS set_updated_at_organizer_locations ON public.organizer_locations;
CREATE TRIGGER set_updated_at_organizer_locations
BEFORE UPDATE ON public.organizer_locations
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


