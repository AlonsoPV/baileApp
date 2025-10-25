-- Crear bucket para flyers de eventos
-- Ejecutar en Supabase SQL Editor

-- Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-flyers',
  'event-flyers', 
  true,
  6291456, -- 6MB en bytes
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Crear política RLS para permitir lectura pública
CREATE POLICY "Public read access for event flyers" ON storage.objects
FOR SELECT USING (bucket_id = 'event-flyers');

-- Crear política RLS para permitir subida a usuarios autenticados
CREATE POLICY "Authenticated users can upload event flyers" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-flyers' 
  AND auth.role() = 'authenticated'
);

-- Crear política RLS para permitir actualización a usuarios autenticados
CREATE POLICY "Authenticated users can update event flyers" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-flyers' 
  AND auth.role() = 'authenticated'
);

-- Crear política RLS para permitir eliminación a usuarios autenticados
CREATE POLICY "Authenticated users can delete event flyers" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-flyers' 
  AND auth.role() = 'authenticated'
);
