-- ============================================
-- SCRIPT 2: BUCKET USER-MEDIA
-- BaileApp - Storage para fotos/videos de usuarios
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

-- Verificar bucket creado
SELECT id, name, public FROM storage.buckets WHERE id = 'user-media';

-- ============================================
-- 2. POLÍTICAS RLS PARA "user-media"
-- ============================================

-- Eliminar políticas existentes que puedan entrar en conflicto
DROP POLICY IF EXISTS "Public can view user media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;

-- Política 1: Todos pueden VER archivos del bucket user-media (público)
CREATE POLICY "Public can view user media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-media');

-- Política 2: Usuarios autenticados pueden SUBIR en su propia carpeta
CREATE POLICY "Users can upload own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política 3: Usuarios pueden ACTUALIZAR solo sus propios archivos
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

-- Política 4: Usuarios pueden ELIMINAR solo sus propios archivos
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-media' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- 3. AGREGAR COLUMNA "media" A "profiles_user"
-- ============================================

-- Agregar columna media si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles_user' 
      AND column_name = 'media'
  ) THEN
    ALTER TABLE public.profiles_user 
    ADD COLUMN media JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Verificar columna agregada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles_user' 
  AND column_name = 'media';

-- ============================================
-- 4. VERIFICACIÓN COMPLETA
-- ============================================

-- Ver bucket creado
SELECT id, name, public FROM storage.buckets WHERE id = 'user-media';

-- Ver políticas del bucket
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%user media%'
ORDER BY policyname;

-- Ver columna media en profiles_user
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_user'
  AND column_name = 'media';

-- ============================================
-- FIN DEL SCRIPT 2
-- ============================================

-- Resultado esperado:
-- ✅ Bucket "user-media" creado y público
-- ✅ 4 políticas RLS configuradas (SELECT, INSERT, UPDATE, DELETE)
-- ✅ Columna "media" agregada a "profiles_user"
-- ✅ Usuarios pueden subir/editar/eliminar solo su propia media
-- ✅ Todos pueden ver la media (público)
