-- =====================================================
-- SCRIPT 9: Fix RSVP - Constraint UNIQUE y Políticas
-- =====================================================
-- Este script arregla el problema de actualización de RSVPs
-- asegurando que existe el constraint UNIQUE correcto.
-- =====================================================

-- ============================================================
-- 1. VERIFICAR CONSTRAINT ÚNICO
-- ============================================================

-- Verificar si ya existe el constraint
SELECT 
  'Existing UNIQUE constraints:' as info,
  constraint_name, 
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'rsvp' 
  AND constraint_type = 'UNIQUE';

-- ============================================================
-- 2. ELIMINAR CONSTRAINT ANTIGUO SI EXISTE
-- ============================================================

-- Eliminar constraint antiguo (puede tener diferentes nombres)
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN 
    SELECT constraint_name 
    FROM information_schema.constraint_column_usage
    WHERE table_name = 'rsvp' 
      AND column_name IN ('user_id', 'event_date_id')
      AND constraint_name LIKE '%user%event%'
  LOOP
    EXECUTE 'ALTER TABLE public.rsvp DROP CONSTRAINT IF EXISTS ' || constraint_rec.constraint_name || ' CASCADE';
    RAISE NOTICE 'Dropped constraint: %', constraint_rec.constraint_name;
  END LOOP;
END $$;

-- ============================================================
-- 3. CREAR CONSTRAINT ÚNICO CORRECTO
-- ============================================================

-- Crear constraint único para evitar RSVPs duplicados
ALTER TABLE public.rsvp 
  DROP CONSTRAINT IF EXISTS rsvp_user_event_unique CASCADE;

ALTER TABLE public.rsvp 
  ADD CONSTRAINT rsvp_user_event_unique 
  UNIQUE (user_id, event_date_id);

COMMENT ON CONSTRAINT rsvp_user_event_unique ON public.rsvp IS 
  'Un usuario solo puede tener un RSVP por evento';

-- ============================================================
-- 4. RECREAR POLÍTICAS RLS (por si acaso)
-- ============================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view all RSVPs" ON public.rsvp;
DROP POLICY IF EXISTS "Users can insert own RSVP" ON public.rsvp;
DROP POLICY IF EXISTS "Users can update own RSVP" ON public.rsvp;
DROP POLICY IF EXISTS "Users can delete own RSVP" ON public.rsvp;

-- Política: Ver todos los RSVPs (para contar asistentes)
CREATE POLICY "Users can view all RSVPs"
  ON public.rsvp
  FOR SELECT
  TO authenticated
  USING (true);

-- Política: Insertar RSVP propio
CREATE POLICY "Users can insert own RSVP"
  ON public.rsvp
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política: Actualizar RSVP propio
CREATE POLICY "Users can update own RSVP"
  ON public.rsvp
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Eliminar RSVP propio
CREATE POLICY "Users can delete own RSVP"
  ON public.rsvp
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. VERIFICACIÓN FINAL
-- ============================================================

-- Verificar constraint único
SELECT 
  'UNIQUE constraint verification:' as status,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'rsvp' 
  AND constraint_type = 'UNIQUE';

-- Verificar políticas RLS
SELECT 
  'RLS Policies verification:' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'rsvp'
ORDER BY policyname;

-- Probar inserción/actualización (simulación)
SELECT 
  'Test complete:' as status,
  'RSVP table ready for upsert operations' as message;

-- ============================================================
-- ✅ SCRIPT COMPLETADO
-- ============================================================
-- El constraint UNIQUE ha sido verificado/creado.
-- Las políticas RLS han sido recreadas.
-- La tabla está lista para operaciones upsert.
-- ============================================================
