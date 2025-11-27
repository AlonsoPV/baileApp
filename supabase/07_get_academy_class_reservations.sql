-- ========================================
-- 🔧 FUNCIÓN RPC PARA QUE ACADEMIAS VEAN SUS RESERVAS COMPLETAS
-- ========================================
-- Esta función permite a las academias ver todas las reservas tentativas
-- de sus clases, incluyendo información de usuarios, roles, zonas, etc.

DROP FUNCTION IF EXISTS public.get_academy_class_reservations(bigint);

CREATE OR REPLACE FUNCTION public.get_academy_class_reservations(p_academy_id bigint)
RETURNS TABLE (
  id bigint,
  user_id uuid,
  class_id bigint,
  academy_id bigint,
  teacher_id bigint,
  role_baile text,
  zona_tag_id bigint,
  status text,
  fecha_especifica date,
  created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el usuario es dueño de la academia o superadmin
  -- Usar función helper para evitar recursión
  IF NOT (
    public.is_academy_owner(p_academy_id)
    OR
    EXISTS (
      SELECT 1 FROM public.role_requests rr
      WHERE rr.user_id = auth.uid() 
      AND rr.role_slug = 'superadmin' 
      AND rr.status = 'aprobado'
    )
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para ver estas reservas. Debes ser dueño de la academia o superadmin.';
  END IF;

  RETURN QUERY
  SELECT 
    ca.id,
    ca.user_id,
    ca.class_id,
    ca.academy_id,
    ca.teacher_id,
    ca.role_baile,
    ca.zona_tag_id,
    ca.status,
    ca.fecha_especifica,
    ca.created_at
  FROM public.clase_asistencias ca
  WHERE ca.academy_id = p_academy_id
    AND ca.status = 'tentative'
  ORDER BY ca.created_at DESC;
END;
$$;

-- Comentario
COMMENT ON FUNCTION public.get_academy_class_reservations IS 'Permite a las academias ver todas las reservas tentativas de sus clases (solo dueños o superadmins). Bypassa RLS usando SECURITY DEFINER.';

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Verificar que la función existe
SELECT 
  '✅ Función creada' as status,
  proname as function_name,
  proargtypes::regtype[] as argument_types
FROM pg_proc
WHERE proname = 'get_academy_class_reservations'
  AND pronamespace = 'public'::regnamespace;

