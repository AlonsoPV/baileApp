-- ============================================================
-- Eventos recurrentes de prueba para ETAPA 1 medición PERF
-- Ejecutar en dev/staging para que runPerfScenarioRecurring()
-- dispare ensure_weekly_occurrences_rpc y refetch_recurring_occurrences
-- ============================================================
-- Requisito: debe existir al menos un profiles_organizer aprobado
-- ============================================================

DO $$
DECLARE
  v_org_id bigint;
  v_parent_id bigint;
  v_today date;
BEGIN
  v_today := (now() at time zone 'America/Mexico_City')::date;

  -- Obtener primer organizador aprobado
  SELECT id INTO v_org_id
  FROM public.profiles_organizer
  WHERE estado_aprobacion = 'aprobado'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'No hay profiles_organizer aprobado. Saltando inserción de eventos recurrentes de prueba.';
    RETURN;
  END IF;

  -- Crear 3 events_parent de prueba
  FOR i IN 1..3 LOOP
    INSERT INTO public.events_parent (organizer_id, nombre, descripcion, estilos, zonas, created_at)
    VALUES (
      v_org_id,
      'PERF Test Recurring ' || i,
      'Evento recurrente de prueba para medición',
      '{}'::int[],
      '{}'::int[],
      now()
    )
    RETURNING id INTO v_parent_id;

    -- Crear plantilla recurrente (dia_semana: 5=sábado, 6=domingo para variedad)
    INSERT INTO public.events_date (
      parent_id,
      organizer_id,
      nombre,
      fecha,
      dia_semana,
      hora_inicio,
      hora_fin,
      lugar,
      direccion,
      ciudad,
      zona,
      estado_publicacion,
      estilos,
      ritmos_seleccionados,
      created_at,
      updated_at
    )
    VALUES (
      v_parent_id,
      v_org_id,
      'PERF Recurrente ' || i,
      v_today + (i * 7),  -- fecha inicial
      (4 + i)::int % 7,   -- dia_semana 0-6
      '20:00',
      '23:00',
      'Lugar Test ' || i,
      'Dirección ' || i,
      'CDMX',
      NULL,
      'publicado',
      '{}'::int[],
      '{}'::text[],
      now(),
      now()
    );
  END LOOP;

  RAISE NOTICE 'Insertados 3 events_parent con events_date recurrentes (dia_semana not null)';
END $$;
