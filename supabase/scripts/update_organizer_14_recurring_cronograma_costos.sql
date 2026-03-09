-- ============================================================================
-- Actualizar cronograma y costos de eventos recurrentes del organizer_id 14
-- ============================================================================
-- Cronograma:
--   Clase Salsa 7:45 a 8:45 todos los niveles
--   Clase Kizomba 7:45 a 8:45 inter avanzado
--   Clase bachata 8:45 a 10:00
-- Costos: preventa 150, taquilla 170 incluye bebida de cortesía
-- ============================================================================
-- Ejecutar en Supabase SQL Editor.
-- ============================================================================

DO $$
DECLARE
  v_cronograma jsonb;
  v_costos    jsonb;
  v_updated   int;
BEGIN
  -- Cronograma: 3 bloques (horas en 24h: 19:45, 20:45, 22:00)
  v_cronograma := '[
    {"titulo": "Clase Salsa 7:45 a 8:45 todos los niveles", "inicio": "19:45", "fin": "20:45"},
    {"titulo": "Clase Kizomba 7:45 a 8:45 inter avanzado", "inicio": "19:45", "fin": "20:45"},
    {"titulo": "Clase bachata 8:45 a 10:00", "inicio": "20:45", "fin": "22:00"}
  ]'::jsonb;

  -- Costos: preventa 150, taquilla 170 con descripción
  v_costos := '[
    {"tipo": "preventa", "monto": 150, "precio": 150},
    {"tipo": "taquilla", "monto": 170, "precio": 170, "descripcion": "incluye bebida de cortesía"}
  ]'::jsonb;

  -- Actualizar todas las fechas (plantillas y ocurrencias) del organizador 14:
  -- por parent_id (eventos cuyo parent tiene organizer_id = 14) o por organizer_id directo
  WITH targets AS (
    SELECT ed.id
    FROM public.events_date ed
    LEFT JOIN public.events_parent ep ON ed.parent_id = ep.id
    WHERE COALESCE(ep.organizer_id, ed.organizer_id) = 14
  )
  UPDATE public.events_date
  SET
    cronograma = v_cronograma,
    costos     = v_costos,
    updated_at = now()
  FROM targets t
  WHERE events_date.id = t.id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Organizer 14: actualizadas % filas en events_date (cronograma + costos).', v_updated;
END $$;

-- Verificación: listar cronograma y costos de una fila de organizer 14
SELECT
  ed.id,
  ed.parent_id,
  ed.nombre,
  ed.dia_semana,
  ed.fecha,
  ed.cronograma,
  ed.costos,
  ed.updated_at
FROM public.events_date ed
LEFT JOIN public.events_parent ep ON ed.parent_id = ep.id
WHERE COALESCE(ep.organizer_id, ed.organizer_id) = 14
ORDER BY ed.dia_semana NULLS LAST, ed.fecha NULLS LAST
LIMIT 5;
