-- ================================================
-- MÓDULO: Grupos de Competencia
-- ================================================
-- Tablas para gestionar grupos de competencia creados por Maestros o Academias
-- ================================================

-- 1. Tabla principal: competition_groups
CREATE TABLE IF NOT EXISTS public.competition_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  academy_id BIGINT REFERENCES public.profiles_academy(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  training_schedule TEXT, -- Descripción de horarios (ej. "Lunes y Miércoles 7-9 PM")
  training_location TEXT NOT NULL,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('monthly', 'per_session', 'package')),
  cost_amount NUMERIC(10, 2) NOT NULL,
  cover_image_url TEXT,
  promo_video_url TEXT, -- URL de video (puede ser YouTube/Vimeo o archivo subido)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de miembros: competition_group_members
CREATE TABLE IF NOT EXISTS public.competition_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.competition_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'assistant')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(group_id, user_id) -- Un usuario solo puede estar una vez en un grupo
);

-- 3. Tabla de invitaciones: competition_group_invitations
CREATE TABLE IF NOT EXISTS public.competition_group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.competition_groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message TEXT, -- Mensaje personalizado en la invitación
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, invitee_id) -- Evitar invitaciones duplicadas
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_competition_groups_owner ON public.competition_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_competition_groups_academy ON public.competition_groups(academy_id);
CREATE INDEX IF NOT EXISTS idx_competition_groups_active ON public.competition_groups(is_active);

CREATE INDEX IF NOT EXISTS idx_competition_group_members_group ON public.competition_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_competition_group_members_user ON public.competition_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_competition_group_members_active ON public.competition_group_members(is_active);

CREATE INDEX IF NOT EXISTS idx_competition_group_invitations_group ON public.competition_group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_competition_group_invitations_inviter ON public.competition_group_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_competition_group_invitations_invitee ON public.competition_group_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_competition_group_invitations_status ON public.competition_group_invitations(status);

-- 5. Triggers para updated_at
CREATE OR REPLACE FUNCTION public.set_competition_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_competition_groups_updated ON public.competition_groups;
CREATE TRIGGER trg_competition_groups_updated
BEFORE UPDATE ON public.competition_groups
FOR EACH ROW EXECUTE PROCEDURE public.set_competition_groups_updated_at();

CREATE OR REPLACE FUNCTION public.set_competition_group_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status != OLD.status AND NEW.status IN ('accepted', 'rejected') THEN
    NEW.responded_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_competition_group_invitations_updated ON public.competition_group_invitations;
CREATE TRIGGER trg_competition_group_invitations_updated
BEFORE UPDATE ON public.competition_group_invitations
FOR EACH ROW EXECUTE PROCEDURE public.set_competition_group_invitations_updated_at();

-- 6. Trigger para agregar miembro automáticamente cuando se acepta una invitación
CREATE OR REPLACE FUNCTION public.handle_competition_group_invitation_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la invitación fue aceptada, crear el registro en competition_group_members
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    INSERT INTO public.competition_group_members (group_id, user_id, role, is_active)
    VALUES (NEW.group_id, NEW.invitee_id, 'student', true)
    ON CONFLICT (group_id, user_id) DO UPDATE
    SET is_active = true, joined_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_competition_group_invitation_accepted ON public.competition_group_invitations;
CREATE TRIGGER trg_competition_group_invitation_accepted
AFTER UPDATE ON public.competition_group_invitations
FOR EACH ROW
WHEN (NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted'))
EXECUTE PROCEDURE public.handle_competition_group_invitation_accepted();

-- 7. Habilitar RLS
ALTER TABLE public.competition_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_group_invitations ENABLE ROW LEVEL SECURITY;

-- 8. Políticas RLS para competition_groups
-- Ver: dueño, miembros del grupo, y usuarios invitados (pending)
DROP POLICY IF EXISTS "competition_groups_select_owner" ON public.competition_groups;
CREATE POLICY "competition_groups_select_owner"
ON public.competition_groups
FOR SELECT
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "competition_groups_select_members" ON public.competition_groups;
CREATE POLICY "competition_groups_select_members"
ON public.competition_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.competition_group_members
    WHERE competition_group_members.group_id = competition_groups.id
    AND competition_group_members.user_id = auth.uid()
    AND competition_group_members.is_active = true
  )
);

DROP POLICY IF EXISTS "competition_groups_select_invited" ON public.competition_groups;
CREATE POLICY "competition_groups_select_invited"
ON public.competition_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.competition_group_invitations
    WHERE competition_group_invitations.group_id = competition_groups.id
    AND competition_group_invitations.invitee_id = auth.uid()
    AND competition_group_invitations.status = 'pending'
  )
);

-- Crear: solo maestros o academias (verificar ambas tablas posibles de academias)
DROP POLICY IF EXISTS "competition_groups_insert_owner" ON public.competition_groups;
CREATE POLICY "competition_groups_insert_owner"
ON public.competition_groups
FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles_teacher
      WHERE profiles_teacher.user_id = auth.uid()
      AND (profiles_teacher.estado_aprobacion IS NULL OR profiles_teacher.estado_aprobacion = 'aprobado')
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles_academy
      WHERE profiles_academy.user_id = auth.uid()
      AND (profiles_academy.estado_aprobacion IS NULL OR profiles_academy.estado_aprobacion = 'aprobado')
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles_school
      WHERE profiles_school.user_id = auth.uid()
      AND (profiles_school.estado_aprobacion IS NULL OR profiles_school.estado_aprobacion = 'aprobado')
    )
  )
);

