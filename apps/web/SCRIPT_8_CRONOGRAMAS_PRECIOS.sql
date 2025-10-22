-- =====================================================
-- SCRIPT 8: Tablas de Cronogramas y Precios de Eventos
-- =====================================================
-- Este script crea las tablas necesarias para gestionar
-- cronogramas de actividades y precios de eventos.
--
-- IMPORTANTE: Ejecutar DESPUÉS de SCRIPT_1_TABLAS_EVENTOS.sql
-- =====================================================

-- ============================================================
-- 1. TABLA: event_schedules (Cronograma de Actividades)
-- ============================================================
-- Almacena las actividades programadas dentro de cada fecha de evento
-- (clases, shows, sociales, etc.)

CREATE TABLE IF NOT EXISTS public.event_schedules (
  id SERIAL PRIMARY KEY,
  event_date_id INTEGER NOT NULL REFERENCES public.events_date(id) ON DELETE CASCADE,
  
  -- Tipo de actividad
  tipo TEXT NOT NULL CHECK (tipo IN ('clase', 'show', 'social', 'otro')),
  
  -- Información de la actividad
  titulo TEXT NOT NULL,
  descripcion TEXT,
  
  -- Horarios
  hora_inicio TIME NOT NULL,
  hora_fin TIME,
  
  -- Ritmo asociado (opcional)
  ritmo INTEGER REFERENCES public.tags(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para event_schedules
CREATE INDEX IF NOT EXISTS idx_event_schedules_event_date_id 
  ON public.event_schedules(event_date_id);

CREATE INDEX IF NOT EXISTS idx_event_schedules_tipo 
  ON public.event_schedules(tipo);

CREATE INDEX IF NOT EXISTS idx_event_schedules_hora_inicio 
  ON public.event_schedules(hora_inicio);

-- Comentarios
COMMENT ON TABLE public.event_schedules IS 'Cronograma de actividades por fecha de evento';
COMMENT ON COLUMN public.event_schedules.tipo IS 'Tipo de actividad: clase, show, social, otro';
COMMENT ON COLUMN public.event_schedules.hora_inicio IS 'Hora de inicio de la actividad';
COMMENT ON COLUMN public.event_schedules.hora_fin IS 'Hora de fin de la actividad (opcional)';

-- ============================================================
-- 2. TABLA: event_prices (Costos y Promociones)
-- ============================================================
-- Almacena los precios y promociones de cada fecha de evento
-- (preventa, taquilla, promociones especiales, etc.)

CREATE TABLE IF NOT EXISTS public.event_prices (
  id SERIAL PRIMARY KEY,
  event_date_id INTEGER NOT NULL REFERENCES public.events_date(id) ON DELETE CASCADE,
  
  -- Tipo de precio
  tipo TEXT NOT NULL CHECK (tipo IN ('preventa', 'taquilla', 'promo')),
  
  -- Información del precio
  nombre TEXT NOT NULL,
  monto DECIMAL(10,2),
  descripcion TEXT,
  
  -- Vigencia (opcional)
  hora_inicio TIMESTAMPTZ,
  hora_fin TIMESTAMPTZ,
  
  -- Descuento (opcional, en porcentaje)
  descuento INTEGER CHECK (descuento >= 0 AND descuento <= 100),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para event_prices
CREATE INDEX IF NOT EXISTS idx_event_prices_event_date_id 
  ON public.event_prices(event_date_id);

CREATE INDEX IF NOT EXISTS idx_event_prices_tipo 
  ON public.event_prices(tipo);

CREATE INDEX IF NOT EXISTS idx_event_prices_monto 
  ON public.event_prices(monto);

-- Comentarios
COMMENT ON TABLE public.event_prices IS 'Precios y promociones por fecha de evento';
COMMENT ON COLUMN public.event_prices.tipo IS 'Tipo de precio: preventa, taquilla, promo';
COMMENT ON COLUMN public.event_prices.monto IS 'Monto del precio en moneda local';
COMMENT ON COLUMN public.event_prices.descuento IS 'Porcentaje de descuento (0-100)';

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en ambas tablas
ALTER TABLE public.event_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_prices ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. POLÍTICAS DE SEGURIDAD: event_schedules
-- ============================================================

-- Política: Cualquiera puede VER cronogramas de eventos publicados
CREATE POLICY "Public can view schedules of published events"
  ON public.event_schedules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events_date ed
      WHERE ed.id = event_schedules.event_date_id
        AND ed.estado_publicacion = 'publicado'
    )
  );

-- Política: Organizadores pueden VER cronogramas de sus propios eventos
CREATE POLICY "Organizers can view their event schedules"
  ON public.event_schedules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.events_date ed
      JOIN public.events_parent ep ON ed.parent_id = ep.id
      JOIN public.profiles_organizer po ON ep.organizer_id = po.id
      WHERE ed.id = event_schedules.event_date_id
        AND po.user_id = auth.uid()
    )
  );

