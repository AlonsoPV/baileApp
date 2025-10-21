-- Script de diagnóstico específico para problemas de org-media
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar bucket org-media
SELECT 'Bucket org-media:' as check_type, id, name, public FROM storage.buckets WHERE id = 'org-media';

-- 2. Verificar políticas de storage.objects para org-media
SELECT 'Políticas org-media:' as check_type, policyname, cmd, permissive, roles 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%org%';

-- 3. Verificar si hay organizadores
SELECT 'Organizadores:' as check_type, COUNT(*) as count FROM public.profiles_organizer;

-- 4. Verificar un organizador específico (reemplaza con tu user_id)
-- SELECT 'Mi organizador:' as check_type, id, user_id, nombre_publico 
-- FROM public.profiles_organizer 
-- WHERE user_id = 'TU_USER_ID_AQUI';

-- 5. Verificar archivos existentes en org-media
SELECT 'Archivos org-media:' as check_type, COUNT(*) as count FROM storage.objects WHERE bucket_id = 'org-media';

-- 6. Verificar RLS en profiles_organizer
SELECT 'RLS profiles_organizer:' as check_type, COUNT(*) as count 
FROM pg_policies 
WHERE tablename = 'profiles_organizer';

-- 7. Probar inserción manual (descomenta y ajusta los valores)
-- INSERT INTO storage.objects (bucket_id, name, path_tokens, owner, metadata)
-- VALUES ('org-media', 'test/test-file.txt', ARRAY['test', 'test-file.txt'], auth.uid(), '{}');
