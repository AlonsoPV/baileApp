-- ============================================================================
-- Quitar del cronograma las filas cuyo título contiene "DJ setlist"
-- Organizer 10 — miércoles (dia_semana = 3)
-- ============================================================================
-- Ejecutar en Supabase SQL Editor.
-- No modifica la columna `djs`; solo el JSON `cronograma`.
-- ============================================================================

UPDATE public.events_date ed
SET
  cronograma = CASE
    WHEN ed.cronograma IS NULL OR jsonb_typeof(ed.cronograma) <> 'array' THEN ed.cronograma
    ELSE COALESCE(
      (
        SELECT jsonb_agg(elem ORDER BY ord)
        FROM jsonb_array_elements(ed.cronograma) WITH ORDINALITY AS t(elem, ord)
        WHERE NOT (COALESCE(elem->>'titulo', '') ILIKE '%dj setlist%')
      ),
      '[]'::jsonb
    )
  END,
  updated_at = now()
WHERE ed.id IN (
  SELECT ed2.id
  FROM public.events_date ed2
  LEFT JOIN public.events_parent ep ON ed2.parent_id = ep.id
  WHERE COALESCE(ep.organizer_id, ed2.organizer_id) = 10
    AND ed2.dia_semana = 3
    AND jsonb_typeof(ed2.cronograma) = 'array'
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(ed2.cronograma) elem
      WHERE COALESCE(elem->>'titulo', '') ILIKE '%dj setlist%'
    )
);

-- Verificación: no debe quedar ningún ítem con "dj setlist" en cronograma
SELECT
  ed.id,
  ed.nombre,
  ed.dia_semana,
  ed.cronograma,
  ed.updated_at
FROM public.events_date ed
LEFT JOIN public.events_parent ep ON ed.parent_id = ep.id
WHERE COALESCE(ep.organizer_id, ed.organizer_id) = 10
  AND ed.dia_semana = 3
ORDER BY ed.id;
