-- Fix Teacher Public View - Asegurar que incluya todos los campos necesarios
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si existe la vista v_teachers_public
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_name = 'v_teachers_public'
        AND table_schema = 'public'
    ) THEN
        DROP VIEW public.v_teachers_public CASCADE;
        RAISE NOTICE '✅ Vista v_teachers_public eliminada';
    ELSE
        RAISE NOTICE '⏭️  Vista v_teachers_public no existía';
    END IF;
END $$;

-- 2. Recrear vista con TODOS los campos necesarios
CREATE OR REPLACE VIEW public.v_teachers_public AS
SELECT 
  id,
  user_id,
  nombre_publico,
  bio,
  media,
  avatar_url,
  portada_url,
  ritmos,
  ritmos_seleccionados,
  zonas,
  redes_sociales,
  ubicaciones,
  cronograma,
  costos,
  faq,
  estado_aprobacion,
  created_at,
  updated_at
FROM public.profiles_teacher
WHERE estado_aprobacion = 'aprobado';

-- 3. Otorgar permisos
GRANT SELECT ON public.v_teachers_public TO public;
GRANT SELECT ON public.v_teachers_public TO authenticated;

-- 4. Verificar que la vista se creó correctamente
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'v_teachers_public'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Verificar datos de ejemplo
SELECT 
  id,
  nombre_publico,
  CASE 
    WHEN cronograma IS NOT NULL THEN jsonb_array_length(cronograma)
    ELSE 0
  END as num_clases,
  CASE 
    WHEN costos IS NOT NULL THEN jsonb_array_length(costos)
    ELSE 0
  END as num_costos,
  CASE 
    WHEN ubicaciones IS NOT NULL THEN jsonb_array_length(ubicaciones)
    ELSE 0
  END as num_ubicaciones,
  CASE 
    WHEN ritmos_seleccionados IS NOT NULL THEN array_length(ritmos_seleccionados, 1)
    ELSE 0
  END as num_ritmos,
  estado_aprobacion
FROM public.v_teachers_public
LIMIT 5;

