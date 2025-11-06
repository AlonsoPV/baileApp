-- ========================================
-- VERIFICAR Y AGREGAR DATOS DE CLASES
-- ========================================

-- 1. Verificar columnas de profiles_academy
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles_academy'
ORDER BY ordinal_position;

-- 2. Verificar si cronograma y costos existen
DO $$
DECLARE
  has_cronograma boolean;
  has_costos boolean;
  has_ubicaciones boolean;
BEGIN
  -- Verificar cronograma
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles_academy' 
      AND column_name = 'cronograma'
  ) INTO has_cronograma;

  -- Verificar costos
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles_academy' 
      AND column_name = 'costos'
  ) INTO has_costos;

  -- Verificar ubicaciones
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles_academy' 
      AND column_name = 'ubicaciones'
  ) INTO has_ubicaciones;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN DE COLUMNAS:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'cronograma: %', CASE WHEN has_cronograma THEN '✅ Existe' ELSE '❌ No existe' END;
  RAISE NOTICE 'costos: %', CASE WHEN has_costos THEN '✅ Existe' ELSE '❌ No existe' END;
  RAISE NOTICE 'ubicaciones: %', CASE WHEN has_ubicaciones THEN '✅ Existe' ELSE '❌ No existe' END;
  RAISE NOTICE '========================================';

  -- Si no existen, crearlas
  IF NOT has_cronograma THEN
    ALTER TABLE public.profiles_academy ADD COLUMN cronograma jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Columna cronograma creada';
  END IF;

  IF NOT has_costos THEN
    ALTER TABLE public.profiles_academy ADD COLUMN costos jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Columna costos creada';
  END IF;

  IF NOT has_ubicaciones THEN
    ALTER TABLE public.profiles_academy ADD COLUMN ubicaciones jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Columna ubicaciones creada';
  END IF;
END $$;

-- 3. Agregar clases completas a la academia de prueba
UPDATE public.profiles_academy
SET 
  cronograma = '[
    {
      "titulo": "Salsa On1 Principiantes",
      "diasSemana": ["Lunes", "Miércoles"],
      "inicio": "19:00",
      "fin": "20:30",
      "nivel": "Principiante"
    },
    {
      "titulo": "Bachata Sensual Intermedio",
      "diasSemana": ["Martes", "Jueves"],
      "inicio": "20:00",
      "fin": "21:30",
      "nivel": "Intermedio"
    },
    {
      "titulo": "Salsa On2 Avanzado",
      "diasSemana": ["Viernes"],
      "inicio": "19:30",
      "fin": "21:00",
      "nivel": "Avanzado"
    }
  ]'::jsonb,
  costos = '[
    {
      "tipo": "Mensual",
      "precio": 800,
      "descripcion": "Acceso ilimitado a todas las clases"
    },
    {
      "tipo": "Por clase",
      "precio": 100,
      "descripcion": "Pago individual por clase"
    },
    {
      "tipo": "Paquete 10 clases",
      "precio": 850,
      "descripcion": "10 clases para usar cuando quieras"
    }
  ]'::jsonb,
  ubicaciones = '[
    {
      "nombre": "Sede Centro",
      "direccion": "Av. Insurgentes Sur 123",
      "ciudad": "Ciudad de México",
      "codigoPostal": "06700",
      "latitud": 19.4326,
      "longitud": -99.1332,
      "referencias": "Cerca del metro Insurgentes"
    }
  ]'::jsonb
WHERE user_id = '00000000-0000-0000-0000-000000000003';

-- 4. Verificar que se guardaron
SELECT 
  nombre_publico,
  jsonb_array_length(cronograma) as num_clases,
  jsonb_array_length(costos) as num_costos,
  jsonb_array_length(ubicaciones) as num_ubicaciones
FROM public.profiles_academy
WHERE user_id = '00000000-0000-0000-0000-000000000003';

-- 5. Ver detalles de las clases
SELECT 
  nombre_publico,
  cronograma,
  costos,
  ubicaciones
FROM public.profiles_academy
WHERE user_id = '00000000-0000-0000-0000-000000000003';

