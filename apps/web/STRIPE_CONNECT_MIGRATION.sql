-- ============================================================================
-- MIGRACIÓN: Integración Stripe Connect
-- ============================================================================
-- Agrega columnas de Stripe a las tablas de perfiles que pueden recibir pagos
-- ============================================================================

BEGIN;

-- 1. Agregar columnas Stripe a profiles_teacher (maestros)
ALTER TABLE IF EXISTS public.profiles_teacher
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_onboarding_status text DEFAULT 'not_connected',
ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean DEFAULT false;

-- 2. Agregar columnas Stripe a profiles_academy (academias)
ALTER TABLE IF EXISTS public.profiles_academy
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_onboarding_status text DEFAULT 'not_connected',
ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean DEFAULT false;

-- 3. Agregar columnas Stripe a profiles_organizer (organizadores)
ALTER TABLE IF EXISTS public.profiles_organizer
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_onboarding_status text DEFAULT 'not_connected',
ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean DEFAULT false;

-- 4. Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_stripe_account_id 
  ON public.profiles_teacher(stripe_account_id) 
  WHERE stripe_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_academy_stripe_account_id 
  ON public.profiles_academy(stripe_account_id) 
  WHERE stripe_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_organizer_stripe_account_id 
  ON public.profiles_organizer(stripe_account_id) 
  WHERE stripe_account_id IS NOT NULL;

-- 5. Agregar comentarios para documentación
COMMENT ON COLUMN public.profiles_teacher.stripe_account_id IS 'ID de la cuenta Stripe Connect Express asociada';
COMMENT ON COLUMN public.profiles_teacher.stripe_onboarding_status IS 'Estado del onboarding: not_connected, created, pending, active';
COMMENT ON COLUMN public.profiles_teacher.stripe_charges_enabled IS 'Si la cuenta puede recibir pagos';
COMMENT ON COLUMN public.profiles_teacher.stripe_payouts_enabled IS 'Si la cuenta puede recibir transferencias';

COMMENT ON COLUMN public.profiles_academy.stripe_account_id IS 'ID de la cuenta Stripe Connect Express asociada';
COMMENT ON COLUMN public.profiles_academy.stripe_onboarding_status IS 'Estado del onboarding: not_connected, created, pending, active';
COMMENT ON COLUMN public.profiles_academy.stripe_charges_enabled IS 'Si la cuenta puede recibir pagos';
COMMENT ON COLUMN public.profiles_academy.stripe_payouts_enabled IS 'Si la cuenta puede recibir transferencias';

COMMENT ON COLUMN public.profiles_organizer.stripe_account_id IS 'ID de la cuenta Stripe Connect Express asociada';
COMMENT ON COLUMN public.profiles_organizer.stripe_onboarding_status IS 'Estado del onboarding: not_connected, created, pending, active';
COMMENT ON COLUMN public.profiles_organizer.stripe_charges_enabled IS 'Si la cuenta puede recibir pagos';
COMMENT ON COLUMN public.profiles_organizer.stripe_payouts_enabled IS 'Si la cuenta puede recibir transferencias';

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ejecutar para verificar que las columnas se agregaron correctamente:
-- 
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name IN ('profiles_teacher', 'profiles_academy', 'profiles_organizer')
--   AND column_name LIKE 'stripe%'
-- ORDER BY table_name, ordinal_position;

