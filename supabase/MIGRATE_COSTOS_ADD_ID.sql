-- ========================================
-- MIGRACIÓN: Agregar ID a costos existentes
-- ========================================
-- Este script agrega un campo `id` único a todos los costos que no lo tengan
-- en las tablas profiles_academy y profiles_teacher
-- 
-- NOTA: Los costos se almacenan como JSONB, por lo que no necesitamos
-- modificar el esquema de la tabla, solo actualizar los datos existentes.

DO $$
DECLARE
  academy_record RECORD;
  teacher_record RECORD;
  costos_array JSONB;
  costo_item JSONB;
  updated_costos JSONB;
  new_id BIGINT;
  updated_count INT := 0;
BEGIN
  -- ========================================
  -- 1. MIGRAR COSTOS DE ACADEMIAS
  -- ========================================
  RAISE NOTICE '🔄 Migrando costos de academias...';
  
  FOR academy_record IN 
    SELECT id, costos 
    FROM public.profiles_academy 
    WHERE costos IS NOT NULL 
      AND jsonb_typeof(costos) = 'array'
      AND jsonb_array_length(costos) > 0
  LOOP
    costos_array := academy_record.costos;
    updated_costos := '[]'::JSONB;
    updated_count := 0;
    
    -- Iterar sobre cada costo en el array
    FOR i IN 0..jsonb_array_length(costos_array) - 1 LOOP
      costo_item := costos_array->i;
      
      -- Si el costo no tiene ID, agregarlo
      IF NOT (costo_item ? 'id') OR (costo_item->>'id') IS NULL THEN
        -- Generar ID único basado en timestamp + índice
        new_id := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT + i;
        costo_item := costo_item || jsonb_build_object('id', new_id);
        updated_count := updated_count + 1;
      END IF;
      
      updated_costos := updated_costos || jsonb_build_array(costo_item);
    END LOOP;
    
    -- Actualizar solo si hubo cambios
    IF updated_count > 0 THEN
      UPDATE public.profiles_academy
      SET costos = updated_costos
      WHERE id = academy_record.id;
      
      RAISE NOTICE '  ✅ Academia ID %: % costos actualizados', academy_record.id, updated_count;
    END IF;
  END LOOP;
  
  -- ========================================
  -- 2. MIGRAR COSTOS DE MAESTROS
  -- ========================================
  RAISE NOTICE '🔄 Migrando costos de maestros...';
  
  FOR teacher_record IN 
    SELECT id, costos 
    FROM public.profiles_teacher 
    WHERE costos IS NOT NULL 
      AND jsonb_typeof(costos) = 'array'
      AND jsonb_array_length(costos) > 0
  LOOP
    costos_array := teacher_record.costos;
    updated_costos := '[]'::JSONB;
    updated_count := 0;
    
    -- Iterar sobre cada costo en el array
    FOR i IN 0..jsonb_array_length(costos_array) - 1 LOOP
      costo_item := costos_array->i;
      
      -- Si el costo no tiene ID, agregarlo
      IF NOT (costo_item ? 'id') OR (costo_item->>'id') IS NULL THEN
        -- Generar ID único basado en timestamp + índice
        new_id := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT + i + 1000000; -- Offset para evitar colisiones
        costo_item := costo_item || jsonb_build_object('id', new_id);
        updated_count := updated_count + 1;
      END IF;
      
      updated_costos := updated_costos || jsonb_build_array(costo_item);
    END LOOP;
    
    -- Actualizar solo si hubo cambios
    IF updated_count > 0 THEN
      UPDATE public.profiles_teacher
      SET costos = updated_costos
      WHERE id = teacher_record.id;
      
      RAISE NOTICE '  ✅ Maestro ID %: % costos actualizados', teacher_record.id, updated_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Migración completada';
END $$;

-- ========================================
-- 3. VERIFICAR RESULTADOS
-- ========================================
SELECT 
  'Academias con costos' as tipo,
  COUNT(*) FILTER (WHERE costos IS NOT NULL AND jsonb_typeof(costos) = 'array' AND jsonb_array_length(costos) > 0) as total_perfiles,
  SUM(jsonb_array_length(costos)) FILTER (WHERE costos IS NOT NULL AND jsonb_typeof(costos) = 'array') as total_costos,
  SUM(
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(costos) AS costo 
     WHERE costo ? 'id' AND (costo->>'id') IS NOT NULL)
  ) FILTER (WHERE costos IS NOT NULL AND jsonb_typeof(costos) = 'array') as costos_con_id
FROM public.profiles_academy

UNION ALL

SELECT 
  'Maestros con costos' as tipo,
  COUNT(*) FILTER (WHERE costos IS NOT NULL AND jsonb_typeof(costos) = 'array' AND jsonb_array_length(costos) > 0) as total_perfiles,
  SUM(jsonb_array_length(costos)) FILTER (WHERE costos IS NOT NULL AND jsonb_typeof(costos) = 'array') as total_costos,
  SUM(
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(costos) AS costo 
     WHERE costo ? 'id' AND (costo->>'id') IS NOT NULL)
  ) FILTER (WHERE costos IS NOT NULL AND jsonb_typeof(costos) = 'array') as costos_con_id
FROM public.profiles_teacher;

-- ========================================
-- 4. EJEMPLO DE COSTOS ACTUALIZADOS
-- ========================================
SELECT 
  'Ejemplo de costos de academia' as ejemplo,
  id,
  nombre_publico,
  jsonb_pretty(costos) as costos
FROM public.profiles_academy
WHERE costos IS NOT NULL 
  AND jsonb_typeof(costos) = 'array'
  AND jsonb_array_length(costos) > 0
LIMIT 1;

