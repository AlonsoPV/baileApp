-- ================================================
-- FIX: Combinar políticas RLS de SELECT en una sola
-- ================================================
-- Las políticas separadas pueden causar problemas con consultas sin filtros
-- Combinamos todas las políticas de SELECT en una sola usando OR
-- ================================================

-- Eliminar políticas individuales
DROP POLICY IF EXISTS "competition_groups_select_owner" ON public.competition_groups;
DROP POLICY IF EXISTS "competition_groups_select_members" ON public.competition_groups;
DROP POLICY IF EXISTS "competition_groups_select_invited" ON public.competition_groups;

-- Crear política combinada
CREATE POLICY "competition_groups_select_combined"
ON public.competition_groups
FOR SELECT
USING (
  -- El usuario es dueño del grupo
  owner_id = auth.uid()
  OR
  -- El usuario es miembro activo del grupo
  EXISTS (
    SELECT 1 FROM public.competition_group_members
    WHERE competition_group_members.group_id = competition_groups.id
    AND competition_group_members.user_id = auth.uid()
    AND competition_group_members.is_active = true
  )
  OR
  -- El usuario tiene una invitación pendiente
  EXISTS (
    SELECT 1 FROM public.competition_group_invitations
    WHERE competition_group_invitations.group_id = competition_groups.id
    AND competition_group_invitations.invitee_id = auth.uid()
    AND competition_group_invitations.status = 'pending'
  )
);

COMMENT ON POLICY "competition_groups_select_combined" ON public.competition_groups IS 
'Permite ver grupos donde el usuario es dueño, miembro activo, o tiene invitación pendiente';

