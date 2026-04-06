-- FAQ JSON para perfil público de organizador (pregunta/respuesta + orden)
ALTER TABLE public.profiles_organizer
  ADD COLUMN IF NOT EXISTS faq jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles_organizer.faq IS 'Array JSON: [{ id, q, a, sort_order }] — preguntas frecuentes del organizador';

-- La vista usa SELECT * en su creación original; al añadir columnas hay que recrearla para exponer `faq`.
DROP VIEW IF EXISTS public.v_organizers_public;
CREATE VIEW public.v_organizers_public AS
SELECT *
FROM public.profiles_organizer
WHERE estado_aprobacion = 'aprobado';

GRANT SELECT ON public.v_organizers_public TO anon, authenticated;
