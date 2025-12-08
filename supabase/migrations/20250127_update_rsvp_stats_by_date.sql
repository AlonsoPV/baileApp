-- Actualizar funciones de RSVP para contar solo fechas futuras
-- El contador se reinicia para fechas pasadas, pero las métricas históricas se mantienen

-- 1) Actualizar get_event_rsvp_stats para filtrar por fecha del evento
-- Solo cuenta RSVPs de eventos con fecha futura (o fecha de hoy si aún no ha pasado la hora)
DROP FUNCTION IF EXISTS public.get_event_rsvp_stats(bigint);
CREATE OR REPLACE FUNCTION public.get_event_rsvp_stats(event_id bigint)
RETURNS TABLE (interesado integer, total integer) AS $$
DECLARE
  event_fecha date;
  event_hora_inicio time;
  event_datetime timestamp;
  now_cdmx timestamp;
BEGIN
  -- Obtener fecha y hora del evento
  SELECT ed.fecha, ed.hora_inicio INTO event_fecha, event_hora_inicio
  FROM public.events_date ed
  WHERE ed.id = event_id;
  
  -- Si no existe el evento, retornar 0
  IF event_fecha IS NULL THEN
    RETURN QUERY SELECT 0::int AS interesado, 0::int AS total;
    RETURN;
  END IF;
  
  -- Construir datetime del evento (usar hora_inicio si existe, sino medianoche)
  IF event_hora_inicio IS NOT NULL THEN
    event_datetime := (event_fecha::text || ' ' || event_hora_inicio::text)::timestamp;
  ELSE
    event_datetime := event_fecha::timestamp;
  END IF;
  
  -- Obtener hora actual en CDMX (UTC-6 o UTC-5 según DST)
  -- Por simplicidad, usamos NOW() y ajustamos si es necesario
  now_cdmx := NOW() AT TIME ZONE 'America/Mexico_City';
  
  -- Si la fecha del evento ya pasó, retornar 0 (contador reiniciado)
  -- Pero los registros en event_rsvp se mantienen para métricas históricas
  IF event_datetime < now_cdmx THEN
    RETURN QUERY SELECT 0::int AS interesado, 0::int AS total;
    RETURN;
  END IF;
  
  -- Contar solo RSVPs de eventos con fecha futura
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE r.status = 'interesado'), 0)::int AS interesado,
    COALESCE(COUNT(*), 0)::int AS total
  FROM public.event_rsvp r
  WHERE r.event_date_id = event_id;
END; $$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_event_rsvp_stats(bigint) IS 
'Cuenta RSVPs solo para eventos con fecha futura. Fechas pasadas retornan 0 pero los registros se mantienen para métricas históricas.';

