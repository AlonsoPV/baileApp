-- ========================================
-- 📦 CONFIGURACIÓN DE STORAGE PARA EVENTOS
-- ========================================
-- NOTA: Ya NO se usan buckets separados. Todo va en 'media'.
-- Este archivo es OPCIONAL y puede omitirse.

-- ========================================
-- OPCIÓN 1: Usar bucket 'media' único (RECOMENDADO)
-- ========================================
-- Los flyers de eventos se guardan en: media/event-flyers/{event_id}.jpg
-- Las políticas ya deberían estar configuradas en setup_storage_policies.sql

-- Verificar que el bucket media existe y es público
SELECT 
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets
WHERE name = 'media';

-- Si no existe, crearlo:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media', 
  true,
  52428800, -- 50 MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- ========================================
-- OPCIÓN 2: Bucket separado (NO RECOMENDADO - Solo si quieres aislamiento)
-- ========================================
-- Descomentar solo si necesitas un bucket separado para event-flyers:

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'event-flyers',
--   'event-flyers', 
--   true,
--   6291456, -- 6MB
--   ARRAY['image/jpeg', 'image/png', 'image/jpg']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- DROP POLICY IF EXISTS "Public read access for event flyers" ON storage.objects;
-- CREATE POLICY "Public read access for event flyers" ON storage.objects
-- FOR SELECT USING (bucket_id = 'event-flyers');

-- DROP POLICY IF EXISTS "Authenticated users can upload event flyers" ON storage.objects;
-- CREATE POLICY "Authenticated users can upload event flyers" ON storage.objects
-- FOR INSERT WITH CHECK (
--   bucket_id = 'event-flyers' 
--   AND auth.role() = 'authenticated'
-- );

-- ========================================
-- RECOMENDACIÓN
-- ========================================
-- ✅ Usa OPCIÓN 1 (bucket 'media' único)
-- ✅ Ejecuta supabase/setup_storage_policies.sql en su lugar
-- ❌ NO ejecutes OPCIÓN 2 (buckets múltiples innecesarios)
