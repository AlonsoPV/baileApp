-- Suscripción por plan en perfiles de academia (basic / pro / premium).
-- Incluye estado y fecha de expiración para integración futura con billing.

-- subscription_plan
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles_academy'
          AND column_name = 'subscription_plan'
    ) THEN
        ALTER TABLE public.profiles_academy
            ADD COLUMN subscription_plan text NOT NULL DEFAULT 'basic';
    END IF;
END $$;

-- subscription_status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles_academy'
          AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE public.profiles_academy
            ADD COLUMN subscription_status text NOT NULL DEFAULT 'active';
    END IF;
END $$;

-- subscription_expires_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles_academy'
          AND column_name = 'subscription_expires_at'
    ) THEN
        ALTER TABLE public.profiles_academy
            ADD COLUMN subscription_expires_at timestamptz NULL;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_academy_subscription_plan_check'
          AND conrelid = 'public.profiles_academy'::regclass
    ) THEN
        ALTER TABLE public.profiles_academy
            ADD CONSTRAINT profiles_academy_subscription_plan_check
            CHECK (subscription_plan IN ('basic', 'pro', 'premium'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_academy_subscription_status_check'
          AND conrelid = 'public.profiles_academy'::regclass
    ) THEN
        ALTER TABLE public.profiles_academy
            ADD CONSTRAINT profiles_academy_subscription_status_check
            CHECK (subscription_status IN ('active', 'inactive', 'canceled'));
    END IF;
END $$;

COMMENT ON COLUMN public.profiles_academy.subscription_plan IS
    'Plan de suscripción de la academia: basic, pro o premium.';
COMMENT ON COLUMN public.profiles_academy.subscription_status IS
    'Estado del ciclo de suscripción: active, inactive o canceled.';
COMMENT ON COLUMN public.profiles_academy.subscription_expires_at IS
    'Fin del periodo pagado actual; NULL si no aplica o sin fecha definida.';
