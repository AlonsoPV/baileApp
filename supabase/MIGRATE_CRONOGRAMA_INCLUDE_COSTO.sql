-- ========================================
-- MIGRACIÓN: Incluir costo dentro de cada item del cronograma
-- ========================================
-- Este script agrega el costo directamente dentro de cada item del cronograma
-- para facilitar el acceso sin necesidad de buscar en el array de costos separado.
-- 
-- La estructura será:
-- cronograma[].costo = { id, nombre, tipo, precio, regla }
-- 
-- NOTA: Esto no elimina el array de costos, solo agrega una copia del costo
-- dentro de cada clase para acceso rápido.

DO $$
DECLARE
  academy_record RECORD;
  teacher_record RECORD;
  cronograma_array JSONB;
  costos_array JSONB;
  clase_item JSONB;
  costo_item JSONB;
  updated_cronograma JSONB;
  class_id TEXT;
  cronograma_index INT;
  referencia_costo TEXT;
  costo_encontrado BOOLEAN;
  updated_count INT := 0;
BEGIN
  -- ========================================
  -- 1. MIGRAR CRONOGRAMAS DE ACADEMIAS
  -- ========================================
  RAISE NOTICE '🔄 Migrando cronogramas de academias...';
  
  FOR academy_record IN 
    SELECT id, nombre_publico, cronograma, costos 
    FROM public.profiles_academy 
    WHERE cronograma IS NOT NULL 
      AND jsonb_typeof(cronograma) = 'array'
      AND jsonb_array_length(cronograma) > 0
  LOOP
    cronograma_array := academy_record.cronograma;
    costos_array := COALESCE(academy_record.costos, '[]'::JSONB);
    updated_cronograma := '[]'::JSONB;
    updated_count := 0;
    
    -- Iterar sobre cada clase en el cronograma
    FOR i IN 0..jsonb_array_length(cronograma_array) - 1 LOOP
      clase_item := cronograma_array->i;
      costo_encontrado := FALSE;
      
      -- Si la clase ya tiene costo, saltarla
      IF clase_item ? 'costo' AND (clase_item->'costo') IS NOT NULL THEN
        updated_cronograma := updated_cronograma || jsonb_build_array(clase_item);
        CONTINUE;
      END IF;
      
      -- Obtener identificadores de la clase
      class_id := clase_item->>'id';
      cronograma_index := i;
      referencia_costo := clase_item->>'referenciaCosto';
      
      -- Buscar el costo correspondiente en el array de costos
      -- Prioridad: 1) classId, 2) cronogramaIndex, 3) referenciaCosto, 4) nombre
      IF jsonb_typeof(costos_array) = 'array' AND jsonb_array_length(costos_array) > 0 THEN
        FOR j IN 0..jsonb_array_length(costos_array) - 1 LOOP
          costo_item := costos_array->j;
          
          -- Buscar por classId (más confiable)
          IF class_id IS NOT NULL AND costo_item ? 'classId' THEN
            IF (costo_item->>'classId') = class_id THEN
              clase_item := clase_item || jsonb_build_object('costo', costo_item);
              costo_encontrado := TRUE;
              EXIT;
            END IF;
          END IF;
          
          -- Buscar por cronogramaIndex
          IF NOT costo_encontrado AND costo_item ? 'cronogramaIndex' THEN
            IF (costo_item->>'cronogramaIndex')::INT = cronograma_index THEN
              clase_item := clase_item || jsonb_build_object('costo', costo_item);
              costo_encontrado := TRUE;
              EXIT;
            END IF;
          END IF;
          
          -- Buscar por referenciaCosto (puede ser ID o nombre)
          IF NOT costo_encontrado AND referencia_costo IS NOT NULL THEN
            IF (costo_item->>'referenciaCosto') = referencia_costo THEN
              clase_item := clase_item || jsonb_build_object('costo', costo_item);
              costo_encontrado := TRUE;
              EXIT;
            END IF;
          END IF;
          
          -- Buscar por nombre de la clase (fallback)
          IF NOT costo_encontrado THEN
            DECLARE
              clase_nombre TEXT := LOWER(TRIM(COALESCE(clase_item->>'titulo', clase_item->>'nombre', '')));
              costo_nombre TEXT := LOWER(TRIM(COALESCE(costo_item->>'nombre', '')));
            BEGIN
              IF clase_nombre != '' AND costo_nombre = clase_nombre THEN
                clase_item := clase_item || jsonb_build_object('costo', costo_item);
                costo_encontrado := TRUE;
                EXIT;
              END IF;
            END;
          END IF;
        END LOOP;
      END IF;
      
      -- Si no se encontró costo, agregar la clase sin costo
      IF NOT costo_encontrado THEN
        -- Opcional: agregar un objeto costo vacío o null
        -- clase_item := clase_item || jsonb_build_object('costo', NULL);
      END IF;
      
      updated_cronograma := updated_cronograma || jsonb_build_array(clase_item);
      
      IF costo_encontrado THEN
        updated_count := updated_count + 1;
      END IF;
    END LOOP;
    
    -- Actualizar solo si hubo cambios
    IF updated_count > 0 OR updated_cronograma != cronograma_array THEN
      UPDATE public.profiles_academy
      SET cronograma = updated_cronograma
      WHERE id = academy_record.id;
      
      RAISE NOTICE '  ✅ Academia ID % (%): % clases con costo agregado', 
        academy_record.id, 
        academy_record.nombre_publico,
        updated_count;
    END IF;
  END LOOP;
  
  -- ========================================
  -- 2. MIGRAR CRONOGRAMAS DE MAESTROS
  -- ========================================
  RAISE NOTICE '🔄 Migrando cronogramas de maestros...';
  
  FOR teacher_record IN 
    SELECT id, nombre_publico, cronograma, costos 
    FROM public.profiles_teacher 
    WHERE cronograma IS NOT NULL 
      AND jsonb_typeof(cronograma) = 'array'
      AND jsonb_array_length(cronograma) > 0
  LOOP
    cronograma_array := teacher_record.cronograma;
    costos_array := COALESCE(teacher_record.costos, '[]'::JSONB);
    updated_cronograma := '[]'::JSONB;
    updated_count := 0;
    
    -- Iterar sobre cada clase en el cronograma
    FOR i IN 0..jsonb_array_length(cronograma_array) - 1 LOOP
      clase_item := cronograma_array->i;
      costo_encontrado := FALSE;
      
      -- Si la clase ya tiene costo, saltarla
      IF clase_item ? 'costo' AND (clase_item->'costo') IS NOT NULL THEN
        updated_cronograma := updated_cronograma || jsonb_build_array(clase_item);
        CONTINUE;
      END IF;
      
      -- Obtener identificadores de la clase
      class_id := clase_item->>'id';
      cronograma_index := i;
      referencia_costo := clase_item->>'referenciaCosto';
      
      -- Buscar el costo correspondiente en el array de costos
      -- Prioridad: 1) classId, 2) cronogramaIndex, 3) referenciaCosto, 4) nombre
      IF jsonb_typeof(costos_array) = 'array' AND jsonb_array_length(costos_array) > 0 THEN
        FOR j IN 0..jsonb_array_length(costos_array) - 1 LOOP
          costo_item := costos_array->j;
          
          -- Buscar por classId (más confiable)
          IF class_id IS NOT NULL AND costo_item ? 'classId' THEN
            IF (costo_item->>'classId') = class_id THEN
              clase_item := clase_item || jsonb_build_object('costo', costo_item);
              costo_encontrado := TRUE;
              EXIT;
            END IF;
          END IF;
          
          -- Buscar por cronogramaIndex
          IF NOT costo_encontrado AND costo_item ? 'cronogramaIndex' THEN
            IF (costo_item->>'cronogramaIndex')::INT = cronograma_index THEN
              clase_item := clase_item || jsonb_build_object('costo', costo_item);
              costo_encontrado := TRUE;
              EXIT;
            END IF;
          END IF;
          
          -- Buscar por referenciaCosto (puede ser ID o nombre)
          IF NOT costo_encontrado AND referencia_costo IS NOT NULL THEN
            IF (costo_item->>'referenciaCosto') = referencia_costo THEN
              clase_item := clase_item || jsonb_build_object('costo', costo_item);
              costo_encontrado := TRUE;
              EXIT;
            END IF;
          END IF;
          
          -- Buscar por nombre de la clase (fallback)
          IF NOT costo_encontrado THEN
            DECLARE
              clase_nombre TEXT := LOWER(TRIM(COALESCE(clase_item->>'titulo', clase_item->>'nombre', '')));
              costo_nombre TEXT := LOWER(TRIM(COALESCE(costo_item->>'nombre', '')));
            BEGIN
              IF clase_nombre != '' AND costo_nombre = clase_nombre THEN
                clase_item := clase_item || jsonb_build_object('costo', costo_item);
                costo_encontrado := TRUE;
                EXIT;
              END IF;
            END;
          END IF;
        END LOOP;
      END IF;
      
      -- Si no se encontró costo, agregar la clase sin costo
      IF NOT costo_encontrado THEN
        -- Opcional: agregar un objeto costo vacío o null
        -- clase_item := clase_item || jsonb_build_object('costo', NULL);
      END IF;
      
      updated_cronograma := updated_cronograma || jsonb_build_array(clase_item);
      
      IF costo_encontrado THEN
        updated_count := updated_count + 1;
      END IF;
    END LOOP;
    
    -- Actualizar solo si hubo cambios
    IF updated_count > 0 OR updated_cronograma != cronograma_array THEN
      UPDATE public.profiles_teacher
      SET cronograma = updated_cronograma
      WHERE id = teacher_record.id;
      
      RAISE NOTICE '  ✅ Maestro ID % (%): % clases con costo agregado', 
        teacher_record.id, 
        teacher_record.nombre_publico,
        updated_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Migración completada';
