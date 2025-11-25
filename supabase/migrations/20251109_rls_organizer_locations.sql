-- RLS para organizer_locations: propietario (por user_id en profiles_organizer) puede CRUD

-- Habilitar RLS
ALTER TABLE public.organizer_locations ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas si existen
DROP POLICY IF EXISTS organizer_locations_select_own ON public.organizer_locations;
DROP POLICY IF EXISTS organizer_locations_insert_own ON public.organizer_locations;
DROP POLICY IF EXISTS organizer_locations_update_own ON public.organizer_locations;
DROP POLICY IF EXISTS organizer_locations_delete_own ON public.organizer_locations;

-- Política: SELECT (solo ubicaciones cuyo organizer_id pertenece al usuario actual)
CREATE POLICY organizer_locations_select_own
ON public.organizer_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles_organizer po
    WHERE po.id = organizer_id
      AND po.user_id = auth.uid()
  )
);

-- Política: INSERT (solo permitir si el organizer_id pertenece al usuario actual)
CREATE POLICY organizer_locations_insert_own
ON public.organizer_locations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles_organizer po
    WHERE po.id = organizer_id
      AND po.user_id = auth.uid()
  )
);

-- Política: UPDATE (solo sobre ubicaciones cuyo organizer_id pertenece al usuario actual)
CREATE POLICY organizer_locations_update_own
ON public.organizer_locations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles_organizer po
    WHERE po.id = organizer_id
      AND po.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles_organizer po
    WHERE po.id = organizer_id
      AND po.user_id = auth.uid()
  )
);

-- Política: DELETE (solo sobre ubicaciones cuyo organizer_id pertenece al usuario actual)
CREATE POLICY organizer_locations_delete_own
ON public.organizer_locations
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles_organizer po
    WHERE po.id = organizer_id
      AND po.user_id = auth.uid()
  )
);


