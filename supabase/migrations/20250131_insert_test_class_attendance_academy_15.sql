-- ============================================================================
-- 📝 INSERTAR DATOS DE PRUEBA DE ASISTENCIAS A CLASES - ACADEMIA 15
-- ============================================================================
-- Este script genera datos de prueba de asistencias tentativas para las clases
-- de la academia 15 durante enero 2026.
-- 
-- Clases incluidas:
-- - 17630664842505942: Bachata Tradicional (Sábado 13:00-14:00, zona 8, ritmo 11)
-- - 17630664842509348: Bachata Moderna (Sábado 14:00-15:00, zona 8, ritmo 2)
-- - 17630664842505916: Bachata (Lunes 20:00-21:00, zona 8, ritmo 2)
-- - 17630664842503890: Salsa On 1 y Salsa On 2 (Lunes 21:00-22:00, zona 8, ritmo 1)
-- - 17630664842508124: Bachata Partner Work (Martes 20:00-21:00, zona 8, ritmo 2)
-- - 17630664842504376: Salsa On 1 (Martes 21:00-22:00, zona 8, ritmo 1)
-- - 17630664842506504: Bachata Partner Work (Jueves 20:00-22:00, zona 8, ritmo 2)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 0: CORREGIR SECUENCIA (si está desincronizada)
-- ============================================================================

DO $$
DECLARE
  max_id bigint;
  current_seq_value bigint;
BEGIN
  -- Obtener el máximo ID actual en la tabla
  SELECT COALESCE(MAX(id), 0) INTO max_id
  FROM public.clase_asistencias;
  
  -- Obtener el valor actual de la secuencia
  SELECT COALESCE(last_value, 0) INTO current_seq_value
  FROM pg_sequences
  WHERE schemaname = 'public' 
    AND sequencename = 'clase_asistencias_id_seq';
  
  -- Si la secuencia está desincronizada, corregirla
  IF current_seq_value <= max_id THEN
    RAISE NOTICE '⚠️  Corrigiendo secuencia desincronizada (max_id: %, seq: %)', max_id, current_seq_value;
    
    -- Resetear la secuencia al siguiente valor disponible
    PERFORM setval(
      'public.clase_asistencias_id_seq',
      max_id + 1,
      false
    );
    
    RAISE NOTICE '✅ Secuencia corregida. Próximo ID será: %', max_id + 1;
  END IF;
END $$;

-- ============================================================================
-- PARTE 1: VERIFICAR USUARIOS DISPONIBLES
-- ============================================================================

DO $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM public.profiles_user 
  WHERE user_id IS NOT NULL;
  
  IF user_count < 5 THEN
    RAISE WARNING '⚠️  Solo hay % usuarios en la base de datos. Algunos registros pueden fallar si no hay suficientes usuarios.', user_count;
  ELSE
    RAISE NOTICE '✅ Hay % usuarios disponibles para las pruebas', user_count;
  END IF;
END $$;

-- ============================================================================
-- PARTE 2: INSERTAR ASISTENCIAS DE PRUEBA
-- ============================================================================

-- 3.1 Bachata Tradicional (Sábado 13:00-14:00, zona 8, ritmo 11)
-- Fechas: 4, 11, 18, 25 de enero 2026 (sábados)
INSERT INTO public.clase_asistencias (
  user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at
)
SELECT 
  u.user_id,
  17630664842505942::bigint,
  15::bigint,
  CASE (random() * 3)::int
    WHEN 0 THEN 'leader'
    WHEN 1 THEN 'follower'
    ELSE 'ambos'
  END::text,
  CASE (random() * 5)::int
    WHEN 0 THEN 8  -- Zona original
    WHEN 1 THEN 1  -- Variar zonas
    WHEN 2 THEN 2
    WHEN 3 THEN 3
    ELSE 4
  END::bigint,
  'tentative',
  fecha,
  NOW() - (random() * interval '30 days')
