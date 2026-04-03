-- ============================================================================
-- Organizer id 10 — Miércoles (dia_semana = 3): costos + cronograma + DJ
-- ============================================================================
-- Ejecutar en Supabase SQL Editor (revisar filas afectadas antes en PROD).
--
-- Costos:
--   1) Mujeres gratis — promoción — $0 — "Hasta las 9:00 pm"
--   2) Cover — taquilla — $120 — "Incluye bebida"
-- Cronograma:
--   - Clase de salsa 19:30–20:30
--   - Clase de bachata 20:30–21:30
--   - DJ setlist: DJ Ozelot 21:30–23:00
-- ============================================================================

DO $$
DECLARE
  v_cronograma jsonb;
  v_costos     jsonb;
  v_updated    int;
BEGIN
  v_costos := '[
    {
      "nombre": "Mujeres gratis",
      "descripcion": "Hasta las 9:00 pm",
      "tipo": "promocion",
      "precio": 0,
      "monto": 0
    },
    {
      "nombre": "Cover",
      "descripcion": "Incluye bebida",
      "tipo": "taquilla",
      "precio": 120,
      "monto": 120
    }
  ]'::jsonb;

  v_cronograma := '[
    {"titulo": "Clase de salsa", "inicio": "19:30", "fin": "20:30"},
    {"titulo": "Clase de bachata", "inicio": "20:30", "fin": "21:30"},
    {"titulo": "DJ setlist: DJ Ozelot", "inicio": "21:30", "fin": "23:00"}
  ]'::jsonb;

  WITH targets AS (
    SELECT ed.id
    FROM public.events_date ed
    LEFT JOIN public.events_parent ep ON ed.parent_id = ep.id
    WHERE COALESCE(ep.organizer_id, ed.organizer_id) = 10
      AND ed.dia_semana = 3
  )
  UPDATE public.events_date
  SET
    costos     = v_costos,
    cronograma = v_cronograma,
    djs        = 'DJ Ozelot',
    updated_at = now()
  FROM targets t
  WHERE events_date.id = t.id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Organizer 10 (miércoles dia_semana=3): actualizadas % filas.', v_updated;
END $$;

-- Verificación
SELECT
  ed.id,
  ed.nombre,
  ed.dia_semana,
  ed.fecha,
  ed.costos,
  ed.cronograma,
  ed.djs,
  ed.updated_at
FROM public.events_date ed
LEFT JOIN public.events_parent ep ON ed.parent_id = ep.id
WHERE COALESCE(ep.organizer_id, ed.organizer_id) = 10
  AND ed.dia_semana = 3
ORDER BY ed.fecha NULLS LAST, ed.id;
