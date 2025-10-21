-- Script de verificación para el bucket org-media
-- Ejecutar en Supabase SQL Editor para diagnosticar problemas

-- 1. Verificar si el bucket existe
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'org-media';

-- 2. Verificar políticas del bucket
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%org%';

-- 3. Verificar si hay archivos en el bucket
SELECT 
  name,
  bucket_id,
  created_at,
  updated_at,
  size
FROM storage.objects 
WHERE bucket_id = 'org-media'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar tabla profiles_organizer
SELECT 
  id,
  user_id,
  nombre_publico,
  media,
  created_at
FROM public.profiles_organizer
ORDER BY created_at DESC
LIMIT 5;

-- 5. Verificar RLS en profiles_organizer
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles_organizer';
