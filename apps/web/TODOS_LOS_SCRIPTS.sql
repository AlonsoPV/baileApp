-- ============================================
-- TODOS LOS SCRIPTS SQL - BaileApp
-- ============================================
-- Ejecutar en Supabase Dashboard → SQL Editor
-- En el orden indicado

-- ============================================
-- SCRIPT 1: DATABASE_SPRINT2.sql
-- Tablas de eventos, organizadores y RSVPs
-- ============================================

-- 1. TABLA: profiles_organizer
CREATE TABLE IF NOT EXISTS profiles_organizer (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nombre_publico TEXT NOT NULL,
  bio TEXT,
  media JSONB DEFAULT '[]'::jsonb,
  estado_aprobacion TEXT DEFAULT 'borrador' CHECK (estado_aprobacion IN ('borrador', 'en_revision', 'aprobado', 'rechazado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para profiles_organizer
CREATE INDEX IF NOT EXISTS idx_organizer_user_id ON profiles_organizer(user_id);
CREATE INDEX IF NOT EXISTS idx_organizer_estado ON profiles_organizer(estado_aprobacion);

-- 2. TABLA: events_parent
CREATE TABLE IF NOT EXISTS events_parent (
  id SERIAL PRIMARY KEY,
  organizer_id INT REFERENCES profiles_organizer(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  estilos INT[] DEFAULT '{}'::INT[],
  sede_general TEXT,
  media JSONB DEFAULT '[]'::jsonb,
  estado_aprobacion TEXT DEFAULT 'borrador' CHECK (estado_aprobacion IN ('borrador', 'en_revision', 'aprobado', 'rechazado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para events_parent
CREATE INDEX IF NOT EXISTS idx_parent_organizer ON events_parent(organizer_id);
CREATE INDEX IF NOT EXISTS idx_parent_estado ON events_parent(estado_aprobacion);
CREATE INDEX IF NOT EXISTS idx_parent_created ON events_parent(created_at DESC);

-- 3. TABLA: events_date
CREATE TABLE IF NOT EXISTS events_date (
  id SERIAL PRIMARY KEY,
  parent_id INT REFERENCES events_parent(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,
  lugar TEXT,
  direccion TEXT,
  ciudad TEXT,
  zona INT REFERENCES tags(id),
  estilos INT[] DEFAULT '{}'::INT[],
  media JSONB DEFAULT '[]'::jsonb,
  estado_publicacion TEXT DEFAULT 'borrador' CHECK (estado_publicacion IN ('borrador', 'publicado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para events_date
CREATE INDEX IF NOT EXISTS idx_date_parent ON events_date(parent_id);
CREATE INDEX IF NOT EXISTS idx_date_fecha ON events_date(fecha);
CREATE INDEX IF NOT EXISTS idx_date_estado ON events_date(estado_publicacion);
CREATE INDEX IF NOT EXISTS idx_date_ciudad ON events_date(ciudad);
CREATE INDEX IF NOT EXISTS idx_date_zona ON events_date(zona);

-- 4. TABLA: rsvp
CREATE TABLE IF NOT EXISTS rsvp (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_date_id INT REFERENCES events_date(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('voy', 'interesado', 'no_voy')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_date_id)
);

-- Índices para rsvp
CREATE INDEX IF NOT EXISTS idx_rsvp_user ON rsvp(user_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_event_date ON rsvp(event_date_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_status ON rsvp(status);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_organizer_updated_at ON profiles_organizer;
CREATE TRIGGER update_organizer_updated_at
  BEFORE UPDATE ON profiles_organizer
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parent_updated_at ON events_parent;
CREATE TRIGGER update_parent_updated_at
  BEFORE UPDATE ON events_parent
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_date_updated_at ON events_date;
CREATE TRIGGER update_date_updated_at
  BEFORE UPDATE ON events_date
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rsvp_updated_at ON rsvp;
CREATE TRIGGER update_rsvp_updated_at
  BEFORE UPDATE ON rsvp
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE profiles_organizer ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_parent ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_date ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: profiles_organizer
DROP POLICY IF EXISTS "Public can view approved organizers" ON profiles_organizer;
CREATE POLICY "Public can view approved organizers"
  ON profiles_organizer FOR SELECT
  USING (estado_aprobacion = 'aprobado');

DROP POLICY IF EXISTS "Users can view own organizer" ON profiles_organizer;
CREATE POLICY "Users can view own organizer"
  ON profiles_organizer FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own organizer" ON profiles_organizer;
CREATE POLICY "Users can create own organizer"
  ON profiles_organizer FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own organizer" ON profiles_organizer;
CREATE POLICY "Users can update own organizer"
  ON profiles_organizer FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own organizer" ON profiles_organizer;
CREATE POLICY "Users can delete own organizer"
  ON profiles_organizer FOR DELETE
  USING (auth.uid() = user_id);

-- POLÍTICAS: events_parent
DROP POLICY IF EXISTS "Public can view approved events" ON events_parent;
CREATE POLICY "Public can view approved events"
  ON events_parent FOR SELECT
  USING (estado_aprobacion = 'aprobado');

DROP POLICY IF EXISTS "Organizers can view own events" ON events_parent;
CREATE POLICY "Organizers can view own events"
  ON events_parent FOR SELECT
  USING (
    organizer_id IN (
      SELECT id FROM profiles_organizer WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organizers can create events" ON events_parent;
CREATE POLICY "Organizers can create events"
  ON events_parent FOR INSERT
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM profiles_organizer WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organizers can update own events" ON events_parent;
CREATE POLICY "Organizers can update own events"
  ON events_parent FOR UPDATE
  USING (
    organizer_id IN (
      SELECT id FROM profiles_organizer WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM profiles_organizer WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organizers can delete own events" ON events_parent;
CREATE POLICY "Organizers can delete own events"
  ON events_parent FOR DELETE
  USING (
    organizer_id IN (
      SELECT id FROM profiles_organizer WHERE user_id = auth.uid()
    )
  );

-- POLÍTICAS: events_date
DROP POLICY IF EXISTS "Public can view published dates" ON events_date;
CREATE POLICY "Public can view published dates"
  ON events_date FOR SELECT
  USING (estado_publicacion = 'publicado');

DROP POLICY IF EXISTS "Organizers can view own event dates" ON events_date;
CREATE POLICY "Organizers can view own event dates"
  ON events_date FOR SELECT
  USING (
    parent_id IN (
      SELECT ep.id FROM events_parent ep
      INNER JOIN profiles_organizer po ON ep.organizer_id = po.id
      WHERE po.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organizers can create dates" ON events_date;
CREATE POLICY "Organizers can create dates"
  ON events_date FOR INSERT
  WITH CHECK (
    parent_id IN (
      SELECT ep.id FROM events_parent ep
      INNER JOIN profiles_organizer po ON ep.organizer_id = po.id
      WHERE po.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organizers can update own dates" ON events_date;
CREATE POLICY "Organizers can update own dates"
  ON events_date FOR UPDATE
  USING (
    parent_id IN (
      SELECT ep.id FROM events_parent ep
      INNER JOIN profiles_organizer po ON ep.organizer_id = po.id
      WHERE po.user_id = auth.uid()
    )
  )
  WITH CHECK (
    parent_id IN (
      SELECT ep.id FROM events_parent ep
      INNER JOIN profiles_organizer po ON ep.organizer_id = po.id
      WHERE po.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Organizers can delete own dates" ON events_date;
CREATE POLICY "Organizers can delete own dates"
  ON events_date FOR DELETE
  USING (
    parent_id IN (
      SELECT ep.id FROM events_parent ep
      INNER JOIN profiles_organizer po ON ep.organizer_id = po.id
      WHERE po.user_id = auth.uid()
    )
  );

-- POLÍTICAS: rsvp
DROP POLICY IF EXISTS "Users can view own rsvps" ON rsvp;
CREATE POLICY "Users can view own rsvps"
  ON rsvp FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create rsvps" ON rsvp;
CREATE POLICY "Users can create rsvps"
  ON rsvp FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own rsvps" ON rsvp;
CREATE POLICY "Users can update own rsvps"
  ON rsvp FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own rsvps" ON rsvp;
CREATE POLICY "Users can delete own rsvps"
  ON rsvp FOR DELETE
  USING (auth.uid() = user_id);

-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles_organizer', 'events_parent', 'events_date', 'rsvp');

-- ============================================
-- SCRIPT 2: DATABASE_STORAGE.sql
-- Bucket user-media para galería de usuarios
-- ============================================

-- Crear bucket user-media
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-media', 'user-media', true)
ON CONFLICT (id) DO NOTHING;

-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'user-media';

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can upload own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;

-- Políticas para user-media
CREATE POLICY "Users can upload own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

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

CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-media');

-- Agregar columna media a profiles_user
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

-- Verificar políticas
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%user%media%'
ORDER BY policyname;

-- ============================================
-- SCRIPT 3: DATABASE_ORG_STORAGE.sql
-- Bucket org-media para galería de organizadores
-- ============================================

-- Crear bucket org-media
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-media', 'org-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'org-media';

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Organizers can upload own media" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can update own media" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can delete own media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view org media" ON storage.objects;

-- Políticas para org-media
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

CREATE POLICY "Public can view org media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'org-media');

-- Verificar columna media en profiles_organizer
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

-- Verificar políticas
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%org%media%'
ORDER BY policyname;

-- ============================================
-- SCRIPT 4: DATABASE_PUBLIC_PROFILES.sql
-- Política para perfiles públicos
-- ============================================

-- Eliminar política existente
DROP POLICY IF EXISTS "Public can read user profiles" ON profiles_user;
DROP POLICY IF EXISTS "read user profiles public" ON profiles_user;

-- Crear política para lectura pública de perfiles
CREATE POLICY "Public can read user profiles"
ON profiles_user FOR SELECT
TO public
USING (true);

-- Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles_user' 
  AND schemaname = 'public';

-- Habilitar RLS si no está habilitado
ALTER TABLE profiles_user ENABLE ROW LEVEL SECURITY;

-- Verificar políticas
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles_user'
ORDER BY policyname;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Ver todos los buckets
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id IN ('AVATARS', 'user-media', 'org-media')
ORDER BY id;

-- Ver todas las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles_user', 'profiles_organizer', 'events_parent', 'events_date', 'rsvp', 'tags')
ORDER BY table_name;

-- Ver políticas de storage
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%media%'
ORDER BY policyname;

-- ============================================
-- FIN DE TODOS LOS SCRIPTS
-- ============================================

-- RESULTADO ESPERADO:
-- ✅ 4 tablas: profiles_user, profiles_organizer, events_parent, events_date, rsvp
-- ✅ 3 buckets: AVATARS, user-media, org-media
-- ✅ Políticas RLS configuradas
-- ✅ Perfiles públicos habilitados
-- ✅ Sistema completo funcionando
