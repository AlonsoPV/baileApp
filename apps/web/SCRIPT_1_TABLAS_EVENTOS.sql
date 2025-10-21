-- ============================================
-- SCRIPT 1: TABLAS DE EVENTOS Y RLS
-- BaileApp - Sistema completo de eventos
-- ============================================

-- NOTA: Este script se ejecuta en el SQL Editor de Supabase
-- Asegúrate de tener permisos de administrador

-- ============================================
-- 1. TABLA: profiles_organizer
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles_organizer (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_publico TEXT NOT NULL,
  bio TEXT,
  media JSONB DEFAULT '[]'::jsonb,
  estado_aprobacion TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado_aprobacion IN ('borrador','en_revision','aprobado','rechazado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_organizer_user_id ON public.profiles_organizer(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organizer_estado ON public.profiles_organizer(estado_aprobacion);

-- RLS
ALTER TABLE public.profiles_organizer ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own organizer profile" ON public.profiles_organizer;
CREATE POLICY "Users can view own organizer profile"
ON public.profiles_organizer FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR estado_aprobacion = 'aprobado');

DROP POLICY IF EXISTS "Users can insert own organizer profile" ON public.profiles_organizer;
CREATE POLICY "Users can insert own organizer profile"
ON public.profiles_organizer FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own organizer profile" ON public.profiles_organizer;
CREATE POLICY "Users can update own organizer profile"
ON public.profiles_organizer FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. TABLA: events_parent
-- ============================================

CREATE TABLE IF NOT EXISTS public.events_parent (
  id SERIAL PRIMARY KEY,
  organizer_id INT NOT NULL REFERENCES public.profiles_organizer(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  estilos INT[] DEFAULT '{}'::int[],
  sede_general TEXT,
  media JSONB DEFAULT '[]'::jsonb,
  estado_aprobacion TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado_aprobacion IN ('borrador','en_revision','aprobado','rechazado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_events_parent_organizer ON public.events_parent(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_parent_estado ON public.events_parent(estado_aprobacion);

-- RLS
ALTER TABLE public.events_parent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own events or approved" ON public.events_parent;
CREATE POLICY "Users can view own events or approved"
ON public.events_parent FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles_organizer po
    WHERE po.id = events_parent.organizer_id
      AND (po.user_id = auth.uid() OR events_parent.estado_aprobacion = 'aprobado')
  )
);

DROP POLICY IF EXISTS "Users can insert own events" ON public.events_parent;
CREATE POLICY "Users can insert own events"
ON public.events_parent FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles_organizer po
    WHERE po.id = organizer_id AND po.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own events" ON public.events_parent;
CREATE POLICY "Users can update own events"
ON public.events_parent FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles_organizer po
    WHERE po.id = organizer_id AND po.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles_organizer po
    WHERE po.id = organizer_id AND po.user_id = auth.uid()
  )
);

-- ============================================
-- 3. TABLA: events_date
-- ============================================

CREATE TABLE IF NOT EXISTS public.events_date (
  id SERIAL PRIMARY KEY,
  parent_id INT NOT NULL REFERENCES public.events_parent(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,
  lugar TEXT,
  direccion TEXT,
  ciudad TEXT,
  zona INT,
  estilos INT[] DEFAULT '{}'::int[],
  media JSONB DEFAULT '[]'::jsonb,
  requisitos TEXT,
  estado_publicacion TEXT NOT NULL DEFAULT 'borrador'
    CHECK (estado_publicacion IN ('borrador','publicado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_events_date_parent ON public.events_date(parent_id);
CREATE INDEX IF NOT EXISTS idx_events_date_fecha ON public.events_date(fecha);
CREATE INDEX IF NOT EXISTS idx_events_date_estado ON public.events_date(estado_publicacion);

-- RLS
ALTER TABLE public.events_date ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own dates or published" ON public.events_date;
CREATE POLICY "Users can view own dates or published"
ON public.events_date FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events_parent ep
    JOIN public.profiles_organizer po ON po.id = ep.organizer_id
    WHERE ep.id = events_date.parent_id
      AND (po.user_id = auth.uid() OR events_date.estado_publicacion = 'publicado')
  )
);

DROP POLICY IF EXISTS "Users can insert own dates" ON public.events_date;
CREATE POLICY "Users can insert own dates"
ON public.events_date FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events_parent ep
    JOIN public.profiles_organizer po ON po.id = ep.organizer_id
    WHERE ep.id = parent_id AND po.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update own dates" ON public.events_date;
CREATE POLICY "Users can update own dates"
ON public.events_date FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events_parent ep
    JOIN public.profiles_organizer po ON po.id = ep.organizer_id
    WHERE ep.id = parent_id AND po.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events_parent ep
    JOIN public.profiles_organizer po ON po.id = ep.organizer_id
    WHERE ep.id = parent_id AND po.user_id = auth.uid()
  )
);

-- ============================================
-- 4. TABLA: rsvp
-- ============================================

CREATE TABLE IF NOT EXISTS public.rsvp (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date_id INT NOT NULL REFERENCES public.events_date(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('voy','interesado','no_voy')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, event_date_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_rsvp_user ON public.rsvp(user_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_event_date ON public.rsvp(event_date_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_status ON public.rsvp(status);

-- RLS
ALTER TABLE public.rsvp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all RSVPs" ON public.rsvp;
CREATE POLICY "Users can view all RSVPs"
ON public.rsvp FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can insert own RSVP" ON public.rsvp;
CREATE POLICY "Users can insert own RSVP"
ON public.rsvp FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own RSVP" ON public.rsvp;
CREATE POLICY "Users can update own RSVP"
ON public.rsvp FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own RSVP" ON public.rsvp;
CREATE POLICY "Users can delete own RSVP"
ON public.rsvp FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- FIN DEL SCRIPT 1
-- ============================================

-- Verificación: Ver tablas creadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles_organizer', 'events_parent', 'events_date', 'rsvp')
ORDER BY table_name;

-- Resultado esperado:
-- ✅ 4 tablas creadas: profiles_organizer, events_parent, events_date, rsvp
-- ✅ Índices configurados
-- ✅ RLS habilitado
-- ✅ Políticas de seguridad activas
