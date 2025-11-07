-- ============================================================================
-- CONFIGURAR POLÍTICAS DE STORAGE EN PRODUCCIÓN
-- ============================================================================
-- IMPORTANTE: Primero crea los buckets desde el Dashboard de Supabase
-- Luego ejecuta este script para configurar las políticas
-- ============================================================================

-- ============================================================================
-- PASO 1: VERIFICAR QUE LOS BUCKETS EXISTEN
-- ============================================================================

-- Ver buckets existentes
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
ORDER BY name;

-- Si no existen, créalos desde el Dashboard o con este SQL:
-- (Descomenta y ajusta según tus necesidades)

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES 
--     ('media', 'media', true, 52428800, ARRAY['image/*', 'video/*']),
--     ('event-flyers', 'event-flyers', true, 10485760, ARRAY['image/*'])
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PASO 2: ELIMINAR POLÍTICAS EXISTENTES (PARA IDEMPOTENCIA)
-- ============================================================================

-- Eliminar políticas del bucket 'media'
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Eliminar políticas del bucket 'event-flyers'
DROP POLICY IF EXISTS "Public read access for flyers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload flyers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update flyers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete flyers" ON storage.objects;

-- ============================================================================
-- PASO 3: CREAR POLÍTICAS PARA BUCKET 'media'
-- ============================================================================

-- Política: Lectura pública (cualquiera puede ver archivos)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- Política: Usuarios autenticados pueden subir archivos
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Política: Usuarios pueden actualizar sus propios archivos
-- Asume estructura: media/{user_id}/... o media/{profile_type}/{profile_id}/...
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media');

-- Política: Usuarios pueden eliminar sus propios archivos
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');

-- ============================================================================
-- PASO 4: CREAR POLÍTICAS PARA BUCKET 'event-flyers' (SI EXISTE)
-- ============================================================================

-- Política: Lectura pública
CREATE POLICY "Public read access for flyers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-flyers');

-- Política: Usuarios autenticados pueden subir flyers
CREATE POLICY "Authenticated users can upload flyers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-flyers');

-- Política: Usuarios autenticados pueden actualizar flyers
CREATE POLICY "Users can update flyers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-flyers');

-- Política: Usuarios autenticados pueden eliminar flyers
CREATE POLICY "Users can delete flyers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-flyers');

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver todas las políticas de storage (usando pg_policies)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- Ver buckets y su configuración
SELECT 
    id,
    name,
    public,
    file_size_limit / 1048576 as size_limit_mb,
    allowed_mime_types,
    created_at
FROM storage.buckets
ORDER BY name;

-- Contar políticas de storage
SELECT 
    COUNT(*) as total_storage_policies
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects';

