-- Permite leer event_rsvp para perfiles públicos (UserPublicScreen)
-- Sin esto, RLS rsvp_select_own bloquea la lectura de RSVPs de otros usuarios
-- y la sección "Eventos de Interés" queda vacía al ver /u/:id

CREATE POLICY rsvp_select_public ON public.event_rsvp
  FOR SELECT USING (true);

COMMENT ON POLICY rsvp_select_public ON public.event_rsvp IS
  'Permite que cualquier usuario (incl. anon) lea RSVPs para mostrar en perfiles públicos. Los RSVPs son visibles por diseño en el perfil del usuario.';
