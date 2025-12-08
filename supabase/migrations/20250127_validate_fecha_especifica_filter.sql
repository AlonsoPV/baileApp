-- Script de validación para el filtro de fecha_especifica
-- Este script verifica que el filtro funciona correctamente

-- 1) Verificar casos de prueba del filtro
DO $$
DECLARE
  now_cdmx date;
  test_cases record;
BEGIN
  -- Obtener fecha actual en CDMX
  now_cdmx := (NOW() AT TIME ZONE 'America/Mexico_City')::date;
  
  RAISE NOTICE '=== VALIDACIÓN DEL FILTRO fecha_especifica ===';
  RAISE NOTICE 'Fecha actual (CDMX): %', now_cdmx;
  RAISE NOTICE '';
  
  -- Caso 1: fecha_especifica IS NULL (debe incluirse)
  RAISE NOTICE 'Caso 1: fecha_especifica IS NULL';
  RAISE NOTICE '  Filtro: (fecha_especifica IS NULL OR fecha_especifica >= %)', now_cdmx;
  RAISE NOTICE '  Resultado esperado: INCLUIDO (clases sin fecha específica)';
  RAISE NOTICE '';
  
  -- Caso 2: fecha_especifica es de hoy (debe incluirse)
  RAISE NOTICE 'Caso 2: fecha_especifica = % (hoy)', now_cdmx;
  RAISE NOTICE '  Filtro: (fecha_especifica IS NULL OR fecha_especifica >= %)', now_cdmx;
  RAISE NOTICE '  Resultado esperado: INCLUIDO (>= es true)';
  RAISE NOTICE '';
  
  -- Caso 3: fecha_especifica es mañana (debe incluirse)
  RAISE NOTICE 'Caso 3: fecha_especifica = % (mañana)', now_cdmx + 1;
  RAISE NOTICE '  Filtro: (fecha_especifica IS NULL OR fecha_especifica >= %)', now_cdmx;
  RAISE NOTICE '  Resultado esperado: INCLUIDO (>= es true)';
  RAISE NOTICE '';
  
  -- Caso 4: fecha_especifica es ayer (NO debe incluirse)
  RAISE NOTICE 'Caso 4: fecha_especifica = % (ayer)', now_cdmx - 1;
  RAISE NOTICE '  Filtro: (fecha_especifica IS NULL OR fecha_especifica >= %)', now_cdmx;
  RAISE NOTICE '  Resultado esperado: EXCLUIDO (< es false)';
  RAISE NOTICE '';
  
  RAISE NOTICE '=== FIN VALIDACIÓN ===';
END $$;

-- 2) Verificar datos reales en clase_asistencias
-- Contar registros por tipo de fecha_especifica
SELECT 
  'Resumen de clase_asistencias' AS info,
  COUNT(*) AS total_registros,
  COUNT(*) FILTER (WHERE fecha_especifica IS NULL) AS sin_fecha_especifica,
  COUNT(*) FILTER (WHERE fecha_especifica IS NOT NULL) AS con_fecha_especifica,
  COUNT(*) FILTER (WHERE fecha_especifica IS NOT NULL AND fecha_especifica >= (NOW() AT TIME ZONE 'America/Mexico_City')::date) AS fechas_futuras_o_hoy,
  COUNT(*) FILTER (WHERE fecha_especifica IS NOT NULL AND fecha_especifica < (NOW() AT TIME ZONE 'America/Mexico_City')::date) AS fechas_pasadas
FROM public.clase_asistencias
WHERE status = 'tentative';

-- 3) Verificar que el filtro funciona correctamente
-- Mostrar registros que serían incluidos vs excluidos
SELECT 
  'Registros que SERÍAN INCLUIDOS (fecha futura o NULL)' AS tipo,
  COUNT(*) AS cantidad
FROM public.clase_asistencias
WHERE status = 'tentative'
  AND (fecha_especifica IS NULL OR fecha_especifica >= (NOW() AT TIME ZONE 'America/Mexico_City')::date)

UNION ALL

SELECT 
  'Registros que SERÍAN EXCLUIDOS (fecha pasada)' AS tipo,
  COUNT(*) AS cantidad
FROM public.clase_asistencias
WHERE status = 'tentative'
  AND fecha_especifica IS NOT NULL
  AND fecha_especifica < (NOW() AT TIME ZONE 'America/Mexico_City')::date;

-- 4) Ejemplo de consulta con el filtro aplicado (solo para academias)
-- Esto muestra cómo se verían los datos después de aplicar el filtro
SELECT 
  ca.academy_id,
  ca.class_id,
  ca.fecha_especifica,
  COUNT(*) AS total_tentativos
FROM public.clase_asistencias ca
WHERE ca.status = 'tentative'
  AND ca.academy_id IS NOT NULL
  -- ✅ FILTRAR: Solo fechas futuras o NULL (clases sin fecha específica)
  AND (ca.fecha_especifica IS NULL OR ca.fecha_especifica >= (NOW() AT TIME ZONE 'America/Mexico_City')::date)
GROUP BY ca.academy_id, ca.class_id, ca.fecha_especifica
ORDER BY ca.academy_id, ca.class_id, ca.fecha_especifica NULLS LAST
LIMIT 20;

-- 5) Verificar índices para optimización
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'clase_asistencias'
  AND indexname LIKE '%fecha_especifica%';