-- 2) Actualizar get_academy_class_metrics para filtrar por fecha_especifica
-- Solo cuenta asistencias con fecha_especifica futura o NULL (clases sin fecha específica)
DROP FUNCTION IF EXISTS public.get_academy_class_metrics(bigint);
CREATE OR REPLACE FUNCTION public.get_academy_class_metrics(p_academy_id bigint)
RETURNS TABLE (
  class_id bigint,
  total_tentativos bigint,
  por_rol jsonb,
  nombre_clase text,
  fecha_clase text,
  precio_clase numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cronograma_data jsonb;
  costos_data jsonb;
  now_cdmx date;
BEGIN
  -- Verificar que el usuario es dueño de la academia o superadmin
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.profiles_academy 
      WHERE id = p_academy_id 
      AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.role_requests 
      WHERE user_id = auth.uid() 
      AND role_slug = 'superadmin' 
      AND status = 'aprobado'
    )
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para ver estas métricas';
  END IF;

  -- Obtener fecha actual en CDMX
  now_cdmx := (NOW() AT TIME ZONE 'America/Mexico_City')::date;

  -- Obtener cronograma y costos de la academia
  SELECT cronograma, costos INTO cronograma_data, costos_data
  FROM public.profiles_academy
  WHERE id = p_academy_id;

  -- Inicializar costos_data si es null
  IF costos_data IS NULL THEN
    costos_data := '[]'::jsonb;
  END IF;

  -- Si no hay cronograma, retornar métricas sin detalles de clase
  IF cronograma_data IS NULL OR (jsonb_typeof(cronograma_data) = 'array' AND jsonb_array_length(cronograma_data) = 0) THEN
    RETURN QUERY
    SELECT 
      ca.class_id,
      COUNT(*)::bigint AS total_tentativos,
      jsonb_build_object(
        'leader', COUNT(*) FILTER (WHERE ca.role_baile IN ('lead', 'leader'))::bigint,
        'follower', COUNT(*) FILTER (WHERE ca.role_baile IN ('follow', 'follower'))::bigint,
        'ambos', COUNT(*) FILTER (WHERE ca.role_baile = 'ambos')::bigint,
        'otros', COUNT(*) FILTER (WHERE ca.role_baile NOT IN ('lead', 'leader', 'follow', 'follower', 'ambos') OR ca.role_baile IS NULL)::bigint
      ) AS por_rol,
      'Clase #' || ca.class_id::text AS nombre_clase,
      NULL::text AS fecha_clase,
      NULL::numeric AS precio_clase
    FROM public.clase_asistencias ca
    WHERE ca.academy_id = p_academy_id
      AND ca.status = 'tentative'
      -- ✅ FILTRAR: Solo fechas futuras o NULL (clases sin fecha específica)
      AND (ca.fecha_especifica IS NULL OR ca.fecha_especifica >= now_cdmx)
    GROUP BY ca.class_id;
    RETURN;
  END IF;

  -- Retornar métricas con detalles de clase
  RETURN QUERY
  WITH class_details AS (
    SELECT DISTINCT
      ca.class_id,
      COALESCE(
        (SELECT t.value->>'titulo' FROM jsonb_array_elements(cronograma_data) WITH ORDINALITY AS t WHERE (t.value->>'id')::bigint = ca.class_id LIMIT 1),
        (SELECT t.value->>'nombre' FROM jsonb_array_elements(cronograma_data) WITH ORDINALITY AS t WHERE (t.value->>'id')::bigint = ca.class_id LIMIT 1),
        (SELECT t.value->>'titulo' FROM jsonb_array_elements(cronograma_data) WITH ORDINALITY AS t WHERE ca.class_id % 1000 = 0 AND (ca.class_id / 1000)::integer = t.ordinality - 1 LIMIT 1),
        (SELECT t.value->>'nombre' FROM jsonb_array_elements(cronograma_data) WITH ORDINALITY AS t WHERE ca.class_id % 1000 = 0 AND (ca.class_id / 1000)::integer = t.ordinality - 1 LIMIT 1),
        (SELECT t.value->>'titulo' FROM jsonb_array_elements(cronograma_data) WITH ORDINALITY AS t WHERE ca.class_id < 1000 AND ca.class_id::integer = t.ordinality - 1 LIMIT 1),
        (SELECT t.value->>'nombre' FROM jsonb_array_elements(cronograma_data) WITH ORDINALITY AS t WHERE ca.class_id < 1000 AND ca.class_id::integer = t.ordinality - 1 LIMIT 1),
        (SELECT t.value->>'titulo' FROM jsonb_array_elements(cronograma_data) WITH ORDINALITY AS t WHERE ca.class_id = p_academy_id AND t.ordinality = 1 LIMIT 1),
        (SELECT t.value->>'nombre' FROM jsonb_array_elements(cronograma_data) WITH ORDINALITY AS t WHERE ca.class_id = p_academy_id AND t.ordinality = 1 LIMIT 1),
        ''
      ) AS nombre_clase,
      COALESCE(
        (SELECT t.value->>'fecha' FROM jsonb_array_elements(cronograma_data) WITH ORDINALITY AS t WHERE (t.value->>'id')::bigint = ca.class_id LIMIT 1),
        (SELECT t.value->>'diaSemana' FROM jsonb_array_elements(cronograma_data) WITH ORDINALITY AS t WHERE (t.value->>'id')::bigint = ca.class_id LIMIT 1),
        (SELECT t.value->>'fecha' FROM jsonb_array_elements(cronograma_data) WITH ORDINALITY AS t WHERE ca.class_id % 1000 = 0 AND (ca.class_id / 1000)::integer = t.ordinality - 1 LIMIT 1),
        (SELECT t.value->>'diaSemana' FROM jsonb_array_elements(cronograma_data) WITH ORDINALITY AS t WHERE ca.class_id % 1000 = 0 AND (ca.class_id / 1000)::integer = t.ordinality - 1 LIMIT 1),
        (SELECT t.value->>'fecha' FROM jsonb_array_elements(cronograma_data) WITH ORDINALITY AS t WHERE ca.class_id < 1000 AND ca.class_id::integer = t.ordinality - 1 LIMIT 1),
        (SELECT t.value->>'diaSemana' FROM jsonb_array_elements(cronograma_data) WITH ORDINALITY AS t WHERE ca.class_id < 1000 AND ca.class_id::integer = t.ordinality - 1 LIMIT 1),
        (SELECT t.value->>'fecha' FROM jsonb_array_elements(cronograma_data) WITH ORDINALITY AS t WHERE ca.class_id = p_academy_id AND t.ordinality = 1 LIMIT 1),
        (SELECT t.value->>'diaSemana' FROM jsonb_array_elements(cronograma_data) WITH ORDINALITY AS t WHERE ca.class_id = p_academy_id AND t.ordinality = 1 LIMIT 1),
        ''
      ) AS referencia_costo
    FROM public.clase_asistencias ca
    WHERE ca.academy_id = p_academy_id
      AND ca.status = 'tentative'
      -- ✅ FILTRAR: Solo fechas futuras o NULL (clases sin fecha específica)
      AND (ca.fecha_especifica IS NULL OR ca.fecha_especifica >= now_cdmx)
  )
  SELECT 
    ca.class_id,
    COUNT(*)::bigint AS total_tentativos,
    jsonb_build_object(
      'leader', COUNT(*) FILTER (WHERE ca.role_baile IN ('lead', 'leader'))::bigint,
      'follower', COUNT(*) FILTER (WHERE ca.role_baile IN ('follow', 'follower'))::bigint,
      'ambos', COUNT(*) FILTER (WHERE ca.role_baile = 'ambos')::bigint,
      'otros', COUNT(*) FILTER (WHERE ca.role_baile NOT IN ('lead', 'leader', 'follow', 'follower', 'ambos') OR ca.role_baile IS NULL)::bigint
    ) AS por_rol,
    cd.nombre_clase,
    -- Mostrar fecha específica si existe, si no mostrar fecha_clase (día de la semana)
    COALESCE(
      ca.fecha_especifica::text,
      cd.fecha_clase
    ) AS fecha_clase,
    -- Extraer precio de la clase desde costos usando referenciaCosto
    (
      SELECT (costo_elem->>'precio')::numeric
      FROM jsonb_array_elements(
        CASE 
          WHEN costos_data IS NULL OR jsonb_typeof(costos_data) != 'array' THEN '[]'::jsonb
          ELSE costos_data
        END
      ) AS costo_elem
      WHERE LOWER(TRIM((costo_elem->>'nombre')::text)) = LOWER(TRIM(cd.referencia_costo))
      LIMIT 1
    ) AS precio_clase
  FROM public.clase_asistencias ca
  LEFT JOIN class_details cd ON cd.class_id = ca.class_id
  WHERE ca.academy_id = p_academy_id
    AND ca.status = 'tentative'
    -- ✅ FILTRAR: Solo fechas futuras o NULL (clases sin fecha específica)
    AND (ca.fecha_especifica IS NULL OR ca.fecha_especifica >= now_cdmx)
  GROUP BY ca.class_id, ca.fecha_especifica, cd.nombre_clase, cd.fecha_clase, cd.referencia_costo;
