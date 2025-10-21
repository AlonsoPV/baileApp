-- ============================================
-- SCRIPT 6: EVENT SCHEDULES & PRICES
-- BaileApp - Cronograma y costos de eventos
-- ============================================

-- NOTA: Este script se ejecuta en el SQL Editor de Supabase
-- Asegúrate de tener permisos de administrador

-- ============================================
-- 1. TABLA EVENT_SCHEDULES (Cronograma)
-- ============================================

-- Cronograma de actividades dentro de cada evento_fecha
CREATE TABLE public.event_schedules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_date_id BIGINT REFERENCES public.events_date(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('clase','show','social','otro')) NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  hora_inicio TIME NOT NULL,
  hora_fin TIME,
  ritmo BIGINT, -- opcional: FK a tag ritmo
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX idx_event_schedules_event_date_id ON public.event_schedules(event_date_id);
CREATE INDEX idx_event_schedules_hora_inicio ON public.event_schedules(hora_inicio);

-- ============================================
-- 2. TABLA EVENT_PRICES (Costos y Promociones)
-- ============================================

-- Costos, promociones y preventas
CREATE TABLE public.event_prices (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_date_id BIGINT REFERENCES public.events_date(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('preventa','taquilla','promo')) NOT NULL,
  nombre TEXT NOT NULL,
  monto NUMERIC(10,2),
  descripcion TEXT,
  hora_inicio TIME,
  hora_fin TIME,
  descuento NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor performance
CREATE INDEX idx_event_prices_event_date_id ON public.event_prices(event_date_id);
CREATE INDEX idx_event_prices_tipo ON public.event_prices(tipo);

-- ============================================
-- 3. RLS (ROW LEVEL SECURITY)
-- ============================================

-- Habilitar RLS en event_schedules
ALTER TABLE public.event_schedules ENABLE ROW LEVEL SECURITY;

-- Política de lectura (todos pueden leer)
CREATE POLICY "read schedules" ON public.event_schedules 
  FOR SELECT USING (true);

-- Política de edición (solo el organizador dueño puede editar)
CREATE POLICY "edit schedules if owner" ON public.event_schedules
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.events_date ed
    JOIN public.events_parent ep ON ep.id = ed.parent_id
    JOIN public.profiles_organizer o ON o.id = ep.organizer_id
    WHERE ed.id = event_schedules.event_date_id
      AND o.user_id = auth.uid()
  ));

-- Habilitar RLS en event_prices
ALTER TABLE public.event_prices ENABLE ROW LEVEL SECURITY;

-- Política de lectura (todos pueden leer)
CREATE POLICY "read prices" ON public.event_prices 
  FOR SELECT USING (true);

-- Política de edición (solo el organizador dueño puede editar)
CREATE POLICY "edit prices if owner" ON public.event_prices
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.events_date ed
    JOIN public.events_parent ep ON ep.id = ed.parent_id
    JOIN public.profiles_organizer o ON o.id = ep.organizer_id
    WHERE ed.id = event_prices.event_date_id
      AND o.user_id = auth.uid()
  ));

-- ============================================
-- 4. VERIFICACIÓN
-- ============================================

-- Verificar tablas creadas
SELECT 'Tables created:' as info, 
  COUNT(*) as count 
FROM information_schema.tables 
WHERE table_name IN ('event_schedules', 'event_prices')
  AND table_schema = 'public';

-- Verificar políticas RLS
SELECT 'RLS policies:' as info, 
  tablename, 
  policyname, 
  cmd, 
  permissive 
FROM pg_policies 
WHERE tablename IN ('event_schedules', 'event_prices')
ORDER BY tablename, policyname;

-- Verificar índices
SELECT 'Indexes created:' as info,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('event_schedules', 'event_prices')
ORDER BY tablename, indexname;