-- Actualizar: solo dueño
DROP POLICY IF EXISTS "competition_groups_update_owner" ON public.competition_groups;
CREATE POLICY "competition_groups_update_owner"
ON public.competition_groups
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Eliminar: solo dueño
DROP POLICY IF EXISTS "competition_groups_delete_owner" ON public.competition_groups;
CREATE POLICY "competition_groups_delete_owner"
ON public.competition_groups
FOR DELETE
USING (owner_id = auth.uid());

-- 9. Políticas RLS para competition_group_members
-- Ver: dueño del grupo y miembros
DROP POLICY IF EXISTS "competition_group_members_select_owner_or_member" ON public.competition_group_members;
CREATE POLICY "competition_group_members_select_owner_or_member"
ON public.competition_group_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.competition_groups
    WHERE competition_groups.id = competition_group_members.group_id
    AND competition_groups.owner_id = auth.uid()
  )
);

-- Insertar: solo dueño del grupo (o automáticamente por trigger)
DROP POLICY IF EXISTS "competition_group_members_insert_owner" ON public.competition_group_members;
CREATE POLICY "competition_group_members_insert_owner"
ON public.competition_group_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.competition_groups
    WHERE competition_groups.id = competition_group_members.group_id
    AND competition_groups.owner_id = auth.uid()
  )
);

-- Actualizar: dueño del grupo o el mismo usuario
DROP POLICY IF EXISTS "competition_group_members_update_owner_or_self" ON public.competition_group_members;
CREATE POLICY "competition_group_members_update_owner_or_self"
ON public.competition_group_members
FOR UPDATE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.competition_groups
    WHERE competition_groups.id = competition_group_members.group_id
    AND competition_groups.owner_id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.competition_groups
    WHERE competition_groups.id = competition_group_members.group_id
    AND competition_groups.owner_id = auth.uid()
  )
);

-- 10. Políticas RLS para competition_group_invitations
-- Ver: inviter (dueño del grupo) o invitee (usuario invitado)
DROP POLICY IF EXISTS "competition_group_invitations_select_inviter" ON public.competition_group_invitations;
CREATE POLICY "competition_group_invitations_select_inviter"
ON public.competition_group_invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.competition_groups
    WHERE competition_groups.id = competition_group_invitations.group_id
    AND competition_groups.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "competition_group_invitations_select_invitee" ON public.competition_group_invitations;
CREATE POLICY "competition_group_invitations_select_invitee"
ON public.competition_group_invitations
FOR SELECT
USING (invitee_id = auth.uid());

-- Insertar: solo dueño del grupo
DROP POLICY IF EXISTS "competition_group_invitations_insert_owner" ON public.competition_group_invitations;
CREATE POLICY "competition_group_invitations_insert_owner"
ON public.competition_group_invitations
FOR INSERT
WITH CHECK (
  inviter_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.competition_groups
    WHERE competition_groups.id = competition_group_invitations.group_id
    AND competition_groups.owner_id = auth.uid()
  )
);

-- Actualizar: inviter puede cancelar, invitee puede aceptar/rechazar
DROP POLICY IF EXISTS "competition_group_invitations_update_inviter" ON public.competition_group_invitations;
CREATE POLICY "competition_group_invitations_update_inviter"
ON public.competition_group_invitations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.competition_groups
    WHERE competition_groups.id = competition_group_invitations.group_id
    AND competition_groups.owner_id = auth.uid()
  )
  AND status = 'pending'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.competition_groups
    WHERE competition_groups.id = competition_group_invitations.group_id
    AND competition_groups.owner_id = auth.uid()
  )
  AND (status = 'cancelled' OR status = 'pending')
);

DROP POLICY IF EXISTS "competition_group_invitations_update_invitee" ON public.competition_group_invitations;
CREATE POLICY "competition_group_invitations_update_invitee"
ON public.competition_group_invitations
FOR UPDATE
USING (invitee_id = auth.uid() AND status = 'pending')
WITH CHECK (
  invitee_id = auth.uid()
  AND (status = 'accepted' OR status = 'rejected')
);

-- 11. Comentarios
COMMENT ON TABLE public.competition_groups IS 'Grupos de competencia creados por Maestros o Academias';
COMMENT ON COLUMN public.competition_groups.cost_type IS 'Tipo de costo: monthly (mensual), per_session (por sesión), package (paquete)';
COMMENT ON TABLE public.competition_group_members IS 'Miembros activos de un grupo de competencia';
COMMENT ON TABLE public.competition_group_invitations IS 'Invitaciones para unirse a grupos de competencia';

-- 12. Verificación
DO $$
BEGIN
  RAISE NOTICE '✅ Tablas de grupos de competencia creadas exitosamente';
  RAISE NOTICE '✅ Políticas RLS configuradas';
  RAISE NOTICE '✅ Triggers configurados';
END $$;

