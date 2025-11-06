-- ========================================
-- 🔍 DIAGNÓSTICO COMPLETO - Errores 400
-- ========================================
-- Este script diagnostica TODAS las tablas que están
-- causando errores 400 en el frontend

-- ========================================
-- 1️⃣ VERIFICAR tabla user_roles
-- ========================================

SELECT 
  '1️⃣ user_roles' as diagnostico,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles')
    THEN '✅ Existe'
    ELSE '❌ NO EXISTE'
  END as estado;

-- Columnas de user_roles
SELECT 
  'Columnas de user_roles:' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- ========================================
-- 2️⃣ VERIFICAR tabla events_parent
-- ========================================

SELECT 
  '2️⃣ events_parent' as diagnostico,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events_parent')
    THEN '✅ Existe'
    ELSE '❌ NO EXISTE'
  END as estado;

-- Columnas de events_parent
SELECT 
  'Columnas de events_parent:' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'events_parent'
ORDER BY ordinal_position;

-- Verificar columnas específicas que el frontend busca
SELECT 
  'Columnas faltantes en events_parent:' as check_tipo,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events_parent' AND column_name = 'biografia') THEN '✅' ELSE '❌' END as biografia,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events_parent' AND column_name = 'faq') THEN '✅' ELSE '❌' END as faq,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events_parent' AND column_name = 'sede_general') THEN '✅' ELSE '❌' END as sede_general;

-- ========================================
-- 3️⃣ VERIFICAR tabla events_date
-- ========================================

SELECT 
  '3️⃣ events_date' as diagnostico,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events_date')
    THEN '✅ Existe'
    ELSE '❌ NO EXISTE'
  END as estado;

-- Columnas de events_date
SELECT 
  'Columnas de events_date:' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'events_date'
ORDER BY ordinal_position;

-- Verificar columnas específicas
SELECT 
  'Columnas faltantes en events_date:' as check_tipo,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events_date' AND column_name = 'zona') THEN '✅' ELSE '❌' END as zona,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events_date' AND column_name = 'zonas') THEN '✅' ELSE '❌' END as zonas,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events_date' AND column_name = 'referencias') THEN '✅' ELSE '❌' END as referencias,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events_date' AND column_name = 'requisitos') THEN '✅' ELSE '❌' END as requisitos;

-- ========================================
-- 4️⃣ VERIFICAR bucket media
-- ========================================

SELECT 
  '4️⃣ Storage Buckets' as diagnostico,
  id,
  name,
  public
FROM storage.buckets
WHERE name IN ('media', 'org-media', 'avatars', 'videos');

-- ========================================
-- 5️⃣ VERIFICAR RLS en todas las tablas
-- ========================================

SELECT 
  '5️⃣ RLS Status' as diagnostico,
  tablename,
  CASE WHEN rowsecurity THEN '✅ Habilitado' ELSE '❌ Deshabilitado' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_roles', 'events_parent', 'events_date', 'profiles_organizer')
ORDER BY tablename;

-- ========================================
-- 6️⃣ VERIFICAR políticas RLS
-- ========================================

SELECT 
  '6️⃣ Políticas RLS' as diagnostico,
  tablename,
  policyname,
  cmd as operacion
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_roles', 'events_parent', 'events_date')
ORDER BY tablename, policyname;

-- ========================================
-- 7️⃣ RESUMEN DE PROBLEMAS
-- ========================================

DO $$
DECLARE
  user_roles_exists boolean;
  events_parent_exists boolean;
  events_date_exists boolean;
  media_bucket_exists boolean;
BEGIN
  -- Verificar existencias
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') INTO user_roles_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events_parent') INTO events_parent_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events_date') INTO events_date_exists;
  SELECT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'media') INTO media_bucket_exists;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 RESUMEN DE DIAGNÓSTICO';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  IF user_roles_exists THEN
    RAISE NOTICE '✅ user_roles existe';
  ELSE
    RAISE NOTICE '❌ user_roles NO EXISTE - Ejecutar: fix_user_roles_complete.sql';
  END IF;
  
  IF events_parent_exists THEN
    RAISE NOTICE '✅ events_parent existe';
  ELSE
    RAISE NOTICE '❌ events_parent NO EXISTE';
  END IF;
  
  IF events_date_exists THEN
    RAISE NOTICE '✅ events_date existe';
  ELSE
    RAISE NOTICE '❌ events_date NO EXISTE';
  END IF;
  
  IF media_bucket_exists THEN
    RAISE NOTICE '✅ Bucket media existe';
  ELSE
    RAISE NOTICE '❌ Bucket media NO EXISTE';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

