-- ============================================
-- Storage Configuration - User Media Bucket
-- BaileApp - Sistema de Galería de Usuarios
-- ============================================

-- NOTA: Este script se ejecuta en el SQL Editor de Supabase
-- Asegúrate de tener permisos de administrador

-- ============================================
-- 1. CREAR BUCKET "user-media"
-- ============================================

-- Insertar bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-media', 'user-media', true)
ON CONFLICT (id) DO NOTHING;

-- Verificar que el bucket se creó
SELECT * FROM storage.buckets WHERE id = 'user-media';

-- ============================================
-- 2. POLÍTICAS RLS PARA "user-media"
-- ============================================

-- Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Users can upload own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;

-- Política 1: Usuarios pueden subir su propia media
CREATE POLICY "Users can upload own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política 2: Usuarios pueden actualizar su propia media
CREATE POLICY "Users can update own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política 3: Usuarios pueden eliminar su propia media
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política 4: Acceso público de lectura
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-media');

-- ============================================
-- 3. ACTUALIZAR TABLA profiles_user
-- ============================================

-- Agregar columna media si no existe (JSONB)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles_user' 
    AND column_name = 'media'
  ) THEN
    ALTER TABLE profiles_user 
    ADD COLUMN media JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Índice para búsquedas en media
CREATE INDEX IF NOT EXISTS idx_profiles_user_media 
ON profiles_user USING GIN (media);

-- ============================================
-- 4. VERIFICACIÓN
-- ============================================

-- Verificar bucket
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE id = 'user-media';

-- Verificar políticas
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%media%'
ORDER BY policyname;

-- Verificar columna media en profiles_user
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles_user'
  AND column_name = 'media';

-- ============================================
-- 5. EJEMPLO DE USO
-- ============================================

-- Ver media de un usuario
SELECT 
  user_id,
  display_name,
  media
FROM profiles_user
WHERE user_id = auth.uid();

-- Actualizar media (ejemplo)
/*
UPDATE profiles_user
SET media = '[
  {
    "id": "user123/123456789-uuid.jpg",
    "url": "https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/user-media/user123/123456789-uuid.jpg",
    "type": "image",
    "created_at": "2025-10-21T12:00:00Z"
  }
]'::jsonb
WHERE user_id = auth.uid();
*/

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Resultado esperado:
-- ✅ Bucket "user-media" creado y público
-- ✅ 4 políticas RLS configuradas
-- ✅ Columna "media" agregada a profiles_user
-- ✅ Índice GIN para búsquedas eficientes

-- Próximos pasos:
-- 1. Probar upload desde la app
-- 2. Verificar que las URLs públicas funcionen
-- 3. Probar eliminación de archivos