FROM (
  SELECT '2026-01-04'::date as fecha
  UNION ALL SELECT '2026-01-11'::date
  UNION ALL SELECT '2026-01-18'::date
  UNION ALL SELECT '2026-01-25'::date
) fechas
CROSS JOIN (
  SELECT user_id 
  FROM public.profiles_user 
  WHERE user_id IS NOT NULL
  ORDER BY random()
  LIMIT 8  -- Máximo 8 usuarios por fecha
) u
ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;

-- 3.2 Bachata Moderna (Sábado 14:00-15:00, zona 8, ritmo 2)
-- Fechas: 4, 11, 18, 25 de enero 2026 (sábados)
INSERT INTO public.clase_asistencias (
  user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at
)
SELECT 
  u.user_id,
  17630664842509348::bigint,
  15::bigint,
  CASE (random() * 3)::int
    WHEN 0 THEN 'leader'
    WHEN 1 THEN 'follower'
    ELSE 'ambos'
  END::text,
  CASE (random() * 5)::int
    WHEN 0 THEN 8
    WHEN 1 THEN 5
    WHEN 2 THEN 6
    WHEN 3 THEN 7
    ELSE 8
  END::bigint,
  'tentative',
  fecha,
  NOW() - (random() * interval '30 days')
FROM (
  SELECT '2026-01-04'::date as fecha
  UNION ALL SELECT '2026-01-11'::date
  UNION ALL SELECT '2026-01-18'::date
  UNION ALL SELECT '2026-01-25'::date
) fechas
CROSS JOIN (
  SELECT user_id 
  FROM public.profiles_user 
  WHERE user_id IS NOT NULL
  ORDER BY random()
  LIMIT 8  -- Máximo 8 usuarios por fecha
) u
ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;

-- 3.3 Bachata (Lunes 20:00-21:00, zona 8, ritmo 2)
-- Fechas: 6, 13, 20, 27 de enero 2026 (lunes)
INSERT INTO public.clase_asistencias (
  user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at
)
SELECT 
  u.user_id,
  17630664842505916::bigint,
  15::bigint,
  CASE (random() * 4)::int
    WHEN 0 THEN 'leader'
    WHEN 1 THEN 'follower'
    WHEN 2 THEN 'ambos'
    ELSE NULL
  END::text,
  CASE (random() * 6)::int
    WHEN 0 THEN 8
    WHEN 1 THEN 1
    WHEN 2 THEN 2
    WHEN 3 THEN 3
    WHEN 4 THEN 4
    ELSE 5
  END::bigint,
  'tentative',
  fecha,
  NOW() - (random() * interval '30 days')
FROM (
  SELECT '2026-01-06'::date as fecha
  UNION ALL SELECT '2026-01-13'::date
  UNION ALL SELECT '2026-01-20'::date
  UNION ALL SELECT '2026-01-27'::date
) fechas
CROSS JOIN (
  SELECT user_id 
  FROM public.profiles_user 
  WHERE user_id IS NOT NULL
  ORDER BY random()
  LIMIT 11  -- Máximo 11 usuarios por fecha
) u
ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;

-- 3.4 Salsa On 1 y Salsa On 2 (Lunes 21:00-22:00, zona 8, ritmo 1)
-- Fechas: 6, 13, 20, 27 de enero 2026 (lunes)
INSERT INTO public.clase_asistencias (
  user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at
)
SELECT 
  u.user_id,
  17630664842503890::bigint,
  15::bigint,
  CASE (random() * 3)::int
    WHEN 0 THEN 'leader'
    WHEN 1 THEN 'follower'
    ELSE 'ambos'
  END::text,
  CASE (random() * 5)::int
    WHEN 0 THEN 8
    WHEN 1 THEN 1
    WHEN 2 THEN 2
    WHEN 3 THEN 3
    ELSE 4
  END::bigint,
  'tentative',
  fecha,
  NOW() - (random() * interval '30 days')
