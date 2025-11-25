-- ========================================
-- 📊 SISTEMA DE CALIFICACIONES PARA ACADEMIAS
-- ========================================
-- Tabla para almacenar calificaciones anónimas de usuarios autenticados

-- 1. Crear tabla academy_ratings
CREATE TABLE IF NOT EXISTS public.academy_ratings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  academy_id BIGINT NOT NULL REFERENCES public.profiles_academy(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Calificación principal
  overall_rating TEXT NOT NULL CHECK (overall_rating IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_aplica')),
  
  -- Calificaciones específicas
  puntualidad TEXT CHECK (puntualidad IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_aplica')),
  instalaciones TEXT CHECK (instalaciones IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_aplica')),
  atencion_staff TEXT CHECK (atencion_staff IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_aplica')),
  organizacion TEXT CHECK (organizacion IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_aplica')),
  precio_valor TEXT CHECK (precio_valor IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_aplica')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un usuario solo puede calificar una vez por academia (puede actualizar su calificación)
  UNIQUE(academy_id, user_id)
);

-- 2. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_academy_ratings_academy_id ON public.academy_ratings(academy_id);
CREATE INDEX IF NOT EXISTS idx_academy_ratings_user_id ON public.academy_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_ratings_created_at ON public.academy_ratings(created_at DESC);

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_academy_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_academy_ratings_updated ON public.academy_ratings;
CREATE TRIGGER trg_academy_ratings_updated
BEFORE UPDATE ON public.academy_ratings
FOR EACH ROW EXECUTE FUNCTION public.set_academy_ratings_updated_at();

-- 4. Habilitar RLS
ALTER TABLE public.academy_ratings ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS (eliminar si existen antes de crear)
DROP POLICY IF EXISTS "academy_ratings_select_public" ON public.academy_ratings;
DROP POLICY IF EXISTS "academy_ratings_insert_authenticated" ON public.academy_ratings;
DROP POLICY IF EXISTS "academy_ratings_update_own" ON public.academy_ratings;
DROP POLICY IF EXISTS "academy_ratings_delete_own" ON public.academy_ratings;

-- Cualquiera puede leer las calificaciones (para mostrar promedios)
CREATE POLICY "academy_ratings_select_public"
ON public.academy_ratings
FOR SELECT
USING (true);

-- Solo usuarios autenticados pueden insertar/actualizar sus propias calificaciones
CREATE POLICY "academy_ratings_insert_authenticated"
ON public.academy_ratings
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "academy_ratings_update_own"
ON public.academy_ratings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias calificaciones
CREATE POLICY "academy_ratings_delete_own"
ON public.academy_ratings
FOR DELETE
USING (auth.uid() = user_id);

-- 6. Función para calcular promedios (opcional, para optimización)
CREATE OR REPLACE FUNCTION public.get_academy_rating_average(academy_id_param BIGINT)
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
      'no_aplica', COUNT(*) FILTER (WHERE overall_rating = 'no_aplica'),
      'total', COUNT(*)
    ),
    'puntualidad', jsonb_build_object(
      'excelente', COUNT(*) FILTER (WHERE puntualidad = 'excelente'),
      'muy_bueno', COUNT(*) FILTER (WHERE puntualidad = 'muy_bueno'),
      'bueno', COUNT(*) FILTER (WHERE puntualidad = 'bueno'),
      'regular', COUNT(*) FILTER (WHERE puntualidad = 'regular'),
      'no_aplica', COUNT(*) FILTER (WHERE puntualidad = 'no_aplica'),
      'total', COUNT(*) FILTER (WHERE puntualidad IS NOT NULL)
    ),
    'instalaciones', jsonb_build_object(
      'excelente', COUNT(*) FILTER (WHERE instalaciones = 'excelente'),
      'muy_bueno', COUNT(*) FILTER (WHERE instalaciones = 'muy_bueno'),
      'bueno', COUNT(*) FILTER (WHERE instalaciones = 'bueno'),
      'regular', COUNT(*) FILTER (WHERE instalaciones = 'regular'),
      'no_aplica', COUNT(*) FILTER (WHERE instalaciones = 'no_aplica'),
      'total', COUNT(*) FILTER (WHERE instalaciones IS NOT NULL)
    ),
    'atencion_staff', jsonb_build_object(
      'excelente', COUNT(*) FILTER (WHERE atencion_staff = 'excelente'),
      'muy_bueno', COUNT(*) FILTER (WHERE atencion_staff = 'muy_bueno'),
      'bueno', COUNT(*) FILTER (WHERE atencion_staff = 'bueno'),
      'regular', COUNT(*) FILTER (WHERE atencion_staff = 'regular'),
      'no_aplica', COUNT(*) FILTER (WHERE atencion_staff = 'no_aplica'),
      'total', COUNT(*) FILTER (WHERE atencion_staff IS NOT NULL)
    ),
    'organizacion', jsonb_build_object(
      'excelente', COUNT(*) FILTER (WHERE organizacion = 'excelente'),
      'muy_bueno', COUNT(*) FILTER (WHERE organizacion = 'muy_bueno'),
      'bueno', COUNT(*) FILTER (WHERE organizacion = 'bueno'),
      'regular', COUNT(*) FILTER (WHERE organizacion = 'regular'),
      'no_aplica', COUNT(*) FILTER (WHERE organizacion = 'no_aplica'),
      'total', COUNT(*) FILTER (WHERE organizacion IS NOT NULL)
    ),
    'precio_valor', jsonb_build_object(
      'excelente', COUNT(*) FILTER (WHERE precio_valor = 'excelente'),
      'muy_bueno', COUNT(*) FILTER (WHERE precio_valor = 'muy_bueno'),
      'bueno', COUNT(*) FILTER (WHERE precio_valor = 'bueno'),
      'regular', COUNT(*) FILTER (WHERE precio_valor = 'regular'),
      'no_aplica', COUNT(*) FILTER (WHERE precio_valor = 'no_aplica'),
      'total', COUNT(*) FILTER (WHERE precio_valor IS NOT NULL)
    )
  )
  INTO result
  FROM public.academy_ratings
  WHERE academy_id = academy_id_param;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Comentarios
COMMENT ON TABLE public.academy_ratings IS 'Calificaciones anónimas de usuarios autenticados para academias';
COMMENT ON COLUMN public.academy_ratings.overall_rating IS 'Calificación principal: excelente, muy_bueno, bueno, regular, no_aplica';
COMMENT ON COLUMN public.academy_ratings.puntualidad IS 'Puntualidad y cumplimiento';
COMMENT ON COLUMN public.academy_ratings.instalaciones IS 'Instalaciones, limpieza y orden';
COMMENT ON COLUMN public.academy_ratings.atencion_staff IS 'Atención y apoyo del staff/maestros';
COMMENT ON COLUMN public.academy_ratings.organizacion IS 'Variedad de horarios';
COMMENT ON COLUMN public.academy_ratings.precio_valor IS 'Relación precio-valor';

-- 8. Verificar creación
SELECT 
  'Tabla academy_ratings creada correctamente' as status,
  COUNT(*) as total_ratings
FROM public.academy_ratings;