END $$;

-- ========================================
-- 3. VERIFICAR RESULTADOS
-- ========================================
SELECT 
  'Academias' as tipo,
  COUNT(*) FILTER (WHERE cronograma IS NOT NULL AND jsonb_typeof(cronograma) = 'array' AND jsonb_array_length(cronograma) > 0) as total_perfiles,
  SUM(jsonb_array_length(cronograma)) FILTER (WHERE cronograma IS NOT NULL AND jsonb_typeof(cronograma) = 'array') as total_clases,
  SUM(
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(cronograma) AS clase 
     WHERE clase ? 'costo' AND (clase->'costo') IS NOT NULL)
  ) FILTER (WHERE cronograma IS NOT NULL AND jsonb_typeof(cronograma) = 'array') as clases_con_costo
FROM public.profiles_academy

UNION ALL

SELECT 
  'Maestros' as tipo,
  COUNT(*) FILTER (WHERE cronograma IS NOT NULL AND jsonb_typeof(cronograma) = 'array' AND jsonb_array_length(cronograma) > 0) as total_perfiles,
  SUM(jsonb_array_length(cronograma)) FILTER (WHERE cronograma IS NOT NULL AND jsonb_typeof(cronograma) = 'array') as total_clases,
  SUM(
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(cronograma) AS clase 
     WHERE clase ? 'costo' AND (clase->'costo') IS NOT NULL)
  ) FILTER (WHERE cronograma IS NOT NULL AND jsonb_typeof(cronograma) = 'array') as clases_con_costo
FROM public.profiles_teacher;

-- ========================================
-- 4. EJEMPLO DE CRONOGRAMA ACTUALIZADO
-- ========================================
SELECT 
  'Ejemplo de cronograma de academia' as ejemplo,
  id,
  nombre_publico,
  jsonb_pretty(
    jsonb_build_array(
      jsonb_array_elements(cronograma)->'titulo',
      jsonb_array_elements(cronograma)->'costo'
    )
  ) as clases_con_costo
FROM public.profiles_academy
WHERE cronograma IS NOT NULL 
  AND jsonb_typeof(cronograma) = 'array'
  AND jsonb_array_length(cronograma) > 0
LIMIT 1;

-- ========================================
-- 5. VER DETALLE DE UNA CLASE CON COSTO
-- ========================================
SELECT 
  'Detalle de clase con costo' as ejemplo,
  id,
  nombre_publico,
  jsonb_pretty(cronograma->0) as primera_clase
FROM public.profiles_academy
WHERE cronograma IS NOT NULL 
  AND jsonb_typeof(cronograma) = 'array'
  AND jsonb_array_length(cronograma) > 0
  AND cronograma->0 ? 'costo'
LIMIT 1;

