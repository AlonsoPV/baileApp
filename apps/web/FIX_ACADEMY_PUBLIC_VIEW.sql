-- Fix Academy Public View - Asegurar que incluya todos los campos necesarios
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar vista existente
DROP VIEW IF EXISTS public.v_academies_public CASCADE;

-- 2. Recrear vista con TODOS los campos necesarios
CREATE OR REPLACE VIEW public.v_academies_public AS
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
  horarios,
  cronograma,  -- ✅ Agregar cronograma (alias de horarios)
  costos,      -- ✅ Agregar costos
  estado_aprobacion,
  created_at,
  updated_at
FROM public.profiles_academy
WHERE estado_aprobacion = 'aprobado';

-- 3. Otorgar permisos
GRANT SELECT ON public.v_academies_public TO public;
GRANT SELECT ON public.v_academies_public TO authenticated;

-- 4. Verificar que la vista se creó correctamente
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'v_academies_public'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Verificar datos de ejemplo
SELECT 
  id,
  nombre_publico,
  CASE 
    WHEN horarios IS NOT NULL THEN jsonb_array_length(horarios)
    ELSE 0
  END as num_horarios,
  CASE 
    WHEN ubicaciones IS NOT NULL THEN jsonb_array_length(ubicaciones)
    ELSE 0
  END as num_ubicaciones,
  CASE 
    WHEN ritmos_seleccionados IS NOT NULL THEN array_length(ritmos_seleccionados, 1)
    ELSE 0
  END as num_ritmos,
  estado_aprobacion
FROM public.v_academies_public
LIMIT 5;

