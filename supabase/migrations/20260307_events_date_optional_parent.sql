-- Opción 1: parent_id opcional en events_date
-- Permite crear fechas con solo organizer_id (sin events_parent) para el primer evento del organizador.

-- 1) Asegurar columna organizer_id en events_date (nullable; se usa cuando parent_id es null)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events_date' AND column_name = 'organizer_id'
  ) THEN
    ALTER TABLE public.events_date
    ADD COLUMN organizer_id bigint NULL REFERENCES public.profiles_organizer(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added events_date.organizer_id';
  END IF;
END $$;

-- 1b) Relajar check recurrente: permite dia_semana sin parent_id cuando organizer_id está presente
ALTER TABLE public.events_date DROP CONSTRAINT IF EXISTS events_date_recurrent_requires_parent_chk;
ALTER TABLE public.events_date
  ADD CONSTRAINT events_date_recurrent_requires_parent_chk
  CHECK (dia_semana IS NULL OR parent_id IS NOT NULL OR organizer_id IS NOT NULL);

-- 2) RLS: permitir INSERT/UPDATE/DELETE cuando el usuario es dueño vía parent O vía organizer_id directo
DROP POLICY IF EXISTS "events_date_insert_organizer" ON public.events_date;
CREATE POLICY "events_date_insert_organizer"
ON public.events_date
FOR INSERT
WITH CHECK (
  parent_id IN (
    SELECT ep.id FROM public.events_parent ep
    INNER JOIN public.profiles_organizer po ON ep.organizer_id = po.id
    WHERE po.user_id = auth.uid()
  )
  OR (
    parent_id IS NULL
    AND organizer_id IN (SELECT id FROM public.profiles_organizer WHERE user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "events_date_update_organizer" ON public.events_date;
CREATE POLICY "events_date_update_organizer"
ON public.events_date
FOR UPDATE
USING (
  parent_id IN (
    SELECT ep.id FROM public.events_parent ep
    INNER JOIN public.profiles_organizer po ON ep.organizer_id = po.id
    WHERE po.user_id = auth.uid()
  )
  OR (
    parent_id IS NULL
    AND organizer_id IN (SELECT id FROM public.profiles_organizer WHERE user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "events_date_delete_organizer" ON public.events_date;
CREATE POLICY "events_date_delete_organizer"
ON public.events_date
FOR DELETE
USING (
  parent_id IN (
    SELECT ep.id FROM public.events_parent ep
    INNER JOIN public.profiles_organizer po ON ep.organizer_id = po.id
    WHERE po.user_id = auth.uid()
  )
  OR (
    parent_id IS NULL
    AND organizer_id IN (SELECT id FROM public.profiles_organizer WHERE user_id = auth.uid())
  )
);

-- 3) Vistas: incluir fechas sin parent (LEFT JOIN events_parent, organizer = COALESCE(ep.organizer_id, ed.organizer_id))
DROP VIEW IF EXISTS public.events_live CASCADE;
CREATE VIEW public.events_live AS
SELECT
    ed.id,
    ed.parent_id,
    ed.nombre,
    ed.biografia,
    ed.fecha,
    ed.hora_inicio,
    ed.hora_fin,
    ed.lugar,
    ed.direccion,
    ed.ciudad,
    ed.zona,
    ed.referencias,
    ed.requisitos,
    ed.cronograma,
    ed.costos,
    ed.media,
    ed.flyer_url,
    ed.created_at,
    ed.updated_at,
    COALESCE(ep.nombre, ed.nombre) AS evento_nombre,
    ep.descripcion AS evento_descripcion,
    ep.biografia AS evento_biografia,
    COALESCE(ep.estilos, ed.estilos) AS evento_estilos,
    COALESCE(ep.zonas, ed.zonas) AS evento_zonas,
    ep.sede_general,
    ep.faq,
    ep.media AS evento_media,
    po.id AS organizador_id,
    po.user_id AS organizador_user_id,
    po.nombre_publico AS organizador_nombre,
    po.bio AS organizador_bio,
    po.media AS organizador_media,
    po.ritmos AS organizador_ritmos,
    po.ritmos_seleccionados AS organizador_ritmos_seleccionados,
    po.zonas AS organizador_zonas
FROM public.events_date ed
LEFT JOIN public.events_parent ep ON ed.parent_id = ep.id
INNER JOIN public.profiles_organizer po ON po.id = COALESCE(ep.organizer_id, ed.organizer_id)
WHERE po.estado_aprobacion = 'aprobado'
  AND ed.fecha >= CURRENT_DATE
  AND COALESCE(ep.organizer_id, ed.organizer_id) IS NOT NULL;

GRANT SELECT ON public.events_live TO anon, authenticated;

DROP VIEW IF EXISTS public.v_events_dates_public CASCADE;
CREATE VIEW public.v_events_dates_public AS
SELECT
    ed.id,
    ed.parent_id,
    ed.nombre,
    ed.biografia,
    ed.fecha,
    ed.hora_inicio,
    ed.hora_fin,
    ed.lugar,
    ed.direccion,
    ed.ciudad,
    ed.zona,
    ed.referencias,
    ed.requisitos,
    ed.cronograma,
    ed.costos,
    ed.media,
    ed.flyer_url,
    ed.created_at,
    ed.updated_at,
    ed.estilos,
    ed.ritmos_seleccionados,
    ed.zonas,
    ed.estado_publicacion,
    ed.rsvp_interesado_count,
    ed.telefono_contacto,
    ed.mensaje_contacto,
    ed.djs,
    ed.dia_semana,
    COALESCE(ep.nombre, ed.nombre) AS evento_nombre,
    COALESCE(ep.organizer_id, ed.organizer_id) AS organizer_id
FROM public.events_date ed
LEFT JOIN public.events_parent ep ON ed.parent_id = ep.id
INNER JOIN public.profiles_organizer po ON po.id = COALESCE(ep.organizer_id, ed.organizer_id)
WHERE po.estado_aprobacion = 'aprobado'
  AND ed.fecha >= CURRENT_DATE
  AND COALESCE(ep.organizer_id, ed.organizer_id) IS NOT NULL;

GRANT SELECT ON public.v_events_dates_public TO anon, authenticated;
