-- ========================================
-- 🔧 FIX COMPLETO: Política RLS para Academias
-- ========================================
-- Este script asegura que las academias puedan ver TODAS las reservas
-- de sus clases, no solo las que ellos mismos hicieron

-- Paso 1: Eliminar todas las políticas SELECT existentes
DROP POLICY IF EXISTS "select own attendance and superadmins can see all" ON public.clase_asistencias;
DROP POLICY IF EXISTS "select own attendance and academies can see their reservations" ON public.clase_asistencias;

-- Paso 2: Crear función helper para verificar ownership (evita recursión)
CREATE OR REPLACE FUNCTION public.is_academy_owner(p_academy_id bigint)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles_academy 
    WHERE id = p_academy_id 
    AND user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.is_academy_owner IS 
'Verifica si el usuario actual es dueño de la academia. Usa SECURITY DEFINER para evitar recursión en políticas RLS.';

-- Paso 3: Crear nueva política RLS que permite:
-- 1. Usuarios ven sus propias reservas
-- 2. Superadmins ven todas las reservas
-- 3. Dueños de academias ven TODAS las reservas de sus academias (usando función helper)
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

-- Paso 4: Verificar que la política se creó correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'clase_asistencias'
  AND policyname = 'select_own_or_academy_or_superadmin';

-- Paso 5: Verificar que la función existe
SELECT 
  '✅ Función creada' as status,
  proname as function_name
FROM pg_proc
WHERE proname = 'is_academy_owner'
  AND pronamespace = 'public'::regnamespace;

