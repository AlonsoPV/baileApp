-- ========================================
-- 📊 SISTEMA DE CALIFICACIONES PARA MAESTROS
-- ========================================
-- Tabla para almacenar calificaciones anónimas de usuarios autenticados

-- 1. Crear tabla teacher_ratings
CREATE TABLE IF NOT EXISTS public.teacher_ratings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  teacher_id BIGINT NOT NULL REFERENCES public.profiles_teacher(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Calificación principal
  overall_rating TEXT NOT NULL CHECK (overall_rating IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_tome_clase')),
  
  -- Calificaciones específicas
  claridad TEXT CHECK (claridad IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_tome_clase')),
  dominio_tecnico TEXT CHECK (dominio_tecnico IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_tome_clase')),
  puntualidad TEXT CHECK (puntualidad IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_tome_clase')),
  actitud_energia TEXT CHECK (actitud_energia IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_tome_clase')),
  ambiente_seguro TEXT CHECK (ambiente_seguro IN ('excelente', 'muy_bueno', 'bueno', 'regular', 'no_tome_clase')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un usuario solo puede calificar una vez por maestro (puede actualizar su calificación)
  UNIQUE(teacher_id, user_id)
);

-- 2. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_teacher_id ON public.teacher_ratings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_user_id ON public.teacher_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_created_at ON public.teacher_ratings(created_at DESC);

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_teacher_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_teacher_ratings_updated ON public.teacher_ratings;
CREATE TRIGGER trg_teacher_ratings_updated
BEFORE UPDATE ON public.teacher_ratings
FOR EACH ROW EXECUTE FUNCTION public.set_teacher_ratings_updated_at();

-- 4. Habilitar RLS
ALTER TABLE public.teacher_ratings ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS (eliminar si existen antes de crear)
DROP POLICY IF EXISTS "teacher_ratings_select_public" ON public.teacher_ratings;
DROP POLICY IF EXISTS "teacher_ratings_insert_authenticated" ON public.teacher_ratings;
DROP POLICY IF EXISTS "teacher_ratings_update_own" ON public.teacher_ratings;
DROP POLICY IF EXISTS "teacher_ratings_delete_own" ON public.teacher_ratings;

-- Cualquiera puede leer las calificaciones (para mostrar promedios)
CREATE POLICY "teacher_ratings_select_public"
ON public.teacher_ratings
FOR SELECT
USING (true);

-- Solo usuarios autenticados pueden insertar/actualizar sus propias calificaciones
CREATE POLICY "teacher_ratings_insert_authenticated"
ON public.teacher_ratings
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "teacher_ratings_update_own"
ON public.teacher_ratings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias calificaciones
CREATE POLICY "teacher_ratings_delete_own"
ON public.teacher_ratings
FOR DELETE
USING (auth.uid() = user_id);

-- 6. Función para calcular promedios (opcional, para optimización)
CREATE OR REPLACE FUNCTION public.get_teacher_rating_average(teacher_id_param BIGINT)
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
      'no_tome_clase', COUNT(*) FILTER (WHERE overall_rating = 'no_tome_clase'),
      'total', COUNT(*)
    ),
    'claridad', jsonb_build_object(
      'excelente', COUNT(*) FILTER (WHERE claridad = 'excelente'),
      'muy_bueno', COUNT(*) FILTER (WHERE claridad = 'muy_bueno'),
      'bueno', COUNT(*) FILTER (WHERE claridad = 'bueno'),
      'regular', COUNT(*) FILTER (WHERE claridad = 'regular'),
      'no_tome_clase', COUNT(*) FILTER (WHERE claridad = 'no_tome_clase'),
      'total', COUNT(*) FILTER (WHERE claridad IS NOT NULL)
    ),
    'dominio_tecnico', jsonb_build_object(
      'excelente', COUNT(*) FILTER (WHERE dominio_tecnico = 'excelente'),
      'muy_bueno', COUNT(*) FILTER (WHERE dominio_tecnico = 'muy_bueno'),
      'bueno', COUNT(*) FILTER (WHERE dominio_tecnico = 'bueno'),
      'regular', COUNT(*) FILTER (WHERE dominio_tecnico = 'regular'),
      'no_tome_clase', COUNT(*) FILTER (WHERE dominio_tecnico = 'no_tome_clase'),
      'total', COUNT(*) FILTER (WHERE dominio_tecnico IS NOT NULL)
    ),
    'puntualidad', jsonb_build_object(
      'excelente', COUNT(*) FILTER (WHERE puntualidad = 'excelente'),
      'muy_bueno', COUNT(*) FILTER (WHERE puntualidad = 'muy_bueno'),
      'bueno', COUNT(*) FILTER (WHERE puntualidad = 'bueno'),
      'regular', COUNT(*) FILTER (WHERE puntualidad = 'regular'),
      'no_tome_clase', COUNT(*) FILTER (WHERE puntualidad = 'no_tome_clase'),
      'total', COUNT(*) FILTER (WHERE puntualidad IS NOT NULL)
    ),
    'actitud_energia', jsonb_build_object(
      'excelente', COUNT(*) FILTER (WHERE actitud_energia = 'excelente'),
      'muy_bueno', COUNT(*) FILTER (WHERE actitud_energia = 'muy_bueno'),
      'bueno', COUNT(*) FILTER (WHERE actitud_energia = 'bueno'),
      'regular', COUNT(*) FILTER (WHERE actitud_energia = 'regular'),
      'no_tome_clase', COUNT(*) FILTER (WHERE actitud_energia = 'no_tome_clase'),
      'total', COUNT(*) FILTER (WHERE actitud_energia IS NOT NULL)
    ),
    'ambiente_seguro', jsonb_build_object(
      'excelente', COUNT(*) FILTER (WHERE ambiente_seguro = 'excelente'),
      'muy_bueno', COUNT(*) FILTER (WHERE ambiente_seguro = 'muy_bueno'),
      'bueno', COUNT(*) FILTER (WHERE ambiente_seguro = 'bueno'),
      'regular', COUNT(*) FILTER (WHERE ambiente_seguro = 'regular'),
      'no_tome_clase', COUNT(*) FILTER (WHERE ambiente_seguro = 'no_tome_clase'),
      'total', COUNT(*) FILTER (WHERE ambiente_seguro IS NOT NULL)
    )
  )
  INTO result
  FROM public.teacher_ratings
  WHERE teacher_id = teacher_id_param;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Comentarios
COMMENT ON TABLE public.teacher_ratings IS 'Calificaciones anónimas de usuarios autenticados para maestros';
COMMENT ON COLUMN public.teacher_ratings.overall_rating IS 'Calificación principal: excelente, muy_bueno, bueno, regular, no_tome_clase';
COMMENT ON COLUMN public.teacher_ratings.claridad IS 'Claridad al explicar pasos y técnica';
COMMENT ON COLUMN public.teacher_ratings.dominio_tecnico IS 'Dominio del estilo y calidad técnica';
COMMENT ON COLUMN public.teacher_ratings.puntualidad IS 'Puntualidad de inicio y fin de clases';
COMMENT ON COLUMN public.teacher_ratings.actitud_energia IS 'Actitud y energía transmitida';
COMMENT ON COLUMN public.teacher_ratings.ambiente_seguro IS 'Ambiente seguro y respetuoso durante la clase';

-- 8. Verificar creación
SELECT 
  'Tabla teacher_ratings creada correctamente' as status,
  COUNT(*) as total_ratings
FROM public.teacher_ratings;

