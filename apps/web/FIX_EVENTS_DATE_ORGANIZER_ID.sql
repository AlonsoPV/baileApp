-- ============================================================
-- FIX_EVENTS_DATE_ORGANIZER_ID.sql
-- ------------------------------------------------------------
-- Objetivo:
--  - Asegurar que cada fila de events_date tenga un organizer_id
--    que la vincule claramente con un perfil de organizador.
--  - Permitir fechas independientes (sin parent_id) pero aún así
--    "perteneciendo" a un organizador concreto.
--
-- IMPORTANTE:
--  - Ejecutar este script DESPUÉS de FIX_EVENTS_DATE_INDEPENDENT_RLS.sql
--    o de cualquier script previo que haya creado políticas de RLS
--    sobre events_date.
-- ============================================================

-- 1) Añadir columna organizer_id si no existe
ALTER TABLE public.events_date
ADD COLUMN IF NOT EXISTS organizer_id integer;

-- 2) Backfill de organizer_id desde events_parent (para fechas ya ancladas)
UPDATE public.events_date ed
SET organizer_id = ep.organizer_id
FROM public.events_parent ep
WHERE ed.parent_id = ep.id
  AND ed.organizer_id IS NULL;

-- 2b) Para fechas sin parent_id pero con organizer_id NULL, intentar inferirlo
--     basándose en fechas recientes del mismo usuario (si hay alguna forma de rastrearlo)
--     NOTA: Si no hay forma de inferirlo, estas fechas quedarán con organizer_id NULL
--     y no aparecerán en las consultas del organizador hasta que se actualicen manualmente.
--     
--     Por ahora, dejamos un comentario: las fechas con parent_id NULL y organizer_id NULL
--     necesitan ser actualizadas manualmente o eliminadas.

-- 3) Crear índice para acelerar filtros por organizer_id
CREATE INDEX IF NOT EXISTS idx_events_date_organizer_id
ON public.events_date(organizer_id);

-- 4) Políticas RLS: reemplazar las anteriores basadas sólo en parent_id

DROP POLICY IF EXISTS "events_date_insert_organizer" ON public.events_date;
DROP POLICY IF EXISTS "events_date_update_organizer" ON public.events_date;
DROP POLICY IF EXISTS "events_date_delete_organizer" ON public.events_date;

-- Helper: obtener el id del perfil de organizador del usuario actual
-- (se usa inline en las políticas vía subquery).

-- INSERT: sólo puede insertar fechas el organizador dueño
CREATE POLICY "events_date_insert_organizer"
ON public.events_date
FOR INSERT
WITH CHECK (
  -- Caso 1: fecha independiente (parent_id NULL)
  (
    parent_id IS NULL
    AND organizer_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.profiles_organizer po
      WHERE po.id = organizer_id
        AND po.user_id = auth.uid()
    )
  )
  OR
  -- Caso 2: fecha ligada a un events_parent del mismo organizador
  (
    parent_id IS NOT NULL
    AND organizer_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.events_parent ep
      JOIN public.profiles_organizer po ON ep.organizer_id = po.id
      WHERE ep.id = parent_id
        AND ep.organizer_id = organizer_id
        AND po.user_id = auth.uid()
    )
  )
);

-- UPDATE: sólo puede modificar fechas su propio organizador
CREATE POLICY "events_date_update_organizer"
ON public.events_date
FOR UPDATE
USING (
  organizer_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.profiles_organizer po
    WHERE po.id = organizer_id
      AND po.user_id = auth.uid()
  )
);

-- DELETE: sólo puede borrar fechas su propio organizador
CREATE POLICY "events_date_delete_organizer"
ON public.events_date
FOR DELETE
USING (
  organizer_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.profiles_organizer po
    WHERE po.id = organizer_id
      AND po.user_id = auth.uid()
  )
);

-- 5) Verificación rápida
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'events_date'
ORDER BY policyname, cmd;

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ FIX_EVENTS_DATE_ORGANIZER_ID aplicado';
  RAISE NOTICE '✅ events_date.organizer_id creado y backfilleado';
  RAISE NOTICE '✅ Políticas RLS actualizadas para usar organizer_id';
  RAISE NOTICE '===========================================';
END $$;


-- Permitir ver fechas publicadas a cualquiera (explore, perfiles públicos)
DROP POLICY IF EXISTS "events_date_select_public" ON public.events_date;
DROP POLICY IF EXISTS "events_date_select_organizer" ON public.events_date;

CREATE POLICY "events_date_select_public"
ON public.events_date
FOR SELECT
USING (
  estado_publicacion = 'publicado'
);

-- Permitir al organizador ver TODAS sus fechas (borrador o publicadas),
-- independientemente de parent_id (puede ser NULL)
CREATE POLICY "events_date_select_organizer"
ON public.events_date
FOR SELECT
USING (
  organizer_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.profiles_organizer po
    WHERE po.id = organizer_id
      AND po.user_id = auth.uid()
  )
);

-- ============================================================
-- 6) IDENTIFICAR FECHAS HUÉRFANAS (sin organizer_id)
-- ============================================================
-- Este query muestra las fechas que aún tienen organizer_id NULL
-- y necesitan ser actualizadas manualmente o eliminadas.
SELECT 
  id,
  nombre,
  fecha,
  parent_id,
  organizer_id,
  estado_publicacion,
  created_at
FROM public.events_date
WHERE organizer_id IS NULL
ORDER BY created_at DESC;

-- ============================================================
-- 7) ACTUALIZAR FECHAS HUÉRFANAS (ejecutar manualmente si es necesario)
-- ============================================================
-- Si tienes fechas con organizer_id NULL que pertenecen a un organizador específico,
-- ejecuta este UPDATE reemplazando {ORGANIZER_ID} y {DATE_IDS}:
--
-- Ejemplo para actualizar fechas 55 y 56 al organizador 12:
-- UPDATE public.events_date
-- SET organizer_id = 12
-- WHERE id IN (55, 56)
--   AND organizer_id IS NULL;
--
-- Para actualizar TODAS las fechas huérfanas a un organizador específico (CUIDADO):
-- UPDATE public.events_date
-- SET organizer_id = 12
-- WHERE organizer_id IS NULL
--   AND parent_id IS NULL;
--
-- ============================================================
-- NOTA: Las fechas con organizer_id NULL no aparecerán en las consultas
--       del organizador hasta que se actualice este campo.
-- ============================================================