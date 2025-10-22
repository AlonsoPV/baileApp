-- SCRIPT_14_ROLE_REQUESTS_SYSTEM.sql
-- Sistema de solicitudes de roles con aprobación por super admin

-- 1) Tabla de administradores
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT NOW()
);

-- Helper: ¿es admin?
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean 
LANGUAGE sql 
STABLE 
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = uid)
$$;

COMMENT ON FUNCTION public.is_admin(uuid) IS 
'Verifica si un usuario es administrador del sistema';

-- 2) Tabla de solicitudes de rol
CREATE TABLE IF NOT EXISTS public.role_requests (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('organizador','maestro','academia','marca')),
  note text,
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','aprobado','rechazado')),
  created_at timestamptz DEFAULT NOW(),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz
);

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_role_requests_user ON public.role_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_role_requests_status ON public.role_requests(status);
CREATE INDEX IF NOT EXISTS idx_role_requests_role ON public.role_requests(role);

-- Habilitar RLS
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- El usuario puede ver las suyas, el admin ve todas
DROP POLICY IF EXISTS "role_requests_select" ON public.role_requests;
CREATE POLICY "role_requests_select"
ON public.role_requests FOR SELECT
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- El usuario puede crear solicitudes propias
DROP POLICY IF EXISTS "role_requests_insert_own" ON public.role_requests;
CREATE POLICY "role_requests_insert_own"
ON public.role_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

-- El usuario puede borrar si sigue pendiente; admin puede todo
DROP POLICY IF EXISTS "role_requests_delete_pending" ON public.role_requests;
CREATE POLICY "role_requests_delete_pending"
ON public.role_requests FOR DELETE
USING ((user_id = auth.uid() AND status = 'pendiente') OR public.is_admin(auth.uid()));

-- Solo admin actualiza (aprobar/rechazar)
DROP POLICY IF EXISTS "role_requests_update_admin" ON public.role_requests;
CREATE POLICY "role_requests_update_admin"
ON public.role_requests FOR UPDATE
USING (public.is_admin(auth.uid()));

-- 3) Perfiles mínimos para maestros, academias y marcas

