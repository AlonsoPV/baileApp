-- =========================================
-- Public access for "Eventos de interés"
-- =========================================
-- UserPublicScreen consulta `event_rsvp` para mostrar los EventDate donde un usuario hizo RSVP.
-- Para que funcione en perfiles públicos incluso sin sesión:
-- 1) Se requiere GRANT SELECT al rol `anon`
-- 2) Se requiere una policy RLS de SELECT que lo permita
--
-- Nota: Este proyecto decidió que los RSVPs son visibles por diseño en el perfil público del usuario.

ALTER TABLE public.event_rsvp ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_rsvp'
      AND policyname = 'rsvp_select_public'
  ) THEN
    EXECUTE 'CREATE POLICY rsvp_select_public ON public.event_rsvp FOR SELECT USING (true)';
  END IF;
END $$;

GRANT SELECT ON TABLE public.event_rsvp TO anon, authenticated;

