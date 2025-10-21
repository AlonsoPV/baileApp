-- ============================================
-- Storage Configuration - Organizer Media Bucket
-- BaileApp - Sistema de Galería de Organizadores
-- ============================================

-- ============================================
-- 1. CREAR BUCKET "org-media"
-- ============================================

-- Insertar bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-media', 'org-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Verificar que el bucket se creó
SELECT * FROM storage.buckets WHERE id = 'org-media';

-- ============================================
-- 2. POLÍTICAS RLS PARA "org-media"
-- ============================================

-- Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Organizers can upload own media" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can update own media" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can delete own media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view org media" ON storage.objects;

-- Política 1: Organizadores pueden subir su propia media
-- Nota: El path debe ser orgId/archivo.ext
CREATE POLICY "Organizers can upload own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'org-media'
  AND EXISTS (
    SELECT 1 FROM profiles_organizer
    WHERE user_id = auth.uid()
    AND id::text = (storage.foldername(name))[1]
  )
);

-- Política 2: Organizadores pueden actualizar su propia media
CREATE POLICY "Organizers can update own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'org-media'
  AND EXISTS (
    SELECT 1 FROM profiles_organizer
    WHERE user_id = auth.uid()
    AND id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'org-media'
  AND EXISTS (
    SELECT 1 FROM profiles_organizer
    WHERE user_id = auth.uid()
    AND id::text = (storage.foldername(name))[1]
  )
);

-- Política 3: Organizadores pueden eliminar su propia media
CREATE POLICY "Organizers can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'org-media'
  AND EXISTS (
    SELECT 1 FROM profiles_organizer
    WHERE user_id = auth.uid()
    AND id::text = (storage.foldername(name))[1]
  )
);

-- Política 4: Acceso público de lectura
CREATE POLICY "Public can view org media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'org-media');

-- ============================================
-- 3. VERIFICAR COLUMNA MEDIA EN profiles_organizer
-- ============================================

-- La columna media debería existir del Sprint 2
-- Verificar
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'profiles_organizer' 
  AND column_name = 'media';

-- Si no existe, agregar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles_organizer' 
    AND column_name = 'media'
  ) THEN
    ALTER TABLE profiles_organizer 
    ADD COLUMN media JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_profiles_organizer_media 
ON profiles_organizer USING GIN (media);

-- ============================================
-- 4. VERIFICACIÓN
-- ============================================

-- Verificar bucket
SELECT id, name, public, created_at
FROM storage.buckets 
WHERE id = 'org-media';

-- Verificar políticas
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%org%media%'
ORDER BY policyname;

-- Verificar columna media
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'profiles_organizer' 
  AND column_name = 'media';

-- Ver mi organizador
SELECT id, nombre_publico, media 
FROM profiles_organizer 
WHERE user_id = auth.uid();

-- ============================================
-- 5. EJEMPLO DE USO
-- ============================================

-- Ver media de un organizador
SELECT 
  po.id,
  po.nombre_publico,
  po.media
FROM profiles_organizer po
WHERE po.user_id = auth.uid();

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Resultado esperado:
-- ✅ Bucket "org-media" creado y público
-- ✅ 4 políticas RLS configuradas
-- ✅ Columna "media" en profiles_organizer
-- ✅ Índice GIN para búsquedas eficientes
