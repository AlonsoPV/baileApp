-- ================================================
-- FIX: Resolver recursión infinita en política RLS de INSERT
-- ================================================
-- El problema: La política INSERT verifica profiles_academy/profiles_teacher,
-- y esas consultas pueden activar políticas que referencian competition_groups,
-- creando un ciclo infinito.
-- 
-- Solución: Usar una función SECURITY DEFINER que verifique el perfil
-- sin activar las políticas RLS de competition_groups.
-- ================================================

-- Función para verificar si el usuario es maestro o academia
-- SECURITY DEFINER permite que la función se ejecute con permisos del creador,
-- evitando que se activen las políticas RLS durante la verificación
CREATE OR REPLACE FUNCTION public.check_user_is_teacher_or_academy()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    -- Verificar perfil de maestro
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
    -- Verificar perfil de academia en profiles_school
    EXISTS (
      SELECT 1 FROM public.profiles_school
      WHERE profiles_school.user_id = auth.uid()
      AND (profiles_school.estado_aprobacion IS NULL OR profiles_school.estado_aprobacion = 'aprobado')
    )
  );
END;
$$;

COMMENT ON FUNCTION public.check_user_is_teacher_or_academy() IS 
'Verifica si el usuario actual tiene un perfil de maestro o academia aprobado. Usa SECURITY DEFINER para evitar recursión en políticas RLS.';

-- Actualizar la política de INSERT para usar la función
DROP POLICY IF EXISTS "competition_groups_insert_owner" ON public.competition_groups;

CREATE POLICY "competition_groups_insert_owner"
ON public.competition_groups
FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  AND public.check_user_is_teacher_or_academy()
);

COMMENT ON POLICY "competition_groups_insert_owner" ON public.competition_groups IS 
'Permite crear grupos solo a maestros o academias con perfil aprobado (o sin estado_aprobacion). Usa función SECURITY DEFINER para evitar recursión.';

-- ================================================
-- FIX ADICIONAL: Romper ciclo de recursión en SELECT
-- ================================================
-- El ciclo actual:
--  - competition_groups_select_* consulta competition_group_members
--  - competition_group_members_select_owner_or_member consulta competition_groups
-- Esto puede disparar "infinite recursion detected in policy for relation competition_groups"
-- cuando se hace SELECT sobre competition_groups.
--
-- Estrategia:
--  1) Dejar solo la política combinada de SELECT sobre competition_groups.
--  2) Cambiar la política de SELECT de competition_group_members para
--     que use una función SECURITY DEFINER en vez de consultar directamente
--     competition_groups dentro del USING.
-- ================================================

-- 1) Asegurarnos de que solo exista la política combinada de SELECT
DROP POLICY IF EXISTS "competition_groups_select_owner"   ON public.competition_groups;
DROP POLICY IF EXISTS "competition_groups_select_members" ON public.competition_groups;
DROP POLICY IF EXISTS "competition_groups_select_invited" ON public.competition_groups;

-- (Opcional / idempotente) Re-crear la política combinada por si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'competition_groups'
      AND p.polname = 'competition_groups_select_combined'
  ) THEN
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
  END IF;
END $$;

COMMENT ON POLICY "competition_groups_select_combined" ON public.competition_groups IS 
'Permite ver grupos donde el usuario es dueño, miembro activo, o tiene invitación pendiente';

-- 2) Función SECURITY DEFINER para saber si el usuario actual es dueño de un grupo
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

-- 3) Reemplazar la política de SELECT en competition_group_members
--    para que NO consulte directamente competition_groups en el USING,
--    sino a través de la función anterior.
DROP POLICY IF EXISTS "competition_group_members_select_owner_or_member"
ON public.competition_group_members;

CREATE POLICY "competition_group_members_select_owner_or_member"
ON public.competition_group_members
FOR SELECT
USING (
  -- El propio usuario ve sus filas
  user_id = auth.uid()
  OR
  -- El dueño del grupo puede ver a todos los miembros
  public.is_competition_group_owner(competition_group_members.group_id)
);

COMMENT ON POLICY "competition_group_members_select_owner_or_member" ON public.competition_group_members IS
'Permite ver miembros a: el propio usuario (user_id = auth.uid) y al dueño del grupo (via is_competition_group_owner).';

