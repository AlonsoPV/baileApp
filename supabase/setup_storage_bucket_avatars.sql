-- ========================================
-- 📦 BUCKET AVATARS (OPCIONAL)
-- ========================================
-- En este proyecto los avatares van al bucket MEDIA, carpeta AVATARS:
--   Bucket: media
--   Path:   avatars/{user_id}.{ext}
--   URL en dashboard: Storage → media → avatars/
--
-- Este script crea un bucket separado "avatars"; úsalo solo si quieres
-- migrar a un bucket dedicado. La app actual usa media/avatars/.

-- ========================================
-- 1. CREAR BUCKET AVATARS (si no existe)
-- ========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- ========================================
-- 2. ELIMINAR POLÍTICAS ANTIGUAS
-- ========================================

DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- ========================================
-- 3. POLÍTICAS (path en bucket = {user_id}.{ext}, sin carpeta)
-- ========================================

CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND split_part(name, '.', 1) = auth.uid()::text
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND split_part(name, '.', 1) = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND split_part(name, '.', 1) = auth.uid()::text
);

-- ========================================
-- 4. VERIFICACIÓN
-- ========================================

SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name = 'avatars';

SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;