END;
$$;

COMMENT ON FUNCTION public.get_academy_class_metrics(bigint) IS 
'Cuenta asistencias tentativas solo para fechas futuras o NULL. Fechas pasadas no se cuentan pero los registros se mantienen para métricas históricas.';

-- 3) Actualizar get_teacher_class_metrics (similar para maestros)
-- Buscar si existe esta función
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_teacher_class_metrics'
  ) THEN
    -- La función existe, actualizarla
    EXECUTE '
    DROP FUNCTION IF EXISTS public.get_teacher_class_metrics(bigint);
    CREATE OR REPLACE FUNCTION public.get_teacher_class_metrics(p_teacher_id bigint)
    RETURNS TABLE (
      class_id bigint,
      total_tentativos bigint,
      por_rol jsonb,
      nombre_clase text,
      fecha_clase text,
      precio_clase numeric
    ) 
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $func$
    DECLARE
      cronograma_data jsonb;
      costos_data jsonb;
      now_cdmx date;
    BEGIN
      -- Verificar que el usuario es dueño del maestro o superadmin
      IF NOT (
        EXISTS (
          SELECT 1 FROM public.profiles_teacher 
          WHERE id = p_teacher_id 
          AND user_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM public.role_requests 
          WHERE user_id = auth.uid() 
          AND role_slug = ''superadmin'' 
          AND status = ''aprobado''
        )
      ) THEN
        RAISE EXCEPTION ''No tienes permisos para ver estas métricas'';
      END IF;

      -- Obtener fecha actual en CDMX
      now_cdmx := (NOW() AT TIME ZONE ''America/Mexico_City'')::date;

      -- Obtener cronograma y costos del maestro
      SELECT cronograma, costos INTO cronograma_data, costos_data
      FROM public.profiles_teacher
      WHERE id = p_teacher_id;

      -- Inicializar costos_data si es null
      IF costos_data IS NULL THEN
        costos_data := ''[]''::jsonb;
      END IF;

      -- Si no hay cronograma, retornar métricas sin detalles de clase
      IF cronograma_data IS NULL OR (jsonb_typeof(cronograma_data) = ''array'' AND jsonb_array_length(cronograma_data) = 0) THEN
        RETURN QUERY
        SELECT 
          ca.class_id,
          COUNT(*)::bigint AS total_tentativos,
          jsonb_build_object(
            ''leader'', COUNT(*) FILTER (WHERE ca.role_baile IN (''lead'', ''leader''))::bigint,
            ''follower'', COUNT(*) FILTER (WHERE ca.role_baile IN (''follow'', ''follower''))::bigint,
            ''ambos'', COUNT(*) FILTER (WHERE ca.role_baile = ''ambos'')::bigint,
            ''otros'', COUNT(*) FILTER (WHERE ca.role_baile NOT IN (''lead'', ''leader'', ''follow'', ''follower'', ''ambos'') OR ca.role_baile IS NULL)::bigint
          ) AS por_rol,
          ''Clase #'' || ca.class_id::text AS nombre_clase,
          NULL::text AS fecha_clase,
          NULL::numeric AS precio_clase
        FROM public.clase_asistencias ca
        WHERE ca.teacher_id = p_teacher_id
          AND ca.status = ''tentative''
          -- ✅ FILTRAR: Solo fechas futuras o NULL (clases sin fecha específica)
          AND (ca.fecha_especifica IS NULL OR ca.fecha_especifica >= now_cdmx)
        GROUP BY ca.class_id;
        RETURN;
      END IF;

      -- Retornar métricas con detalles de clase (similar a get_academy_class_metrics)
      -- ... (código similar pero para teacher_id)
      RETURN QUERY
      SELECT 
        ca.class_id,
        COUNT(*)::bigint AS total_tentativos,
        jsonb_build_object(
          ''leader'', COUNT(*) FILTER (WHERE ca.role_baile IN (''lead'', ''leader''))::bigint,
          ''follower'', COUNT(*) FILTER (WHERE ca.role_baile IN (''follow'', ''follower''))::bigint,
          ''ambos'', COUNT(*) FILTER (WHERE ca.role_baile = ''ambos'')::bigint,
          ''otros'', COUNT(*) FILTER (WHERE ca.role_baile NOT IN (''lead'', ''leader'', ''follow'', ''follower'', ''ambos'') OR ca.role_baile IS NULL)::bigint
        ) AS por_rol,
        ''Clase #'' || ca.class_id::text AS nombre_clase,
        COALESCE(ca.fecha_especifica::text, NULL) AS fecha_clase,
        NULL::numeric AS precio_clase
      FROM public.clase_asistencias ca
      WHERE ca.teacher_id = p_teacher_id
        AND ca.status = ''tentative''
        -- ✅ FILTRAR: Solo fechas futuras o NULL (clases sin fecha específica)
        AND (ca.fecha_especifica IS NULL OR ca.fecha_especifica >= now_cdmx)
      GROUP BY ca.class_id, ca.fecha_especifica;
    END;
    $func$;
    ';
  END IF;
END $$;

COMMENT ON FUNCTION public.get_teacher_class_metrics(bigint) IS 
'Cuenta asistencias tentativas solo para fechas futuras o NULL. Fechas pasadas no se cuentan pero los registros se mantienen para métricas históricas.';

