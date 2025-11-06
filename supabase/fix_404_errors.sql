-- ========================================
-- 🔧 FIX: Errores 404 al iniciar sesión
-- ========================================
-- Este script crea todas las vistas y tablas faltantes
-- que causan errores 404 en el frontend

-- ========================================
-- 1️⃣ CREAR VISTA 'admins'
-- ========================================
-- Mapea user_roles con role_slug = 'superadmin'

DROP VIEW IF EXISTS public.admins CASCADE;

CREATE OR REPLACE VIEW public.admins AS
SELECT 
  user_id,
  created_at
FROM public.user_roles
WHERE role_slug = 'superadmin';

COMMENT ON VIEW public.admins IS 'Vista que muestra usuarios con rol superadmin';

-- Verificar
SELECT 
  'admins' as vista,
  COUNT(*) as total_admins
FROM public.admins;

-- ========================================
-- 2️⃣ VERIFICAR tabla role_requests existe
-- ========================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'role_requests'
  ) THEN
    RAISE NOTICE 'Tabla role_requests NO existe. Ejecuta: create_role_requests_table.sql';
  ELSE
    RAISE NOTICE 'Tabla role_requests existe ✅';
  END IF;
END $$;

-- ========================================
-- 3️⃣ VERIFICAR columnas de role_requests
-- ========================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'role_requests'
ORDER BY ordinal_position;

-- ========================================
-- 4️⃣ CREAR RLS policy para admins view
-- ========================================

-- Permitir SELECT a todos los usuarios autenticados
-- (necesario para que useIsAdmin funcione)

-- La vista no puede tener políticas directamente,
-- pero hereda las políticas de user_roles

-- Verificar que user_roles tiene política de lectura
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_roles'
    AND policyname = 'sel_user_roles_all'
  ) THEN
    -- Crear política para que todos puedan leer user_roles
    -- (necesario para verificar roles en el frontend)
    EXECUTE 'DROP POLICY IF EXISTS sel_user_roles_all ON public.user_roles';
    EXECUTE 'CREATE POLICY sel_user_roles_all ON public.user_roles FOR SELECT USING (true)';
    RAISE NOTICE 'Política sel_user_roles_all creada ✅';
  ELSE
    RAISE NOTICE 'Política sel_user_roles_all ya existe ✅';
  END IF;
END $$;

-- ========================================
-- 5️⃣ DIAGNÓSTICO: Ver qué tablas/vistas faltan
-- ========================================

-- Verificar todas las tablas/vistas que el frontend busca
SELECT 
  'Tabla/Vista' as tipo,
  table_name as nombre,
  CASE 
    WHEN table_type = 'VIEW' THEN '👁️ Vista'
    WHEN table_type = 'BASE TABLE' THEN '📊 Tabla'
    ELSE table_type
  END as tipo_objeto
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'admins',
  'role_requests',
  'user_roles',
  'roles',
  'profiles_user',
  'v_user_public'
)
ORDER BY table_name;

-- ========================================
-- 6️⃣ VERIFICAR políticas RLS
-- ========================================

-- Ver todas las políticas relacionadas con roles
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || pg_get_expr(qual, (SELECT oid FROM pg_class WHERE relname = tablename AND relnamespace = 'public'::regnamespace))
    ELSE 'Sin restricción'
  END as using_clause
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_roles', 'role_requests', 'admins')
ORDER BY tablename, policyname;

-- ========================================
-- ✅ VERIFICACIÓN FINAL
-- ========================================

SELECT 
  'Verificación Final' as paso,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admins') THEN '✅'
    ELSE '❌'
  END as vista_admins,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_requests') THEN '✅'
    ELSE '❌'
  END as tabla_role_requests,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'sel_user_roles_all') THEN '✅'
    ELSE '❌'
  END as politica_user_roles;

-- ========================================
-- 📝 NOTAS
-- ========================================
-- 1. Vista 'admins' elimina el error 404 de benyelkdijorahyeiawp.supabase.co/rest/v1/admins
-- 2. Política 'sel_user_roles_all' permite que el frontend verifique roles
-- 3. Si role_requests no existe, ejecuta: create_role_requests_table.sql