FROM (
  SELECT '2026-01-06'::date as fecha
  UNION ALL SELECT '2026-01-13'::date
  UNION ALL SELECT '2026-01-20'::date
  UNION ALL SELECT '2026-01-27'::date
) fechas
CROSS JOIN (
  SELECT user_id 
  FROM public.profiles_user 
  WHERE user_id IS NOT NULL
  ORDER BY random()
  LIMIT 8  -- Máximo 8 usuarios por fecha
) u
ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;

-- 3.5 Bachata Partner Work (Martes 20:00-21:00, zona 8, ritmo 2)
-- Fechas: 7, 14, 21, 28 de enero 2026 (martes)
INSERT INTO public.clase_asistencias (
  user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at
)
SELECT 
  u.user_id,
  17630664842508124::bigint,
  15::bigint,
  CASE (random() * 3)::int
    WHEN 0 THEN 'leader'
    WHEN 1 THEN 'follower'
    ELSE 'ambos'
  END::text,
  CASE (random() * 5)::int
    WHEN 0 THEN 8
    WHEN 1 THEN 1
    WHEN 2 THEN 2
    WHEN 3 THEN 3
    ELSE 4
  END::bigint,
  'tentative',
  fecha,
  NOW() - (random() * interval '30 days')
FROM (
  SELECT '2026-01-07'::date as fecha
  UNION ALL SELECT '2026-01-14'::date
  UNION ALL SELECT '2026-01-21'::date
  UNION ALL SELECT '2026-01-28'::date
) fechas
CROSS JOIN (
  SELECT user_id 
  FROM public.profiles_user 
  WHERE user_id IS NOT NULL
  ORDER BY random()
  LIMIT 11  -- Máximo 11 usuarios por fecha
) u
ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;

-- 3.6 Salsa On 1 (Martes 21:00-22:00, zona 8, ritmo 1)
-- Fechas: 7, 14, 21, 28 de enero 2026 (martes)
INSERT INTO public.clase_asistencias (
  user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at
)
SELECT 
  u.user_id,
  17630664842504376::bigint,
  15::bigint,
  CASE (random() * 3)::int
    WHEN 0 THEN 'leader'
    WHEN 1 THEN 'follower'
    ELSE 'ambos'
  END::text,
  CASE (random() * 5)::int
    WHEN 0 THEN 8
    WHEN 1 THEN 1
    WHEN 2 THEN 2
    WHEN 3 THEN 3
    ELSE 4
  END::bigint,
  'tentative',
  fecha,
  NOW() - (random() * interval '30 days')
FROM (
  SELECT '2026-01-07'::date as fecha
  UNION ALL SELECT '2026-01-14'::date
  UNION ALL SELECT '2026-01-21'::date
  UNION ALL SELECT '2026-01-28'::date
) fechas
CROSS JOIN (
  SELECT user_id 
  FROM public.profiles_user 
  WHERE user_id IS NOT NULL
  ORDER BY random()
  LIMIT 9  -- Máximo 9 usuarios por fecha
) u
ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;

-- 3.7 Bachata Partner Work (Jueves 20:00-22:00, zona 8, ritmo 2)
-- Fechas: 2, 9, 16, 23, 30 de enero 2026 (jueves)
INSERT INTO public.clase_asistencias (
  user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at
)
SELECT 
  u.user_id,
  17630664842506504::bigint,
  15::bigint,
  CASE (random() * 3)::int
    WHEN 0 THEN 'leader'
    WHEN 1 THEN 'follower'
    ELSE 'ambos'
  END::text,
  CASE (random() * 5)::int
    WHEN 0 THEN 8
    WHEN 1 THEN 1
    WHEN 2 THEN 2
    WHEN 3 THEN 3
    ELSE 4
  END::bigint,
  'tentative',
  fecha,
  NOW() - (random() * interval '30 days')
