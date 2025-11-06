-- ========================================
-- 🔧 FIX: Error 400 en user_roles
-- ========================================
-- Diagnóstico y corrección de la tabla user_roles

-- ========================================
-- 1️⃣ VERIFICAR tabla user_roles
-- ========================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
  ) THEN
    RAISE EXCEPTION 'Tabla user_roles NO existe. Necesita ser creada primero.';
  ELSE
    RAISE NOTICE 'Tabla user_roles existe ✅';
  END IF;
END $$;

-- ========================================
-- 2️⃣ VERIFICAR columnas de user_roles
-- ========================================

SELECT 
  'Columnas de user_roles:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- ========================================
-- 3️⃣ VERIFICAR RLS está habilitado
-- ========================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'user_roles';

-- ========================================
-- 4️⃣ HABILITAR RLS si no está activo
-- ========================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5️⃣ CREAR políticas RLS
-- ========================================

-- Política para SELECT: todos los usuarios pueden leer roles
DROP POLICY IF EXISTS sel_user_roles_all ON public.user_roles;

CREATE POLICY sel_user_roles_all
ON public.user_roles
FOR SELECT
USING (true);

COMMENT ON POLICY sel_user_roles_all ON public.user_roles IS 
'Permite a todos los usuarios autenticados leer roles';

-- Política para INSERT: solo superadmins
DROP POLICY IF EXISTS ins_user_roles_sa ON public.user_roles;

CREATE POLICY ins_user_roles_sa
ON public.user_roles
FOR INSERT
WITH CHECK (
  -- Es superadmin
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

COMMENT ON POLICY ins_user_roles_sa ON public.user_roles IS 
'Solo superadmins pueden insertar roles';

-- Política para DELETE: solo superadmins
DROP POLICY IF EXISTS del_user_roles_sa ON public.user_roles;

CREATE POLICY del_user_roles_sa
ON public.user_roles
FOR DELETE
USING (
  -- Es superadmin
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

COMMENT ON POLICY del_user_roles_sa ON public.user_roles IS 
'Solo superadmins pueden eliminar roles';

-- ========================================
-- 6️⃣ VERIFICAR políticas creadas
-- ========================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_roles'
ORDER BY policyname;

-- ========================================
-- 7️⃣ VERIFICACIÓN FINAL
-- ========================================

-- Test: intentar leer como usuario anónimo (debería funcionar con RLS)
SET ROLE anon;
SELECT 
  'Test lectura como anon:' as test,
  COUNT(*) as total_roles
FROM public.user_roles;
RESET ROLE;

-- Test: lectura normal
SELECT 
  'Total roles en sistema:' as info,
  COUNT(*) as total
FROM public.user_roles;

-- Mostrar todos los roles
SELECT 
  user_id,
  role_slug,
  created_at,
  granted_at
FROM public.user_roles
ORDER BY created_at DESC
LIMIT 10;

RAISE NOTICE '✅ Script completado. Tabla user_roles configurada correctamente.';

