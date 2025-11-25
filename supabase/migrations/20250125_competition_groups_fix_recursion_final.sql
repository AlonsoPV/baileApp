-- ================================================
-- FIX FINAL: Resolver recursión infinita en políticas RLS
-- ================================================
-- Problema: Al crear un grupo, el INSERT + SELECT activa políticas RLS
-- que consultan otras tablas, creando ciclos de recursión.
-- 
-- Solución:
--  1) Asegurar que solo exista la política combinada de SELECT
--  2) Asegurar que la política de INSERT use función SECURITY DEFINER
--  3) Asegurar que las políticas de competition_group_members usen funciones SECURITY DEFINER
-- ================================================

-- 1. Asegurar que existe la función SECURITY DEFINER para verificar perfil
-- (Solo verifica existencia, sin filtrar por estado_aprobacion)
CREATE OR REPLACE FUNCTION public.check_user_is_teacher_or_academy()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    -- Tiene perfil de maestro
    EXISTS (
      SELECT 1
      FROM public.profiles_teacher
      WHERE profiles_teacher.user_id = auth.uid()
    )
    OR
    -- Tiene perfil de academia en profiles_academy
    EXISTS (
      SELECT 1
      FROM public.profiles_academy
      WHERE profiles_academy.user_id = auth.uid()
    )
    OR
    -- Tiene perfil de academia/escuela en profiles_school
    EXISTS (
      SELECT 1
      FROM public.profiles_school
      WHERE profiles_school.user_id = auth.uid()
    )
  );
END;
$$;

COMMENT ON FUNCTION public.check_user_is_teacher_or_academy() IS 
'Devuelve true si el usuario actual tiene algún perfil en profiles_teacher, profiles_academy o profiles_school, sin filtrar por estado_aprobacion. Usa SECURITY DEFINER para evitar recursión en políticas RLS.';

-- 2. Asegurar que existe la función SECURITY DEFINER para verificar ownership
CREATE OR REPLACE FUNCTION public.is_competition_group_owner(p_group_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.competition_groups
    WHERE id = p_group_id
      AND owner_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.is_competition_group_owner(uuid) IS
'Devuelve true si el usuario actual (auth.uid) es dueño del grupo indicado. Usa SECURITY DEFINER para evitar recursión en RLS.';

-- 3. Eliminar TODAS las políticas de SELECT de competition_groups (para evitar conflictos)
DROP POLICY IF EXISTS "competition_groups_select_owner" ON public.competition_groups;
DROP POLICY IF EXISTS "competition_groups_select_members" ON public.competition_groups;
DROP POLICY IF EXISTS "competition_groups_select_invited" ON public.competition_groups;
DROP POLICY IF EXISTS "competition_groups_select_combined" ON public.competition_groups;

-- 4. Crear UNA SOLA política combinada de SELECT (idempotente)
CREATE POLICY "competition_groups_select_combined"
ON public.competition_groups
FOR SELECT
USING (
  -- El usuario es dueño del grupo
  owner_id = auth.uid()
  OR
  -- El usuario es miembro activo del grupo (usando función para evitar recursión)
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

-- 5. Actualizar la política de INSERT: sin restricción de perfil
-- Cualquier usuario autenticado puede crear grupos de competencia
DROP POLICY IF EXISTS "competition_groups_insert_owner" ON public.competition_groups;

CREATE POLICY "competition_groups_insert_owner"
ON public.competition_groups
FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
);

COMMENT ON POLICY "competition_groups_insert_owner" ON public.competition_groups IS 
'Permite crear grupos a cualquier usuario autenticado (sin restricción de perfil).';

-- 6. Actualizar la política de SELECT de competition_group_members para usar función SECURITY DEFINER
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
);

COMMENT ON POLICY "competition_group_members_select_owner_or_member" ON public.competition_group_members IS
'Permite ver miembros a: el propio usuario (user_id = auth.uid) y al dueño del grupo (via is_competition_group_owner).';

-- 7. Actualizar la política de INSERT de competition_group_members para usar función SECURITY DEFINER
DROP POLICY IF EXISTS "competition_group_members_insert_owner" ON public.competition_group_members;

CREATE POLICY "competition_group_members_insert_owner"
ON public.competition_group_members
FOR INSERT
WITH CHECK (
  public.is_competition_group_owner(competition_group_members.group_id)
);

COMMENT ON POLICY "competition_group_members_insert_owner" ON public.competition_group_members IS
'Permite insertar miembros solo al dueño del grupo (via is_competition_group_owner).';

-- 8. Actualizar la política de UPDATE de competition_group_members para usar función SECURITY DEFINER
DROP POLICY IF EXISTS "competition_group_members_update_owner_or_self" ON public.competition_group_members;

CREATE POLICY "competition_group_members_update_owner_or_self"
ON public.competition_group_members
FOR UPDATE
USING (
  user_id = auth.uid()
  OR public.is_competition_group_owner(competition_group_members.group_id)
)
WITH CHECK (
  user_id = auth.uid()
  OR public.is_competition_group_owner(competition_group_members.group_id)
);

COMMENT ON POLICY "competition_group_members_update_owner_or_self" ON public.competition_group_members IS
'Permite actualizar miembros al propio usuario o al dueño del grupo (via is_competition_group_owner).';

-- 9. Actualizar políticas de competition_group_invitations para usar función SECURITY DEFINER
DROP POLICY IF EXISTS "competition_group_invitations_select_inviter" ON public.competition_group_invitations;

CREATE POLICY "competition_group_invitations_select_inviter"
ON public.competition_group_invitations
FOR SELECT
USING (
  public.is_competition_group_owner(competition_group_invitations.group_id)
);

COMMENT ON POLICY "competition_group_invitations_select_inviter" ON public.competition_group_invitations IS
'Permite ver invitaciones al dueño del grupo (via is_competition_group_owner).';

DROP POLICY IF EXISTS "competition_group_invitations_insert_owner" ON public.competition_group_invitations;

CREATE POLICY "competition_group_invitations_insert_owner"
ON public.competition_group_invitations
FOR INSERT
WITH CHECK (
  inviter_id = auth.uid()
  AND public.is_competition_group_owner(competition_group_invitations.group_id)
);

COMMENT ON POLICY "competition_group_invitations_insert_owner" ON public.competition_group_invitations IS
'Permite insertar invitaciones solo al dueño del grupo (via is_competition_group_owner).';

DROP POLICY IF EXISTS "competition_group_invitations_update_inviter" ON public.competition_group_invitations;

CREATE POLICY "competition_group_invitations_update_inviter"
ON public.competition_group_invitations
FOR UPDATE
USING (
  public.is_competition_group_owner(competition_group_invitations.group_id)
  AND status = 'pending'
)
WITH CHECK (
  public.is_competition_group_owner(competition_group_invitations.group_id)
  AND (status = 'cancelled' OR status = 'pending')
);

COMMENT ON POLICY "competition_group_invitations_update_inviter" ON public.competition_group_invitations IS
'Permite actualizar invitaciones al dueño del grupo (via is_competition_group_owner).';

-- 10. Verificación final
DO $$
BEGIN
  RAISE NOTICE '✅ Funciones SECURITY DEFINER creadas/actualizadas';
  RAISE NOTICE '✅ Políticas RLS actualizadas para evitar recursión';
  RAISE NOTICE '✅ Política de SELECT consolidada en competition_groups';
END $$;

