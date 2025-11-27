-- ========================================
-- 🔧 ACTUALIZAR POLÍTICA RLS PARA ACADEMIAS
-- ========================================
-- Permite que las academias vean todas las reservas de sus clases
-- sin necesidad de usar función RPC

-- Eliminar política antigua
DROP POLICY IF EXISTS "select own attendance and superadmins can see all" ON public.clase_asistencias;

-- Crear nueva política que permite:
-- 1. Usuarios ven sus propias reservas
-- 2. Superadmins ven todas las reservas
-- 3. Dueños de academias ven todas las reservas de sus academias
CREATE POLICY "select own attendance and academies can see their reservations"
  ON public.clase_asistencias
  FOR SELECT
  USING (
    -- Usuario ve sus propias reservas
    auth.uid() = user_id
    OR
    -- Superadmin ve todas
    EXISTS (
      SELECT 1 FROM public.role_requests 
      WHERE user_id = auth.uid() 
      AND role_slug = 'superadmin' 
      AND status = 'aprobado'
    )
    OR
    -- Dueño de academia ve todas las reservas de su academia
    EXISTS (
      SELECT 1 FROM public.profiles_academy 
      WHERE id = clase_asistencias.academy_id 
      AND user_id = auth.uid()
    )
  );

-- Comentario
COMMENT ON POLICY "select own attendance and academies can see their reservations" ON public.clase_asistencias IS 
'Permite que usuarios vean sus propias reservas, superadmins vean todas, y dueños de academias vean todas las reservas de sus academias.';

