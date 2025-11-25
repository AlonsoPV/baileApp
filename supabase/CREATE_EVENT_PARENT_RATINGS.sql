-- ========================================
-- 📊 SISTEMA DE CALIFICACIONES PARA EVENTOS PADRES
-- ========================================
-- Tabla para almacenar calificaciones anónimas de usuarios autenticados

-- 1. Crear tabla event_parent_ratings
CREATE TABLE IF NOT EXISTS public.event_parent_ratings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_parent_id BIGINT NOT NULL REFERENCES public.events_parent(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Calificación principal
  overall_rating TEXT NOT NULL CHECK (overall_rating IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_asisti')),
  
  -- Calificaciones específicas
  ambiente_general TEXT CHECK (ambiente_general IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_asisti')),
  seleccion_musical TEXT CHECK (seleccion_musical IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_asisti')),
  organizacion TEXT CHECK (organizacion IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_asisti')),
  comodidad_espacio TEXT CHECK (comodidad_espacio IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_asisti')),
  probabilidad_asistir TEXT CHECK (probabilidad_asistir IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_asisti')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un usuario solo puede calificar una vez por evento padre (puede actualizar su calificación)
  UNIQUE(event_parent_id, user_id)
);

-- 2. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_event_parent_ratings_event_parent_id ON public.event_parent_ratings(event_parent_id);
CREATE INDEX IF NOT EXISTS idx_event_parent_ratings_user_id ON public.event_parent_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_event_parent_ratings_created_at ON public.event_parent_ratings(created_at DESC);

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_event_parent_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_event_parent_ratings_updated ON public.event_parent_ratings;
CREATE TRIGGER trg_event_parent_ratings_updated
BEFORE UPDATE ON public.event_parent_ratings
FOR EACH ROW EXECUTE FUNCTION public.set_event_parent_ratings_updated_at();

-- 4. Habilitar RLS
ALTER TABLE public.event_parent_ratings ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS (eliminar si existen antes de crear)
DROP POLICY IF EXISTS "event_parent_ratings_select_public" ON public.event_parent_ratings;
DROP POLICY IF EXISTS "event_parent_ratings_insert_authenticated" ON public.event_parent_ratings;
DROP POLICY IF EXISTS "event_parent_ratings_update_own" ON public.event_parent_ratings;
DROP POLICY IF EXISTS "event_parent_ratings_delete_own" ON public.event_parent_ratings;

-- Cualquiera puede leer las calificaciones (para mostrar promedios)
CREATE POLICY "event_parent_ratings_select_public"
ON public.event_parent_ratings
FOR SELECT
USING (true);

-- Solo usuarios autenticados pueden insertar/actualizar sus propias calificaciones
CREATE POLICY "event_parent_ratings_insert_authenticated"
ON public.event_parent_ratings
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "event_parent_ratings_update_own"
ON public.event_parent_ratings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias calificaciones
CREATE POLICY "event_parent_ratings_delete_own"
ON public.event_parent_ratings
FOR DELETE
USING (auth.uid() = user_id);

-- 6. Función para calcular promedios (opcional, para optimización)
CREATE OR REPLACE FUNCTION public.get_event_parent_rating_average(event_parent_id_param BIGINT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'overall', jsonb_build_object(
      'excelente', COUNT(*) FILTER (WHERE overall_rating = 'excelente'),
      'muy_bueno', COUNT(*) FILTER (WHERE overall_rating = 'muy_bueno'),
      'bueno', COUNT(*) FILTER (WHERE overall_rating = 'bueno'),
      'regular', COUNT(*) FILTER (WHERE overall_rating = 'regular'),
      'no_asisti', COUNT(*) FILTER (WHERE overall_rating = 'no_asisti'),
      'total', COUNT(*)
    ),
    'ambiente_general', jsonb_build_object(
      'excelente', COUNT(*) FILTER (WHERE ambiente_general = 'excelente'),
      'muy_bueno', COUNT(*) FILTER (WHERE ambiente_general = 'muy_bueno'),
      'bueno', COUNT(*) FILTER (WHERE ambiente_general = 'bueno'),
      'regular', COUNT(*) FILTER (WHERE ambiente_general = 'regular'),
      'no_asisti', COUNT(*) FILTER (WHERE ambiente_general = 'no_asisti'),
      'total', COUNT(*) FILTER (WHERE ambiente_general IS NOT NULL)
    ),
    'seleccion_musical', jsonb_build_object(
      'excelente', COUNT(*) FILTER (WHERE seleccion_musical = 'excelente'),
      'muy_bueno', COUNT(*) FILTER (WHERE seleccion_musical = 'muy_bueno'),
      'bueno', COUNT(*) FILTER (WHERE seleccion_musical = 'bueno'),
      'regular', COUNT(*) FILTER (WHERE seleccion_musical = 'regular'),
      'no_asisti', COUNT(*) FILTER (WHERE seleccion_musical = 'no_asisti'),
      'total', COUNT(*) FILTER (WHERE seleccion_musical IS NOT NULL)
    ),
    'organizacion', jsonb_build_object(
      'excelente', COUNT(*) FILTER (WHERE organizacion = 'excelente'),
      'muy_bueno', COUNT(*) FILTER (WHERE organizacion = 'muy_bueno'),
      'bueno', COUNT(*) FILTER (WHERE organizacion = 'bueno'),
      'regular', COUNT(*) FILTER (WHERE organizacion = 'regular'),
      'no_asisti', COUNT(*) FILTER (WHERE organizacion = 'no_asisti'),
      'total', COUNT(*) FILTER (WHERE organizacion IS NOT NULL)
    ),
    'comodidad_espacio', jsonb_build_object(
      'excelente', COUNT(*) FILTER (WHERE comodidad_espacio = 'excelente'),
      'muy_bueno', COUNT(*) FILTER (WHERE comodidad_espacio = 'muy_bueno'),
      'bueno', COUNT(*) FILTER (WHERE comodidad_espacio = 'bueno'),
      'regular', COUNT(*) FILTER (WHERE comodidad_espacio = 'regular'),
      'no_asisti', COUNT(*) FILTER (WHERE comodidad_espacio = 'no_asisti'),
      'total', COUNT(*) FILTER (WHERE comodidad_espacio IS NOT NULL)
    ),
    'probabilidad_asistir', jsonb_build_object(
      'excelente', COUNT(*) FILTER (WHERE probabilidad_asistir = 'excelente'),
      'muy_bueno', COUNT(*) FILTER (WHERE probabilidad_asistir = 'muy_bueno'),
      'bueno', COUNT(*) FILTER (WHERE probabilidad_asistir = 'bueno'),
      'regular', COUNT(*) FILTER (WHERE probabilidad_asistir = 'regular'),
      'no_asisti', COUNT(*) FILTER (WHERE probabilidad_asistir = 'no_asisti'),
      'total', COUNT(*) FILTER (WHERE probabilidad_asistir IS NOT NULL)
    )
  )
  INTO result
  FROM public.event_parent_ratings
  WHERE event_parent_id = event_parent_id_param;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Comentarios
COMMENT ON TABLE public.event_parent_ratings IS 'Calificaciones anónimas de usuarios autenticados para eventos padres';
COMMENT ON COLUMN public.event_parent_ratings.overall_rating IS 'Calificación principal: excelente, muy_bueno, bueno, regular, no_asisti';
COMMENT ON COLUMN public.event_parent_ratings.ambiente_general IS 'Ambiente general del evento';
COMMENT ON COLUMN public.event_parent_ratings.seleccion_musical IS 'Selección musical y DJs';
COMMENT ON COLUMN public.event_parent_ratings.organizacion IS 'Organización (horarios, flujo, logística)';
COMMENT ON COLUMN public.event_parent_ratings.comodidad_espacio IS 'Comodidad del espacio (piso, ventilación, iluminación)';
COMMENT ON COLUMN public.event_parent_ratings.probabilidad_asistir IS 'Probabilidad de asistir nuevamente';

-- 8. Verificar creación
SELECT 
  'Tabla event_parent_ratings creada correctamente' as status,
  COUNT(*) as total_ratings
FROM public.event_parent_ratings;

