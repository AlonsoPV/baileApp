-- Agrega campos de contacto (teléfono / WhatsApp y mensaje) a events_date
DO $$
BEGIN
  -- Campo para número de celular o WhatsApp
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events_date'
      AND column_name = 'telefono_contacto'
  ) THEN
    ALTER TABLE public.events_date
    ADD COLUMN telefono_contacto TEXT NULL;

    COMMENT ON COLUMN public.events_date.telefono_contacto IS 
      'Número de celular o WhatsApp para más información sobre la fecha.';
  END IF;

  -- Campo para mensaje de saludo / plantilla
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events_date'
      AND column_name = 'mensaje_contacto'
  ) THEN
    ALTER TABLE public.events_date
    ADD COLUMN mensaje_contacto TEXT NULL;

    COMMENT ON COLUMN public.events_date.mensaje_contacto IS 
      'Mensaje de saludo sugerido para contactar por WhatsApp, puede incluir el nombre del evento.';
  END IF;
END $$;


