-- ============================================================================
-- Academia 18: 3 clases dummy (Salsa, Bachata, Rock) + asistencias dummy
-- - Academia y clases NO visibles en front (estado_aprobacion = 'borrador')
-- - Sí visibles en back para el dueño (métricas, editor)
-- - Un usuario = una zona (primera zona del perfil)
-- - Todos con rol: leader, follower, ambos u otro
-- ============================================================================
-- Ejecutar en Supabase SQL Editor (postgres).

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Ocultar academia 18 en el front (solo visible en back para el dueño)
-- ----------------------------------------------------------------------------
UPDATE public.profiles_academy
SET estado_aprobacion = 'borrador'
WHERE id = 18;

-- Si la academia no existe, el script fallará aquí; créala antes o usa una id existente.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles_academy WHERE id = 18) THEN
    RAISE EXCEPTION 'Academia con id 18 no existe. Crea primero la academia.';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2) Añadir 3 clases al cronograma (Salsa, Bachata, Rock) si no existen
--    class_id: 180001, 180002, 180003
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_cronograma jsonb;
  v_zonas int[];
  v_ritmo_salsa bigint;
  v_ritmo_bachata bigint;
  v_ritmo_rock bigint;
  v_clase jsonb;
  v_has_salsa boolean := false;
  v_has_bachata boolean := false;
  v_has_rock boolean := false;
  i int;
BEGIN
  SELECT cronograma, COALESCE(zonas, ARRAY[1]) INTO v_cronograma, v_zonas
  FROM public.profiles_academy WHERE id = 18;

  -- Buscar ritmos por nombre (tipo = 'ritmo')
  SELECT id INTO v_ritmo_salsa FROM public.tags WHERE tipo = 'ritmo' AND lower(nombre) LIKE '%salsa%' LIMIT 1;
  SELECT id INTO v_ritmo_bachata FROM public.tags WHERE tipo = 'ritmo' AND lower(nombre) LIKE '%bachata%' LIMIT 1;
  SELECT id INTO v_ritmo_rock FROM public.tags WHERE tipo = 'ritmo' AND lower(nombre) LIKE '%rock%' LIMIT 1;

  v_cronograma := COALESCE(v_cronograma, '[]'::jsonb);

  FOR i IN 0..jsonb_array_length(v_cronograma) - 1 LOOP
    v_clase := v_cronograma->i;
    IF (v_clase->>'id')::bigint = 180001 THEN v_has_salsa := true; END IF;
    IF (v_clase->>'id')::bigint = 180002 THEN v_has_bachata := true; END IF;
    IF (v_clase->>'id')::bigint = 180003 THEN v_has_rock := true; END IF;
  END LOOP;

  IF NOT v_has_salsa THEN
    v_cronograma := v_cronograma || jsonb_build_array(
      jsonb_build_object(
        'id', 180001,
        'tipo', 'clase',
        'titulo', 'Salsa',
        'fechaModo', 'semanal',
        'diaSemana', 1,
        'diasSemana', jsonb_build_array('lunes'),
        'horarioModo', 'especifica',
        'inicio', '19:00',
        'fin', '20:00',
        'ritmoId', v_ritmo_salsa,
        'ritmoIds', COALESCE(to_jsonb(ARRAY[v_ritmo_salsa]), '[]'::jsonb),
        'zonaId', v_zonas[1],
        'referenciaCosto', '180001'
      )
    );
  END IF;
  IF NOT v_has_bachata THEN
    v_cronograma := v_cronograma || jsonb_build_array(
      jsonb_build_object(
        'id', 180002,
        'tipo', 'clase',
        'titulo', 'Bachata',
        'fechaModo', 'semanal',
        'diaSemana', 3,
        'diasSemana', jsonb_build_array('miércoles'),
        'horarioModo', 'especifica',
        'inicio', '20:00',
        'fin', '21:00',
        'ritmoId', v_ritmo_bachata,
        'ritmoIds', COALESCE(to_jsonb(ARRAY[v_ritmo_bachata]), '[]'::jsonb),
        'zonaId', v_zonas[1],
        'referenciaCosto', '180002'
      )
    );
  END IF;
  IF NOT v_has_rock THEN
    v_cronograma := v_cronograma || jsonb_build_array(
      jsonb_build_object(
        'id', 180003,
        'tipo', 'clase',
        'titulo', 'Rock',
        'fechaModo', 'semanal',
        'diaSemana', 5,
        'diasSemana', jsonb_build_array('viernes'),
        'horarioModo', 'especifica',
        'inicio', '19:30',
        'fin', '20:30',
        'ritmoId', v_ritmo_rock,
        'ritmoIds', COALESCE(to_jsonb(ARRAY[v_ritmo_rock]), '[]'::jsonb),
        'zonaId', v_zonas[1],
        'referenciaCosto', '180003'
      )
    );
  END IF;

  UPDATE public.profiles_academy SET cronograma = v_cronograma WHERE id = 18;
