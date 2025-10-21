-- ============================================
-- SCRIPT 3: BUCKET ORG-MEDIA
-- BaileApp - Storage para fotos/videos de organizadores
-- ============================================

-- NOTA: Este script se ejecuta en el SQL Editor de Supabase
-- Asegúrate de tener permisos de administrador

-- ============================================
-- 1. CREAR BUCKET "org-media"
-- ============================================

-- Insertar bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-media', 'org-media', true)
ON CONFLICT (id) DO NOTHING;

-- Verificar bucket creado
SELECT id, name, public FROM storage.buckets WHERE id = 'org-media';

-- ============================================
-- 2. POLÍTICAS RLS PARA "org-media"
-- ============================================

-- Eliminar políticas existentes que puedan entrar en conflicto
DROP POLICY IF EXISTS "Public can view org media" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can upload own media" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can update own media" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can delete own media" ON storage.objects;

-- Política 1: Todos pueden VER archivos del bucket org-media (público)
CREATE POLICY "Public can view org media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'org-media');

-- Política 2: Organizadores autenticados pueden SUBIR en su propia carpeta
-- Nota: La carpeta debe coincidir con el organizer_id del usuario
CREATE POLICY "Organizers can upload own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'org-media' 
  AND EXISTS (
    SELECT 1 FROM public.profiles_organizer po
    WHERE po.user_id = auth.uid()
      AND (storage.foldername(name))[1] = po.id::text
  )
);

-- Política 3: Organizadores pueden ACTUALIZAR solo sus propios archivos
CREATE POLICY "Organizers can update own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'org-media' 
  AND EXISTS (
    SELECT 1 FROM public.profiles_organizer po
    WHERE po.user_id = auth.uid()
      AND (storage.foldername(name))[1] = po.id::text
  )
)
WITH CHECK (
  bucket_id = 'org-media' 
  AND EXISTS (
    SELECT 1 FROM public.profiles_organizer po
    WHERE po.user_id = auth.uid()
      AND (storage.foldername(name))[1] = po.id::text
  )
);

-- Política 4: Organizadores pueden ELIMINAR solo sus propios archivos
CREATE POLICY "Organizers can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'org-media' 
  AND EXISTS (
    SELECT 1 FROM public.profiles_organizer po
    WHERE po.user_id = auth.uid()
      AND (storage.foldername(name))[1] = po.id::text
  )
);

-- ============================================
-- 3. VERIFICACIÓN COMPLETA
-- ============================================

-- Ver bucket creado
SELECT id, name, public FROM storage.buckets WHERE id = 'org-media';

-- Ver políticas del bucket
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%org media%'
ORDER BY policyname;

-- Verificar que profiles_organizer tenga columna media
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_organizer'
  AND column_name = 'media';

-- ============================================
-- FIN DEL SCRIPT 3
-- ============================================

-- Resultado esperado:
-- ✅ Bucket "org-media" creado y público
-- ✅ 4 políticas RLS configuradas (SELECT, INSERT, UPDATE, DELETE)
-- ✅ Solo organizadores pueden subir/editar/eliminar en su carpeta (organizer_id)
-- ✅ Todos pueden ver la media (público)
-- ✅ Columna "media" ya existe en "profiles_organizer" (del Script 1)
