-- ================================================
-- FIX: Relajar política de INSERT para competition_groups
-- ================================================
-- Contexto:
--  - Ya resolvimos la recursión infinita usando funciones SECURITY DEFINER.
--  - La política actual de INSERT usa check_user_is_teacher_or_academy()
--    que filtra por estado_aprobacion = 'aprobado' o NULL.
--  - Si el perfil de maestro/academia tiene otro estado, el INSERT falla
--    con "new row violates row-level security policy for table competition_groups".
--
-- Decisión:
--  - Considerar suficiente que exista un perfil de maestro/academia/escuela,
--    sin filtrar por estado_aprobacion.
--  - Esto hace que la lógica coincida con el frontend, que ya muestra el botón
--    de crear grupo si existe un perfil, aunque no esté "aprobado".
-- ================================================

-- Re-definir la función para que solo verifique la existencia del perfil
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
'Devuelve true si el usuario actual tiene algún perfil en profiles_teacher, profiles_academy o profiles_school, sin filtrar por estado_aprobacion.';

-- La política de INSERT ya usa esta función, así que no necesitamos cambiarla:
-- competition_groups_insert_owner:
--   WITH CHECK (owner_id = auth.uid() AND check_user_is_teacher_or_academy())


