-- Permitir editar subscription_plan desde SQL / Table Editor sin fallar por mayúsculas o espacios.
-- Además normalizar a minúsculas antes de las reglas del cronograma (trigger subsiguiente).

ALTER TABLE public.profiles_academy
  DROP CONSTRAINT IF EXISTS profiles_academy_subscription_plan_check;

ALTER TABLE public.profiles_academy
  ADD CONSTRAINT profiles_academy_subscription_plan_check
  CHECK (lower(btrim(subscription_plan)) IN ('basic', 'pro', 'premium'));

CREATE OR REPLACE FUNCTION public.normalize_profiles_academy_subscription_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.subscription_plan IS NOT NULL THEN
    NEW.subscription_plan := lower(btrim(NEW.subscription_plan));
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.normalize_profiles_academy_subscription_plan() IS
  'Normaliza subscription_plan a minúsculas y sin espacios laterales antes del resto de triggers.';

DROP TRIGGER IF EXISTS trg_profiles_academy_normalize_subscription_plan ON public.profiles_academy;

CREATE TRIGGER trg_profiles_academy_normalize_subscription_plan
  BEFORE INSERT OR UPDATE OF subscription_plan
  ON public.profiles_academy
  FOR EACH ROW
  EXECUTE PROCEDURE public.normalize_profiles_academy_subscription_plan();
