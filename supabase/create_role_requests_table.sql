-- ========================================
-- 📋 CREAR TABLA role_requests
-- ========================================
-- Sistema de solicitudes de roles para usuarios

-- 1️⃣ Crear tabla role_requests
CREATE TABLE IF NOT EXISTS public.role_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_slug text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  socials jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'aprobado', 'approved', 'rechazado', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT role_requests_role_slug_fkey FOREIGN KEY (role_slug) REFERENCES public.roles(slug) ON DELETE CASCADE,
  CONSTRAINT role_requests_user_role_unique UNIQUE (user_id, role_slug)
);

-- 2️⃣ Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_role_requests_user_id ON public.role_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_role_requests_role_slug ON public.role_requests(role_slug);
CREATE INDEX IF NOT EXISTS idx_role_requests_status ON public.role_requests(status);
CREATE INDEX IF NOT EXISTS idx_role_requests_created_at ON public.role_requests(created_at DESC);

-- 3️⃣ Trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_role_requests_updated_at ON public.role_requests;

CREATE TRIGGER trg_role_requests_updated_at
  BEFORE UPDATE ON public.role_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4️⃣ RLS Policies
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver sus propias solicitudes
DROP POLICY IF EXISTS sel_role_requests_own ON public.role_requests;
CREATE POLICY sel_role_requests_own ON public.role_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden crear solicitudes
DROP POLICY IF EXISTS ins_role_requests_own ON public.role_requests;
CREATE POLICY ins_role_requests_own ON public.role_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Solo el usuario puede actualizar sus propias solicitudes (solo si está pending)
DROP POLICY IF EXISTS upd_role_requests_own ON public.role_requests;
CREATE POLICY upd_role_requests_own ON public.role_requests
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Policy: Los superadmins pueden ver todas las solicitudes
DROP POLICY IF EXISTS sel_role_requests_admin ON public.role_requests;
CREATE POLICY sel_role_requests_admin ON public.role_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_slug = 'superadmin'
    )
  );

-- Policy: Los superadmins pueden actualizar cualquier solicitud
DROP POLICY IF EXISTS upd_role_requests_admin ON public.role_requests;
CREATE POLICY upd_role_requests_admin ON public.role_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_slug = 'superadmin'
    )
  );

-- 5️⃣ RPC: Aprobar solicitud (solo superadmin)
CREATE OR REPLACE FUNCTION public.rpc_approve_role_request(
  p_request_id uuid
)
RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_role_slug text;
BEGIN
  -- Verificar que el caller es superadmin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role_slug = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Solo superadmins pueden aprobar solicitudes';
  END IF;

  -- Obtener datos de la solicitud
  SELECT user_id, role_slug INTO v_user_id, v_role_slug
  FROM public.role_requests
  WHERE id = p_request_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada o ya procesada';
  END IF;

  -- Actualizar estado de la solicitud
  UPDATE public.role_requests
  SET 
    status = 'aprobado',
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE id = p_request_id;

  -- Asignar el rol al usuario (si no lo tiene ya)
  INSERT INTO public.user_roles (user_id, role_slug)
  VALUES (v_user_id, v_role_slug)
  ON CONFLICT (user_id, role_slug) DO NOTHING;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6️⃣ RPC: Rechazar solicitud (solo superadmin)
CREATE OR REPLACE FUNCTION public.rpc_reject_role_request(
  p_request_id uuid
)
RETURNS void AS $$
BEGIN
  -- Verificar que el caller es superadmin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role_slug = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Solo superadmins pueden rechazar solicitudes';
  END IF;

  -- Actualizar estado de la solicitud
  UPDATE public.role_requests
  SET 
    status = 'rechazado',
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE id = p_request_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada o ya procesada';
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7️⃣ Verificación
SELECT 
  'role_requests creada' as tabla,
  COUNT(*) as total_solicitudes
FROM public.role_requests;

-- 8️⃣ Ver políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'role_requests'
ORDER BY policyname;

-- ========================================
-- ✅ TABLA CREADA EXITOSAMENTE
-- ========================================
-- Ahora los usuarios podrán:
-- 1. Crear solicitudes de roles
-- 2. Ver sus propias solicitudes
-- 3. Los superadmins podrán aprobar/rechazar

