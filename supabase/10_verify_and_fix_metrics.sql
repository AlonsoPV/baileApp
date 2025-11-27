-- ========================================
-- 🔍 VERIFICACIÓN Y CORRECCIÓN DE MÉTRICAS
-- ========================================
-- Este script verifica que todo esté configurado correctamente
-- y corrige cualquier problema encontrado

-- 1. Crear/actualizar función is_academy_owner
CREATE OR REPLACE FUNCTION public.is_academy_owner(p_academy_id bigint)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles_academy pa
    WHERE pa.id = p_academy_id 
    AND pa.user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.is_academy_owner IS 
'Verifica si el usuario actual es dueño de la academia. Usa SECURITY DEFINER para evitar recursión en políticas RLS.';

-- 2. Crear/actualizar función get_academy_class_reservations
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

COMMENT ON FUNCTION public.get_academy_class_reservations IS 
'Permite a las academias ver todas las reservas tentativas de sus clases (solo dueños o superadmins). Bypassa RLS usando SECURITY DEFINER.';

-- 3. Eliminar políticas antiguas
DROP POLICY IF EXISTS "select own attendance and superadmins can see all" ON public.clase_asistencias;
DROP POLICY IF EXISTS "select own attendance and academies can see their reservations" ON public.clase_asistencias;
DROP POLICY IF EXISTS "select_own_or_academy_or_superadmin" ON public.clase_asistencias;

-- 4. Crear política RLS corregida
CREATE POLICY "select_own_or_academy_or_superadmin"
  ON public.clase_asistencias
  FOR SELECT
  USING (
    -- Caso 1: Usuario ve sus propias reservas
    auth.uid() = user_id
    OR
    -- Caso 2: Superadmin ve todas
    EXISTS (
      SELECT 1 FROM public.role_requests rr
      WHERE rr.user_id = auth.uid() 
      AND rr.role_slug = 'superadmin' 
      AND rr.status = 'aprobado'
    )
    OR
    -- Caso 3: Dueño de academia ve TODAS las reservas de su academia
    (academy_id IS NOT NULL AND public.is_academy_owner(academy_id))
  );

COMMENT ON POLICY "select_own_or_academy_or_superadmin" ON public.clase_asistencias IS 
'Permite que usuarios vean sus propias reservas, superadmins vean todas, y dueños de academias vean todas las reservas de sus academias.';

-- 5. Verificar que todo está correcto
SELECT 
  '✅ VERIFICACIÓN COMPLETA' as status,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'is_academy_owner' AND pronamespace = 'public'::regnamespace) as has_is_academy_owner,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'get_academy_class_reservations' AND pronamespace = 'public'::regnamespace) as has_get_reservations,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'clase_asistencias' AND policyname = 'select_own_or_academy_or_superadmin') as has_rls_policy;

-- 6. Instrucciones para probar
-- Para probar la función RPC (reemplaza 15 con tu academy_id):
-- SELECT * FROM public.get_academy_class_reservations(15);
--
-- Para verificar las reservas directamente:
-- SELECT COUNT(*) FROM clase_asistencias WHERE academy_id = 15 AND status = 'tentative';