END $$;

-- ----------------------------------------------------------------------------
-- 3) Asistencias dummy: usuarios existentes, 1 zona por usuario, rol obligatorio
--    Cada (user_id, class_id, fecha_especifica) único. Roles: leader, follower, ambos, otro.
-- ----------------------------------------------------------------------------
WITH users_num AS (
  SELECT user_id, row_number() OVER () AS rn
  FROM (SELECT user_id FROM public.profiles_user WHERE user_id IS NOT NULL ORDER BY random() LIMIT 36) t
),
slots AS (
  SELECT
    u.user_id,
    (ARRAY[180001, 180002, 180003])[1 + ((u.rn + s.n) % 3)] AS class_id,
    (date_trunc('week', current_date)::date + (ARRAY[0, 2, 4])[1 + ((u.rn + s.n) % 3)] + (7 * (s.n % 3))) AS fecha_especifica,
    (ARRAY['leader', 'follower', 'ambos', 'otro'])[1 + ((u.rn + s.n) % 4)] AS role_baile
  FROM users_num u
  CROSS JOIN (SELECT generate_series(0, 5) AS n) s
)
INSERT INTO public.clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
SELECT
  s.user_id,
  s.class_id,
  18::bigint,
  s.role_baile,
  COALESCE((pu.zonas)[1], 1)::bigint,
  'tentative',
  s.fecha_especifica,
  now() - (random() * interval '5 days')
FROM slots s
JOIN public.profiles_user pu ON pu.user_id = s.user_id
ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;

-- Asegurar que todos los usuarios usados tengan rol permitido (lead, follow, ambos; 'otro' no está en el check de profiles_user)
UPDATE public.profiles_user pu
SET rol_baile = COALESCE(NULLIF(TRIM(pu.rol_baile), ''), 'ambos')
WHERE pu.user_id IN (
  SELECT user_id FROM public.clase_asistencias WHERE academy_id = 18
)
AND (pu.rol_baile IS NULL OR TRIM(pu.rol_baile) = '');

-- Asegurar que todos tengan al menos una zona
UPDATE public.profiles_user pu
SET zonas = CASE
  WHEN pu.zonas IS NULL OR array_length(pu.zonas, 1) IS NULL THEN ARRAY[1]
  ELSE pu.zonas
END
WHERE pu.user_id IN (
  SELECT user_id FROM public.clase_asistencias WHERE academy_id = 18
);

COMMIT;

-- ----------------------------------------------------------------------------
-- Resumen
-- ----------------------------------------------------------------------------
SELECT 'Academia 18' AS entidad, estado_aprobacion FROM public.profiles_academy WHERE id = 18;
SELECT class_id, COUNT(*) AS asistencias, COUNT(DISTINCT user_id) AS usuarios
FROM public.clase_asistencias WHERE academy_id = 18 AND status = 'tentative'
GROUP BY class_id ORDER BY class_id;
SELECT role_baile, COUNT(*) FROM public.clase_asistencias WHERE academy_id = 18 AND status = 'tentative' GROUP BY role_baile ORDER BY role_baile;
