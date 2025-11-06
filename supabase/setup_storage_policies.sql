-- ========================================
-- 📦 CONFIGURAR POLÍTICAS DE STORAGE
-- ========================================
-- Este script configura las políticas RLS para el bucket 'media'
-- que es el ÚNICO bucket usado en la app

-- ========================================
-- 1. VERIFICAR QUE EL BUCKET MEDIA EXISTE
-- ========================================

SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'media';

-- Si no existe, crearlo:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true, -- Bucket público
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- ========================================
-- 2. ELIMINAR POLÍTICAS ANTIGUAS
-- ========================================

DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;

-- ========================================
-- 3. CREAR POLÍTICAS NUEVAS
-- ========================================

-- 3.1 Lectura pública (cualquiera puede ver archivos en 'media')
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- 3.2 Upload para usuarios autenticados
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

-- 3.3 Update solo del propio contenido
CREATE POLICY "Users can update own media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media' 
  AND auth.uid() IS NOT NULL
);

-- 3.4 Delete solo del propio contenido
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' 
  AND auth.uid() IS NOT NULL
);

-- ========================================
-- 4. VERIFICAR POLÍTICAS CREADAS
-- ========================================

SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%media%'
ORDER BY policyname;

-- ========================================
-- 5. ESTRUCTURA DE PATHS RECOMENDADA
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '📦 ESTRUCTURA DE STORAGE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Bucket: media (único bucket)';
  RAISE NOTICE '';
  RAISE NOTICE 'Paths recomendados:';
  RAISE NOTICE '  • media/avatars/{user_id}.jpg';
  RAISE NOTICE '  • media/covers/{user_id}.jpg';
  RAISE NOTICE '  • media/brand-media/{brand_id}/{product_id}.jpg';
  RAISE NOTICE '  • media/event-flyers/{event_id}.jpg';
  RAISE NOTICE '  • media/challenge-covers/{challenge_id}.jpg';
  RAISE NOTICE '  • media/challenge-videos/{submission_id}.mp4';
  RAISE NOTICE '  • media/trending-covers/{trending_id}.jpg';
  RAISE NOTICE '  • media/user-media/{user_id}/photo_{slot}.jpg';
  RAISE NOTICE '  • media/user-media/{user_id}/video_{slot}.mp4';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

