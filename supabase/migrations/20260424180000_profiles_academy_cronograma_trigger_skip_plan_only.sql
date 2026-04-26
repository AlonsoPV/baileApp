-- No ejecutar validación de cronograma cuando el UPDATE solo cambia subscription_plan.
-- Así un admin puede ajustar el plan en SQL aunque el cronograma aún tenga datos de un tier
-- anterior; la coherencia se exige al guardar cronograma/horarios (app o SQL).

DROP TRIGGER IF EXISTS trg_profiles_academy_subscription_cronograma ON public.profiles_academy;

CREATE TRIGGER trg_profiles_academy_subscription_cronograma
  BEFORE INSERT OR UPDATE OF cronograma, horarios
  ON public.profiles_academy
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_academy_subscription_cronograma_rules();

COMMENT ON TRIGGER trg_profiles_academy_subscription_cronograma ON public.profiles_academy IS
  'INSERT: valida cronograma vs plan. UPDATE: solo si cambian cronograma u horarios (no en cambios únicos de subscription_plan).';
