-- ================================================
-- FIX: Actualizar política RLS de INSERT para competition_groups
-- ================================================
-- Actualizar la política para verificar ambas tablas de academias
-- y también verificar el estado de aprobación
-- ================================================

-- Eliminar política antigua
DROP POLICY IF EXISTS "competition_groups_insert_owner" ON public.competition_groups;

-- Crear política actualizada
CREATE POLICY "competition_groups_insert_owner"
ON public.competition_groups
FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  AND (
    -- Verificar perfil de maestro (aprobado o sin estado_aprobacion)
    EXISTS (
      SELECT 1 FROM public.profiles_teacher
      WHERE profiles_teacher.user_id = auth.uid()
      AND (profiles_teacher.estado_aprobacion IS NULL OR profiles_teacher.estado_aprobacion = 'aprobado')
    )
    OR
    -- Verificar perfil de academia en profiles_academy
    EXISTS (
      SELECT 1 FROM public.profiles_academy
      WHERE profiles_academy.user_id = auth.uid()
      AND (profiles_academy.estado_aprobacion IS NULL OR profiles_academy.estado_aprobacion = 'aprobado')
    )
    OR
    -- Verificar perfil de academia en profiles_school (por si acaso)
    EXISTS (
      SELECT 1 FROM public.profiles_school
      WHERE profiles_school.user_id = auth.uid()
      AND (profiles_school.estado_aprobacion IS NULL OR profiles_school.estado_aprobacion = 'aprobado')
    )
  )
);

COMMENT ON POLICY "competition_groups_insert_owner" ON public.competition_groups IS 
'Permite crear grupos solo a maestros o academias con perfil aprobado (o sin estado_aprobacion)';