-- Tabla profiles_teacher
CREATE TABLE IF NOT EXISTS public.profiles_teacher (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_publico text,
  bio text,
  ritmos bigint[] DEFAULT '{}',
  zonas bigint[] DEFAULT '{}',
  media jsonb DEFAULT '[]'::jsonb,
  estado_aprobacion text DEFAULT 'aprobado' CHECK (estado_aprobacion IN ('borrador','en_revision','aprobado','rechazado')),
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabla profiles_school (academias)
CREATE TABLE IF NOT EXISTS public.profiles_school (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_publico text,
  bio text,
  ritmos bigint[] DEFAULT '{}',
  zonas bigint[] DEFAULT '{}',
  media jsonb DEFAULT '[]'::jsonb,
  estado_aprobacion text DEFAULT 'aprobado' CHECK (estado_aprobacion IN ('borrador','en_revision','aprobado','rechazado')),
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabla profiles_brand (marcas)
CREATE TABLE IF NOT EXISTS public.profiles_brand (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_publico text,
  bio text,
  redes jsonb DEFAULT '{}'::jsonb,
  media jsonb DEFAULT '[]'::jsonb,
  estado_aprobacion text DEFAULT 'aprobado' CHECK (estado_aprobacion IN ('borrador','en_revision','aprobado','rechazado')),
  created_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS para profiles_teacher
ALTER TABLE public.profiles_teacher ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read teachers" ON public.profiles_teacher;
CREATE POLICY "read teachers" 
ON public.profiles_teacher FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "owner edit teacher" ON public.profiles_teacher;
CREATE POLICY "owner edit teacher" 
ON public.profiles_teacher FOR ALL 
USING (user_id = auth.uid());

-- RLS para profiles_school
ALTER TABLE public.profiles_school ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read schools" ON public.profiles_school;
CREATE POLICY "read schools" 
ON public.profiles_school FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "owner edit school" ON public.profiles_school;
CREATE POLICY "owner edit school" 
ON public.profiles_school FOR ALL 
USING (user_id = auth.uid());

-- RLS para profiles_brand
ALTER TABLE public.profiles_brand ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read brands" ON public.profiles_brand;
CREATE POLICY "read brands" 
ON public.profiles_brand FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "owner edit brand" ON public.profiles_brand;
CREATE POLICY "owner edit brand" 
ON public.profiles_brand FOR ALL 
USING (user_id = auth.uid());

-- 4) RPC: aprobar o rechazar y autocrear perfil
CREATE OR REPLACE FUNCTION public.approve_role_request(p_request_id bigint, p_approve boolean, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user uuid;
  v_role text;
  v_exists int;
BEGIN
  -- Solo admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Solo administradores pueden aprobar';
  END IF;

  SELECT user_id, role INTO v_user, v_role
  FROM public.role_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada';
  END IF;

  IF p_approve THEN
    -- Aprobar solicitud
    UPDATE public.role_requests
      SET status = 'aprobado',
          note = COALESCE(p_note, note),
          reviewed_by = auth.uid(),
          reviewed_at = NOW()
    WHERE id = p_request_id;

    -- Crear perfil según rol si no existe
    IF v_role = 'organizador' THEN
      SELECT COUNT(*) INTO v_exists FROM public.profiles_organizer WHERE user_id = v_user;
      IF v_exists = 0 THEN
        INSERT INTO public.profiles_organizer(user_id, nombre_publico, estado_aprobacion)
        VALUES (v_user, 'Mi Organización', 'aprobado');
      END IF;
    ELSIF v_role = 'maestro' THEN
      SELECT COUNT(*) INTO v_exists FROM public.profiles_teacher WHERE user_id = v_user;
      IF v_exists = 0 THEN
        INSERT INTO public.profiles_teacher(user_id, nombre_publico)
        VALUES (v_user, 'Mi Perfil Maestro');
      END IF;
    ELSIF v_role = 'academia' THEN
      SELECT COUNT(*) INTO v_exists FROM public.profiles_school WHERE user_id = v_user;
      IF v_exists = 0 THEN
        INSERT INTO public.profiles_school(user_id, nombre_publico)
        VALUES (v_user, 'Mi Academia');
      END IF;
    ELSIF v_role = 'marca' THEN
      SELECT COUNT(*) INTO v_exists FROM public.profiles_brand WHERE user_id = v_user;
      IF v_exists = 0 THEN
        INSERT INTO public.profiles_brand(user_id, nombre_publico)
        VALUES (v_user, 'Mi Marca');
      END IF;
    END IF;

  ELSE
    -- Rechazar solicitud
    UPDATE public.role_requests
      SET status = 'rechazado',
          note = COALESCE(p_note, note),
          reviewed_by = auth.uid(),
          reviewed_at = NOW()
    WHERE id = p_request_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_role_request(bigint, boolean, text) TO authenticated;

COMMENT ON FUNCTION public.approve_role_request(bigint, boolean, text) IS 
'Función RPC para aprobar/rechazar solicitudes de rol. Solo ejecutable por administradores. Al aprobar, crea automáticamente el perfil del rol solicitado.';

-- 5) Verificación
DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✅ Sistema de roles implementado';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  - admins';
  RAISE NOTICE '  - role_requests';
  RAISE NOTICE '  - profiles_teacher';
  RAISE NOTICE '  - profiles_school';
  RAISE NOTICE '  - profiles_brand';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  - is_admin(uuid)';
  RAISE NOTICE '  - approve_role_request(bigint, boolean, text)';
  RAISE NOTICE '';
  RAISE NOTICE 'Para convertir un usuario en admin:';
  RAISE NOTICE '  INSERT INTO admins (user_id) VALUES (''tu-uuid-aqui'');';
  RAISE NOTICE '==========================================';
END $$;

-- 6) Queries útiles
-- Ver todas las solicitudes
-- SELECT * FROM role_requests ORDER BY created_at DESC;

-- Ver todos los admins
-- SELECT a.user_id, au.email FROM admins a JOIN auth.users au ON a.user_id = au.id;

-- Hacer a alguien admin (reemplaza con el UUID real de auth.users)
-- INSERT INTO admins (user_id) VALUES ('uuid-del-usuario');

