-- ============================================
-- Sprint 2 - Database Schema
-- BaileApp - Sistema de Eventos y Organizadores
-- ============================================

-- 1. TABLA: profiles_organizer
-- Perfil de organizador vinculado a un usuario
-- ============================================
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

-- ============================================
-- 2. TABLA: events_parent
-- Evento padre (puede tener múltiples fechas)
-- ============================================
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

-- ============================================
-- 3. TABLA: events_date
-- Fecha específica de un evento
-- ============================================
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

-- ============================================
-- 4. TABLA: rsvp
-- Respuestas de usuarios a eventos
-- ============================================
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

-- ============================================
-- 5. FUNCIONES HELPER
-- ============================================

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

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Habilitar RLS
ALTER TABLE profiles_organizer ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_parent ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_date ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS: profiles_organizer
-- ============================================

-- Lectura pública de organizadores aprobados
DROP POLICY IF EXISTS "Public can view approved organizers" ON profiles_organizer;
CREATE POLICY "Public can view approved organizers"
  ON profiles_organizer FOR SELECT
  USING (estado_aprobacion = 'aprobado');

-- Los usuarios pueden ver su propio organizador
DROP POLICY IF EXISTS "Users can view own organizer" ON profiles_organizer;
CREATE POLICY "Users can view own organizer"
  ON profiles_organizer FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden crear su organizador
DROP POLICY IF EXISTS "Users can create own organizer" ON profiles_organizer;
CREATE POLICY "Users can create own organizer"
  ON profiles_organizer FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar su propio organizador
DROP POLICY IF EXISTS "Users can update own organizer" ON profiles_organizer;
CREATE POLICY "Users can update own organizer"
  ON profiles_organizer FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar su propio organizador
DROP POLICY IF EXISTS "Users can delete own organizer" ON profiles_organizer;
CREATE POLICY "Users can delete own organizer"
  ON profiles_organizer FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS: events_parent
-- ============================================

-- Lectura pública de eventos aprobados
DROP POLICY IF EXISTS "Public can view approved events" ON events_parent;
CREATE POLICY "Public can view approved events"
  ON events_parent FOR SELECT
  USING (estado_aprobacion = 'aprobado');

-- Los organizadores pueden ver sus propios eventos
DROP POLICY IF EXISTS "Organizers can view own events" ON events_parent;
CREATE POLICY "Organizers can view own events"
  ON events_parent FOR SELECT
  USING (
    organizer_id IN (
      SELECT id FROM profiles_organizer WHERE user_id = auth.uid()
    )
  );

-- Los organizadores pueden crear eventos
DROP POLICY IF EXISTS "Organizers can create events" ON events_parent;
CREATE POLICY "Organizers can create events"
  ON events_parent FOR INSERT
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM profiles_organizer WHERE user_id = auth.uid()
    )
  );

-- Los organizadores pueden actualizar sus eventos
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

-- Los organizadores pueden eliminar sus eventos
DROP POLICY IF EXISTS "Organizers can delete own events" ON events_parent;
CREATE POLICY "Organizers can delete own events"
  ON events_parent FOR DELETE
  USING (
    organizer_id IN (
      SELECT id FROM profiles_organizer WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS: events_date
-- ============================================

-- Lectura pública de fechas publicadas
DROP POLICY IF EXISTS "Public can view published dates" ON events_date;
CREATE POLICY "Public can view published dates"
  ON events_date FOR SELECT
  USING (estado_publicacion = 'publicado');

-- Los organizadores pueden ver todas las fechas de sus eventos
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

-- Los organizadores pueden crear fechas
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

-- Los organizadores pueden actualizar fechas de sus eventos
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

-- Los organizadores pueden eliminar fechas de sus eventos
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

-- ============================================
-- POLÍTICAS: rsvp
-- ============================================

-- Los usuarios pueden ver sus propios RSVPs
DROP POLICY IF EXISTS "Users can view own rsvps" ON rsvp;
CREATE POLICY "Users can view own rsvps"
  ON rsvp FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden crear RSVPs
DROP POLICY IF EXISTS "Users can create rsvps" ON rsvp;
CREATE POLICY "Users can create rsvps"
  ON rsvp FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus RSVPs
DROP POLICY IF EXISTS "Users can update own rsvps" ON rsvp;
CREATE POLICY "Users can update own rsvps"
  ON rsvp FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus RSVPs
DROP POLICY IF EXISTS "Users can delete own rsvps" ON rsvp;
CREATE POLICY "Users can delete own rsvps"
  ON rsvp FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 7. DATOS DE PRUEBA (OPCIONAL)
-- ============================================

-- Descomentar si quieres datos de ejemplo
/*
-- Insertar organizador de ejemplo
INSERT INTO profiles_organizer (user_id, nombre_publico, bio, estado_aprobacion)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Organizador de Ejemplo',
  'Organizamos los mejores eventos de salsa en la ciudad',
  'aprobado'
);

-- Insertar evento padre de ejemplo
INSERT INTO events_parent (organizer_id, nombre, descripcion, estilos, sede_general, estado_aprobacion)
VALUES (
  1,
  'Festival de Salsa 2025',
  'El festival de salsa más grande del año',
  ARRAY[1, 2],
  'Centro de Convenciones',
  'aprobado'
);

-- Insertar fecha de ejemplo
INSERT INTO events_date (parent_id, fecha, hora_inicio, hora_fin, lugar, ciudad, zona, estilos, estado_publicacion)
VALUES (
  1,
  '2025-03-15',
  '20:00',
  '02:00',
  'Salón Principal',
  'Ciudad de México',
  1,
  ARRAY[1, 2],
  'publicado'
);
*/

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles_organizer', 'events_parent', 'events_date', 'rsvp');

-- Verificar políticas RLS
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles_organizer', 'events_parent', 'events_date', 'rsvp')
ORDER BY tablename, policyname;
