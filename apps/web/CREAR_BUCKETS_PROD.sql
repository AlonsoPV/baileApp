-- ============================================================================
-- CREAR BUCKETS EN PRODUCCIÓN
-- ============================================================================
-- Ejecuta este script ANTES de configurar las políticas
-- ============================================================================

-- 1. Ver buckets existentes
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
ORDER BY name;

-- 2. Crear bucket 'media' (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    true,
    52428800, -- 50MB en bytes
    ARRAY['image/*', 'video/*']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Crear bucket 'event-flyers' (si no existe) - OPCIONAL
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'event-flyers',
    'event-flyers',
    true,
    10485760, -- 10MB en bytes
    ARRAY['image/*']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Verificar que se crearon
SELECT id, name, public, file_size_limit / 1048576 as size_mb, allowed_mime_types
FROM storage.buckets
ORDER BY name;

