-- ========================================
-- MIGRACIÓN: Añadir campos descripcion, fechaModo, horarioModo y duracionHoras a clases existentes
-- ========================================
-- Este script agrega campos opcionales a clases existentes en el cronograma:
-- - descripcion: Descripción de la clase
-- - fechaModo: 'especifica' | 'semanal' | 'por_agendar'
-- - horarioModo: 'especifica' | 'duracion'
-- - duracionHoras: Duración en horas (si horarioModo = 'duracion')
-- 
-- NOTA: Estos campos son opcionales. Las clases nuevas los tendrán automáticamente.
-- Este script solo establece valores por defecto para clases existentes.

DO $$
DECLARE
  academy_record RECORD;
  teacher_record RECORD;
  cronograma_array JSONB;
  clase_item JSONB;
  updated_cronograma JSONB;
  updated_item JSONB;
  fecha_modo TEXT;
  horario_modo TEXT;
  updated_count INT := 0;
  total_updated INT := 0;
BEGIN
  -- ========================================
  -- 1. MIGRAR CRONOGRAMAS DE ACADEMIAS
  -- ========================================
  RAISE NOTICE '🔄 Migrando cronogramas de academias...';
  
  FOR academy_record IN 
    SELECT id, nombre_publico, cronograma 
    FROM public.profiles_academy 
    WHERE cronograma IS NOT NULL 
      AND jsonb_typeof(cronograma) = 'array'
      AND jsonb_array_length(cronograma) > 0
  LOOP
    cronograma_array := academy_record.cronograma;
    updated_cronograma := '[]'::JSONB;
    updated_count := 0;
    
    -- Iterar sobre cada clase en el cronograma
    FOR i IN 0..jsonb_array_length(cronograma_array) - 1 LOOP
      clase_item := cronograma_array->i;
      updated_item := clase_item;
      fecha_modo := NULL;
      horario_modo := NULL;
      
      -- Inferir fechaModo si no existe
      IF NOT (clase_item ? 'fechaModo') THEN
        IF clase_item ? 'fecha' AND (clase_item->>'fecha') IS NOT NULL AND (clase_item->>'fecha') != '' THEN
          fecha_modo := 'especifica';
        ELSIF clase_item ? 'diaSemana' AND (clase_item->>'diaSemana') IS NOT NULL THEN
          fecha_modo := 'semanal';
        ELSIF (NOT (clase_item ? 'fecha') OR (clase_item->>'fecha') IS NULL OR (clase_item->>'fecha') = '')
          AND (NOT (clase_item ? 'diaSemana') OR (clase_item->>'diaSemana') IS NULL) THEN
          fecha_modo := 'por_agendar';
        ELSE
          fecha_modo := 'especifica'; -- Por defecto
        END IF;
        updated_item := updated_item || jsonb_build_object('fechaModo', fecha_modo);
      END IF;
      
      -- Inferir horarioModo si no existe
      IF NOT (clase_item ? 'horarioModo') THEN
        IF clase_item ? 'duracionHoras' AND (clase_item->>'duracionHoras') IS NOT NULL THEN
          horario_modo := 'duracion';
        ELSE
          horario_modo := 'especifica'; -- Por defecto
        END IF;
        updated_item := updated_item || jsonb_build_object('horarioModo', horario_modo);
      END IF;
      
      -- Si no tiene descripcion, agregar null explícitamente (opcional)
      -- No lo hacemos porque null es el valor por defecto
      
      -- Verificar si hubo cambios
      IF updated_item != clase_item THEN
        updated_count := updated_count + 1;
      END IF;
      
      updated_cronograma := updated_cronograma || jsonb_build_array(updated_item);
    END LOOP;
    
    -- Actualizar solo si hubo cambios
    IF updated_count > 0 THEN
      UPDATE public.profiles_academy
      SET cronograma = updated_cronograma
      WHERE id = academy_record.id;
      
      total_updated := total_updated + updated_count;
      RAISE NOTICE '  ✅ Academia ID % (%): % clases actualizadas', 
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
    SELECT id, nombre_publico, cronograma 
    FROM public.profiles_teacher 
    WHERE cronograma IS NOT NULL 
      AND jsonb_typeof(cronograma) = 'array'
      AND jsonb_array_length(cronograma) > 0
  LOOP
    cronograma_array := teacher_record.cronograma;
    updated_cronograma := '[]'::JSONB;
    updated_count := 0;
    
    -- Iterar sobre cada clase en el cronograma
    FOR i IN 0..jsonb_array_length(cronograma_array) - 1 LOOP
      clase_item := cronograma_array->i;
      updated_item := clase_item;
      fecha_modo := NULL;
      horario_modo := NULL;
      
      -- Inferir fechaModo si no existe
      IF NOT (clase_item ? 'fechaModo') THEN
        IF clase_item ? 'fecha' AND (clase_item->>'fecha') IS NOT NULL AND (clase_item->>'fecha') != '' THEN
          fecha_modo := 'especifica';
        ELSIF clase_item ? 'diaSemana' AND (clase_item->>'diaSemana') IS NOT NULL THEN
          fecha_modo := 'semanal';
        ELSIF (NOT (clase_item ? 'fecha') OR (clase_item->>'fecha') IS NULL OR (clase_item->>'fecha') = '')
          AND (NOT (clase_item ? 'diaSemana') OR (clase_item->>'diaSemana') IS NULL) THEN
          fecha_modo := 'por_agendar';
        ELSE
          fecha_modo := 'especifica'; -- Por defecto
        END IF;
        updated_item := updated_item || jsonb_build_object('fechaModo', fecha_modo);
      END IF;
      
      -- Inferir horarioModo si no existe
      IF NOT (clase_item ? 'horarioModo') THEN
        IF clase_item ? 'duracionHoras' AND (clase_item->>'duracionHoras') IS NOT NULL THEN
          horario_modo := 'duracion';
        ELSE
          horario_modo := 'especifica'; -- Por defecto
        END IF;
        updated_item := updated_item || jsonb_build_object('horarioModo', horario_modo);
      END IF;
      
      -- Verificar si hubo cambios
      IF updated_item != clase_item THEN
        updated_count := updated_count + 1;
      END IF;
      
      updated_cronograma := updated_cronograma || jsonb_build_array(updated_item);
    END LOOP;
    
    -- Actualizar solo si hubo cambios
    IF updated_count > 0 THEN
      UPDATE public.profiles_teacher
      SET cronograma = updated_cronograma
      WHERE id = teacher_record.id;
      
      total_updated := total_updated + updated_count;
      RAISE NOTICE '  ✅ Maestro ID % (%): % clases actualizadas', 
        teacher_record.id, 
        teacher_record.nombre_publico,
        updated_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Migración completada. Total de clases actualizadas: %', total_updated;
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
     WHERE clase ? 'fechaModo')
  ) FILTER (WHERE cronograma IS NOT NULL AND jsonb_typeof(cronograma) = 'array') as clases_con_fechaModo,
  SUM(
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(cronograma) AS clase 
     WHERE clase ? 'horarioModo')
  ) FILTER (WHERE cronograma IS NOT NULL AND jsonb_typeof(cronograma) = 'array') as clases_con_horarioModo,
  SUM(
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(cronograma) AS clase 
     WHERE clase ? 'descripcion')
  ) FILTER (WHERE cronograma IS NOT NULL AND jsonb_typeof(cronograma) = 'array') as clases_con_descripcion
FROM public.profiles_academy

UNION ALL

SELECT 
  'Maestros' as tipo,
  COUNT(*) FILTER (WHERE cronograma IS NOT NULL AND jsonb_typeof(cronograma) = 'array' AND jsonb_array_length(cronograma) > 0) as total_perfiles,
  SUM(jsonb_array_length(cronograma)) FILTER (WHERE cronograma IS NOT NULL AND jsonb_typeof(cronograma) = 'array') as total_clases,
  SUM(
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(cronograma) AS clase 
     WHERE clase ? 'fechaModo')
  ) FILTER (WHERE cronograma IS NOT NULL AND jsonb_typeof(cronograma) = 'array') as clases_con_fechaModo,
  SUM(
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(cronograma) AS clase 
     WHERE clase ? 'horarioModo')
  ) FILTER (WHERE cronograma IS NOT NULL AND jsonb_typeof(cronograma) = 'array') as clases_con_horarioModo,
  SUM(
    (SELECT COUNT(*) 
     FROM jsonb_array_elements(cronograma) AS clase 
     WHERE clase ? 'descripcion')
  ) FILTER (WHERE cronograma IS NOT NULL AND jsonb_typeof(cronograma) = 'array') as clases_con_descripcion
FROM public.profiles_teacher;