-- Política: Organizadores pueden CREAR cronogramas en sus eventos
CREATE POLICY "Organizers can create schedules for their events"
  ON public.event_schedules
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.events_date ed
      JOIN public.events_parent ep ON ed.parent_id = ep.id
      JOIN public.profiles_organizer po ON ep.organizer_id = po.id
      WHERE ed.id = event_schedules.event_date_id
        AND po.user_id = auth.uid()
    )
  );

-- Política: Organizadores pueden ACTUALIZAR cronogramas de sus eventos
CREATE POLICY "Organizers can update their event schedules"
  ON public.event_schedules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.events_date ed
      JOIN public.events_parent ep ON ed.parent_id = ep.id
      JOIN public.profiles_organizer po ON ep.organizer_id = po.id
      WHERE ed.id = event_schedules.event_date_id
        AND po.user_id = auth.uid()
    )
  );

-- Política: Organizadores pueden ELIMINAR cronogramas de sus eventos
CREATE POLICY "Organizers can delete their event schedules"
  ON public.event_schedules
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.events_date ed
      JOIN public.events_parent ep ON ed.parent_id = ep.id
      JOIN public.profiles_organizer po ON ep.organizer_id = po.id
      WHERE ed.id = event_schedules.event_date_id
        AND po.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. POLÍTICAS DE SEGURIDAD: event_prices
-- ============================================================

-- Política: Cualquiera puede VER precios de eventos publicados
CREATE POLICY "Public can view prices of published events"
  ON public.event_prices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events_date ed
      WHERE ed.id = event_prices.event_date_id
        AND ed.estado_publicacion = 'publicado'
    )
  );

-- Política: Organizadores pueden VER precios de sus propios eventos
CREATE POLICY "Organizers can view their event prices"
  ON public.event_prices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.events_date ed
      JOIN public.events_parent ep ON ed.parent_id = ep.id
      JOIN public.profiles_organizer po ON ep.organizer_id = po.id
      WHERE ed.id = event_prices.event_date_id
        AND po.user_id = auth.uid()
    )
  );

-- Política: Organizadores pueden CREAR precios en sus eventos
CREATE POLICY "Organizers can create prices for their events"
  ON public.event_prices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.events_date ed
      JOIN public.events_parent ep ON ed.parent_id = ep.id
      JOIN public.profiles_organizer po ON ep.organizer_id = po.id
      WHERE ed.id = event_prices.event_date_id
        AND po.user_id = auth.uid()
    )
  );

-- Política: Organizadores pueden ACTUALIZAR precios de sus eventos
CREATE POLICY "Organizers can update their event prices"
  ON public.event_prices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.events_date ed
      JOIN public.events_parent ep ON ed.parent_id = ep.id
      JOIN public.profiles_organizer po ON ep.organizer_id = po.id
      WHERE ed.id = event_prices.event_date_id
        AND po.user_id = auth.uid()
    )
  );

-- Política: Organizadores pueden ELIMINAR precios de sus eventos
CREATE POLICY "Organizers can delete their event prices"
  ON public.event_prices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.events_date ed
      JOIN public.events_parent ep ON ed.parent_id = ep.id
      JOIN public.profiles_organizer po ON ep.organizer_id = po.id
      WHERE ed.id = event_prices.event_date_id
        AND po.user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================================

-- Trigger para event_schedules
CREATE OR REPLACE FUNCTION update_event_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_schedules_updated_at
  BEFORE UPDATE ON public.event_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_event_schedules_updated_at();

-- Trigger para event_prices
CREATE OR REPLACE FUNCTION update_event_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_prices_updated_at
  BEFORE UPDATE ON public.event_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_event_prices_updated_at();

-- ============================================================
-- 7. VERIFICACIÓN FINAL
-- ============================================================

-- Verificar que las tablas existen
SELECT 'Tables created successfully:' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'event_schedules') as event_schedules,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'event_prices') as event_prices;

-- Verificar políticas RLS
SELECT 'RLS Policies:' as status,
  schemaname, 
  tablename, 
  policyname 
FROM pg_policies 
WHERE tablename IN ('event_schedules', 'event_prices')
ORDER BY tablename, policyname;

-- ============================================================
-- ✅ SCRIPT COMPLETADO
-- ============================================================
-- Las tablas event_schedules y event_prices han sido creadas
-- con todas sus políticas de seguridad (RLS).
--
-- Próximo paso: Usar los componentes EventScheduleEditor y 
-- EventPriceEditor en la aplicación.
-- ============================================================