FROM (
  SELECT '2026-01-02'::date as fecha
  UNION ALL SELECT '2026-01-09'::date
  UNION ALL SELECT '2026-01-16'::date
  UNION ALL SELECT '2026-01-23'::date
  UNION ALL SELECT '2026-01-30'::date
) fechas
CROSS JOIN (
  SELECT user_id 
  FROM public.profiles_user 
  WHERE user_id IS NOT NULL
  ORDER BY random()
  LIMIT 13  -- Máximo 13 usuarios por fecha
) u
ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN Y RESUMEN
-- ============================================================================

-- Resumen por clase
SELECT 
  class_id,
  COUNT(*) as total_asistencias,
  COUNT(DISTINCT user_id) as usuarios_unicos,
  COUNT(DISTINCT fecha_especifica) as fechas_unicas,
  COUNT(DISTINCT zona_tag_id) as zonas_unicas,
  COUNT(DISTINCT role_baile) as roles_unicos
FROM public.clase_asistencias
WHERE academy_id = 15
  AND fecha_especifica >= '2026-01-01'::date
  AND fecha_especifica < '2026-02-01'::date
GROUP BY class_id
ORDER BY class_id;

-- Resumen por fecha
SELECT 
  fecha_especifica,
  COUNT(*) as total_asistencias,
  COUNT(DISTINCT user_id) as usuarios_unicos,
  COUNT(DISTINCT class_id) as clases_unicas
FROM public.clase_asistencias
WHERE academy_id = 15
  AND fecha_especifica >= '2026-01-01'::date
  AND fecha_especifica < '2026-02-01'::date
GROUP BY fecha_especifica
ORDER BY fecha_especifica;

-- Resumen por zona
SELECT 
  zona_tag_id,
  COUNT(*) as total_asistencias,
  COUNT(DISTINCT user_id) as usuarios_unicos,
  COUNT(DISTINCT class_id) as clases_unicas
FROM public.clase_asistencias
WHERE academy_id = 15
  AND fecha_especifica >= '2026-01-01'::date
  AND fecha_especifica < '2026-02-01'::date
GROUP BY zona_tag_id
ORDER BY zona_tag_id;

-- Resumen por rol de baile
SELECT 
  role_baile,
  COUNT(*) as total_asistencias,
  COUNT(DISTINCT user_id) as usuarios_unicos
FROM public.clase_asistencias
WHERE academy_id = 15
  AND fecha_especifica >= '2026-01-01'::date
  AND fecha_especifica < '2026-02-01'::date
GROUP BY role_baile
ORDER BY role_baile;

-- Total general
SELECT 
  COUNT(*) as total_asistencias,
  COUNT(DISTINCT user_id) as usuarios_unicos,
  COUNT(DISTINCT class_id) as clases_unicas,
  COUNT(DISTINCT fecha_especifica) as fechas_unicas,
  MIN(fecha_especifica) as primera_fecha,
  MAX(fecha_especifica) as ultima_fecha
FROM public.clase_asistencias
WHERE academy_id = 15
  AND fecha_especifica >= '2026-01-01'::date
  AND fecha_especifica < '2026-02-01'::date;

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- ✅ Se insertaron datos de prueba de asistencias para todas las clases de la academia 15
-- ✅ Fechas cubiertas: Enero 2026 (según días de la semana de cada clase)
-- ✅ Variación en: usuarios, zonas (1-8), roles de baile (leader, follower, ambos, null)
-- ✅ Se usa ON CONFLICT DO NOTHING para evitar duplicados
-- ✅ Las fechas específicas corresponden a los días de la semana de cada clase:
--    - Lunes: 6, 13, 20, 27 de enero
--    - Martes: 7, 14, 21, 28 de enero
--    - Jueves: 2, 9, 16, 23, 30 de enero
--    - Sábado: 4, 11, 18, 25 de enero
-- ============================================================================

