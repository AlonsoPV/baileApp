-- Script de prueba para verificar upload en org-media
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que el bucket existe y es público
SELECT 'Bucket status:' as info, id, name, public FROM storage.buckets WHERE id = 'org-media';

-- 2. Verificar políticas activas
SELECT 'Active policies:' as info, policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%org%'
ORDER BY policyname;

-- 3. Verificar si hay organizadores (necesario para las políticas)
SELECT 'Organizers count:' as info, COUNT(*) as count FROM public.profiles_organizer;

-- 4. Mostrar un organizador de ejemplo (si existe)
SELECT 'Sample organizer:' as info, id, user_id, nombre_publico 
FROM public.profiles_organizer 
LIMIT 1;

-- 5. Verificar RLS en profiles_organizer
SELECT 'RLS policies for profiles_organizer:' as info, policyname, cmd, permissive
FROM pg_policies 
WHERE tablename = 'profiles_organizer'
ORDER BY policyname;

-- 6. Verificar si storage.objects tiene RLS habilitado
SELECT 'RLS enabled on storage.objects:' as info, 
  CASE WHEN relrowsecurity THEN 'YES' ELSE 'NO' END as rls_enabled
FROM pg_class 
WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');

-- 7. Verificar permisos del usuario actual
SELECT 'Current user:' as info, auth.uid() as user_id, auth.role() as role;
