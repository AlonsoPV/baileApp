-- ============================================================================
-- Corregir eventos 12604, 12605, 12606 para que se traten como recurrentes
-- ============================================================================
-- Asigna parent_id (events_parent del organizer 14) a estas filas si es NULL.
-- Sin parent_id, ensure_weekly_occurrences nunca se ejecuta y no se generan
-- ocurrencias futuras.
-- ============================================================================
-- Ejecutar después de diagnose_recurrent_12604_12605_12606.sql si confirmas
-- que parent_id es NULL.
-- ============================================================================

DO $$
DECLARE
  v_parent_id bigint;
  v_updated   int;
BEGIN
  -- Obtener un events_parent del organizer 14 (el primero por id)
  SELECT id INTO v_parent_id
  FROM public.events_parent
  WHERE organizer_id = 14
  ORDER BY id
  LIMIT 1;

  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'No existe events_parent para organizer_id 14. Crea uno antes de ejecutar este script.';
  END IF;

  -- Asignar parent_id y asegurar organizer_id (por si la vista usa COALESCE(ep.organizer_id, ed.organizer_id))
  UPDATE public.events_date
  SET
    parent_id   = v_parent_id,
    organizer_id = COALESCE(organizer_id, 14),
    updated_at  = now()
  WHERE id IN (12604, 12605, 12606)
    AND (parent_id IS DISTINCT FROM v_parent_id OR organizer_id IS NULL);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Actualizadas % filas (parent_id = %, organizer_id 14).', v_updated, v_parent_id;
END $$;

-- Materializar ocurrencias futuras para el parent (opcional; la app también lo hace al cargar Explore)
-- Descomenta y ejecuta si quieres generar las fechas ya en BD:
/*
DO $$
DECLARE
  v_parent_id bigint;
  v_inserted  int;
BEGIN
  SELECT id INTO v_parent_id FROM public.events_parent WHERE organizer_id = 14 ORDER BY id LIMIT 1;
  IF v_parent_id IS NOT NULL THEN
    SELECT public.ensure_weekly_occurrences(v_parent_id, 12) INTO v_inserted;
    RAISE NOTICE 'ensure_weekly_occurrences(parent_id=%, 12 semanas) insertó % ocurrencias.', v_parent_id, v_inserted;
  END IF;
END $$;
*/

-- Verificación
SELECT id, parent_id, organizer_id, dia_semana, fecha, nombre, estado_publicacion
FROM public.events_date
WHERE id IN (12604, 12605, 12606)
ORDER BY id;
