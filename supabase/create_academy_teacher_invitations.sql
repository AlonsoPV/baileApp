-- Tabla para manejar invitaciones entre academias y maestros
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla academy_teacher_invitations
CREATE TABLE IF NOT EXISTS public.academy_teacher_invitations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  academy_id BIGINT NOT NULL REFERENCES public.profiles_academy(id) ON DELETE CASCADE,
  teacher_id BIGINT NOT NULL REFERENCES public.profiles_teacher(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  invited_by UUID NOT NULL REFERENCES auth.users(id), -- Usuario que envía la invitación (debe ser dueño de la academia)
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ, -- Fecha en que el maestro respondió
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(academy_id, teacher_id) -- Evitar invitaciones duplicadas
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_academy_teacher_invitations_academy ON public.academy_teacher_invitations(academy_id);
CREATE INDEX IF NOT EXISTS idx_academy_teacher_invitations_teacher ON public.academy_teacher_invitations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_academy_teacher_invitations_status ON public.academy_teacher_invitations(status);
CREATE INDEX IF NOT EXISTS idx_academy_teacher_invitations_invited_by ON public.academy_teacher_invitations(invited_by);

-- 3. Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_academy_teacher_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status != OLD.status AND NEW.status IN ('accepted', 'rejected') THEN
    NEW.responded_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_academy_teacher_invitations_updated ON public.academy_teacher_invitations;
CREATE TRIGGER trg_academy_teacher_invitations_updated
BEFORE UPDATE ON public.academy_teacher_invitations
FOR EACH ROW EXECUTE PROCEDURE public.set_academy_teacher_invitations_updated_at();

-- 4. Habilitar RLS
ALTER TABLE public.academy_teacher_invitations ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "academy_teacher_invitations_select_academy_owner" ON public.academy_teacher_invitations;
DROP POLICY IF EXISTS "academy_teacher_invitations_select_teacher_owner" ON public.academy_teacher_invitations;
DROP POLICY IF EXISTS "academy_teacher_invitations_select_teacher_or_academy_owner" ON public.academy_teacher_invitations;
DROP POLICY IF EXISTS "academy_teacher_invitations_insert_academy_owner" ON public.academy_teacher_invitations;
DROP POLICY IF EXISTS "academy_teacher_invitations_update_teacher_owner" ON public.academy_teacher_invitations;
DROP POLICY IF EXISTS "academy_teacher_invitations_update_academy_owner" ON public.academy_teacher_invitations;

-- Los dueños de academias pueden ver sus invitaciones enviadas
CREATE POLICY "academy_teacher_invitations_select_academy_owner"
ON public.academy_teacher_invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles_academy
    WHERE profiles_academy.id = academy_teacher_invitations.academy_id
    AND profiles_academy.user_id = auth.uid()
  )
);

-- Los maestros pueden ver las invitaciones que recibieron
CREATE POLICY "academy_teacher_invitations_select_teacher_owner"
ON public.academy_teacher_invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles_teacher
    WHERE profiles_teacher.id = academy_teacher_invitations.teacher_id
    AND profiles_teacher.user_id = auth.uid()
  )
);

-- Cualquier usuario (anon o authenticated) puede ver invitaciones aceptadas
-- Esto permite que las vistas públicas muestren relaciones maestro-academia
-- sin exponer invitaciones pendientes/rechazadas/canceladas.
CREATE POLICY "academy_teacher_invitations_select_public_accepted"
ON public.academy_teacher_invitations
FOR SELECT
USING (
  status = 'accepted'
);

-- Los dueños de academias pueden crear invitaciones
CREATE POLICY "academy_teacher_invitations_insert_academy_owner"
ON public.academy_teacher_invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles_academy
    WHERE profiles_academy.id = academy_teacher_invitations.academy_id
    AND profiles_academy.user_id = auth.uid()
  )
  AND invited_by = auth.uid()
);

-- Los maestros pueden actualizar el status de sus invitaciones (aceptar/rechazar)
CREATE POLICY "academy_teacher_invitations_update_teacher_owner"
ON public.academy_teacher_invitations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles_teacher
    WHERE profiles_teacher.id = academy_teacher_invitations.teacher_id
    AND profiles_teacher.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles_teacher
    WHERE profiles_teacher.id = academy_teacher_invitations.teacher_id
    AND profiles_teacher.user_id = auth.uid()
  )
);

-- Los dueños de academias pueden cancelar sus invitaciones
CREATE POLICY "academy_teacher_invitations_update_academy_owner"
ON public.academy_teacher_invitations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles_academy
    WHERE profiles_academy.id = academy_teacher_invitations.academy_id
    AND profiles_academy.user_id = auth.uid()
  )
  AND status = 'pending'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles_academy
    WHERE profiles_academy.id = academy_teacher_invitations.academy_id
    AND profiles_academy.user_id = auth.uid()
  )
  AND (status = 'cancelled' OR status = 'pending')
);

-- 6. Vista para obtener maestros aceptados de una academia
DROP VIEW IF EXISTS public.v_academy_accepted_teachers;
CREATE VIEW public.v_academy_accepted_teachers AS
SELECT 
  ati.academy_id,
  ati.teacher_id,
  pt.id as teacher_profile_id,
  pt.user_id as teacher_user_id,
  pt.nombre_publico as teacher_name,
  pt.bio as teacher_bio,
  pt.avatar_url as teacher_avatar,
  pt.portada_url as teacher_portada,
  pt.ritmos as teacher_ritmos,
  pt.zonas as teacher_zonas,
  pt.redes_sociales as teacher_redes_sociales,
  ati.invited_at,
  ati.responded_at,
  ati.created_at
FROM public.academy_teacher_invitations ati
INNER JOIN public.profiles_teacher pt ON pt.id = ati.teacher_id
WHERE ati.status = 'accepted';

-- 7. Vista para obtener academias donde un maestro enseña
DROP VIEW IF EXISTS public.v_teacher_academies;
CREATE VIEW public.v_teacher_academies AS
SELECT 
  ati.teacher_id,
  ati.academy_id,
  pa.id as academy_profile_id,
  pa.user_id as academy_user_id,
  pa.nombre_publico as academy_name,
  pa.bio as academy_bio,
  pa.avatar_url as academy_avatar,
  pa.portada_url as academy_portada,
  pa.ritmos as academy_ritmos,
  pa.zonas as academy_zonas,
  ati.invited_at,
  ati.responded_at,
  ati.created_at
FROM public.academy_teacher_invitations ati
INNER JOIN public.profiles_academy pa ON pa.id = ati.academy_id
WHERE ati.status = 'accepted';

-- 8. Otorgar permisos
GRANT SELECT ON public.v_academy_accepted_teachers TO anon, authenticated;
GRANT SELECT ON public.v_teacher_academies TO anon, authenticated;

-- 9. Comentarios
COMMENT ON TABLE public.academy_teacher_invitations IS 'Invitaciones entre academias y maestros';
COMMENT ON COLUMN public.academy_teacher_invitations.status IS 'Estado: pending, accepted, rejected, cancelled';
COMMENT ON VIEW public.v_academy_accepted_teachers IS 'Maestros que han aceptado colaborar con academias';
COMMENT ON VIEW public.v_teacher_academies IS 'Academias donde un maestro enseña';

-- 10. Verificación
DO $$
BEGIN
  RAISE NOTICE '✅ Tabla academy_teacher_invitations creada exitosamente';
  RAISE NOTICE '✅ Vistas creadas: v_academy_accepted_teachers, v_teacher_academies';
  RAISE NOTICE '✅ Políticas RLS configuradas';
END $$;

