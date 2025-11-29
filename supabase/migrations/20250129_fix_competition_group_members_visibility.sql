-- ================================================
-- FIX: Permitir que miembros del grupo vean a todos los demás miembros
-- ================================================
-- Problema: La política RLS actual solo permite ver miembros si:
--   1. El usuario es el propio miembro (user_id = auth.uid())
--   2. O si el usuario es dueño del grupo
-- 
-- Esto impide que los miembros del grupo vean a otros miembros del mismo grupo.
-- 
-- Solución: Agregar una condición adicional que permita ver miembros si
-- el usuario es miembro activo del mismo grupo.
-- ================================================

-- 1. Crear función SECURITY DEFINER para verificar si el usuario es miembro activo del grupo
CREATE OR REPLACE FUNCTION public.is_competition_group_member(p_group_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.competition_group_members
    WHERE group_id = p_group_id
      AND user_id = auth.uid()
      AND is_active = true
  );
$$;

COMMENT ON FUNCTION public.is_competition_group_member(uuid) IS
'Devuelve true si el usuario actual (auth.uid) es miembro activo del grupo indicado. Usa SECURITY DEFINER para evitar recursión en RLS.';

-- 2. Actualizar la política de SELECT de competition_group_members
--    para permitir que los miembros del grupo vean a todos los demás miembros
DROP POLICY IF EXISTS "competition_group_members_select_owner_or_member"
ON public.competition_group_members;

CREATE POLICY "competition_group_members_select_owner_or_member"
ON public.competition_group_members
FOR SELECT
USING (
  -- El propio usuario ve sus filas
  user_id = auth.uid()
  OR
  -- El dueño del grupo puede ver a todos los miembros (usando función para evitar recursión)
  public.is_competition_group_owner(competition_group_members.group_id)
  OR
  -- Los miembros activos del grupo pueden ver a todos los demás miembros del mismo grupo
  public.is_competition_group_member(competition_group_members.group_id)
);

COMMENT ON POLICY "competition_group_members_select_owner_or_member" ON public.competition_group_members IS
'Permite ver miembros a: el propio usuario (user_id = auth.uid), al dueño del grupo (via is_competition_group_owner), y a los miembros activos del grupo (via is_competition_group_member).';

-- 3. Verificación final
DO $$
BEGIN
  RAISE NOTICE '✅ Función is_competition_group_member creada/actualizada';
  RAISE NOTICE '✅ Política RLS actualizada para permitir que miembros vean a otros miembros';
END $$;

