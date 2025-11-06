-- ========================================
-- 🔧 FIX COMPLETO: user_roles
-- ========================================
-- Este script crea/arregla la tabla user_roles
-- y configura todas las políticas RLS necesarias

-- ========================================
-- 1️⃣ CREAR tabla user_roles si no existe
-- ========================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_slug text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, role_slug)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_slug ON public.user_roles(role_slug);

-- ========================================
-- 2️⃣ HABILITAR RLS
-- ========================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3️⃣ CREAR políticas RLS
-- ========================================

-- Eliminar políticas existentes si hay
DROP POLICY IF EXISTS sel_user_roles_all ON public.user_roles;
DROP POLICY IF EXISTS ins_user_roles_sa ON public.user_roles;
DROP POLICY IF EXISTS del_user_roles_sa ON public.user_roles;

-- Política para SELECT: todos los usuarios pueden leer roles
CREATE POLICY sel_user_roles_all
ON public.user_roles
FOR SELECT
USING (true);

COMMENT ON POLICY sel_user_roles_all ON public.user_roles IS 
'Permite a todos los usuarios autenticados leer roles';

-- Política para INSERT: solo superadmins
CREATE POLICY ins_user_roles_sa
ON public.user_roles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

COMMENT ON POLICY ins_user_roles_sa ON public.user_roles IS 
'Solo superadmins pueden insertar roles';

-- Política para DELETE: solo superadmins
CREATE POLICY del_user_roles_sa
ON public.user_roles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

COMMENT ON POLICY del_user_roles_sa ON public.user_roles IS 
'Solo superadmins pueden eliminar roles';

-- ========================================
-- 4️⃣ ASEGURAR que la tabla roles existe
-- ========================================

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insertar roles básicos si no existen
INSERT INTO public.roles (slug, name)
VALUES 
  ('usuario', 'Usuario'),
  ('organizador', 'Organizador'),
  ('academia', 'Academia'),
  ('maestro', 'Maestro'),
  ('marca', 'Marca'),
  ('superadmin', 'Super Administrador')
ON CONFLICT (slug) DO NOTHING;

-- ========================================
-- 5️⃣ ASIGNAR rol inicial al usuario
-- ========================================

-- Asignar rol 'organizador' al usuario que está intentando crear el perfil
INSERT INTO public.user_roles (user_id, role_slug)
VALUES ('39555d3a-68fa-4bbe-b35e-c12756477285', 'organizador')
ON CONFLICT (user_id, role_slug) DO NOTHING;

-- También asignar rol 'usuario' por defecto
INSERT INTO public.user_roles (user_id, role_slug)
VALUES ('39555d3a-68fa-4bbe-b35e-c12756477285', 'usuario')
ON CONFLICT (user_id, role_slug) DO NOTHING;

-- ========================================
-- 6️⃣ VERIFICACIÓN FINAL
-- ========================================

-- Ver estructura de la tabla
SELECT 
  'Columnas de user_roles:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- Ver RLS
SELECT 
  'RLS habilitado:' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'user_roles';

-- Ver políticas
SELECT 
  'Políticas RLS:' as info,
  schemaname,
  tablename,
  policyname,
  cmd as operacion
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_roles'
ORDER BY policyname;

-- Ver roles del usuario
SELECT 
  'Roles del usuario:' as info,
  user_id,
  role_slug,
  created_at
FROM public.user_roles
WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285';

-- Ver todos los roles disponibles
SELECT 
  'Roles disponibles en el sistema:' as info,
  slug,
  name
FROM public.roles
ORDER BY slug;

-- ========================================
-- 7️⃣ TEST de lectura
-- ========================================

-- Probar lectura como usuario anónimo
SET ROLE anon;
SELECT 
  'Test lectura como anon (debe funcionar):' as test,
  COUNT(*) as total_roles_visibles
FROM public.user_roles;
RESET ROLE;

-- ========================================
-- ✅ MENSAJE FINAL
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ Script completado exitosamente';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tabla user_roles configurada:';
  RAISE NOTICE '   - Estructura creada ✅';
  RAISE NOTICE '   - RLS habilitado ✅';
  RAISE NOTICE '   - Políticas creadas ✅';
  RAISE NOTICE '   - Roles asignados al usuario ✅';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Puedes refrescar el frontend ahora';
  RAISE NOTICE '   El error 400 debería estar resuelto';
END $$;

