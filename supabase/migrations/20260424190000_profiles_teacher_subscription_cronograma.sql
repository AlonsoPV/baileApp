-- Paridad maestro / academia: mismas reglas de cronograma según subscription_plan.
-- Extrae la lógica a una función compartida; academia sigue usando cronograma + horarios.

-- Columnas de suscripción en maestro (por si esta migración corre antes que 20260424140000).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles_teacher'
      AND column_name = 'subscription_plan'
  ) THEN
    ALTER TABLE public.profiles_teacher
      ADD COLUMN subscription_plan text NOT NULL DEFAULT 'basic';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles_teacher'
      AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE public.profiles_teacher
      ADD COLUMN subscription_status text NOT NULL DEFAULT 'active';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles_teacher'
      AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE public.profiles_teacher
      ADD COLUMN subscription_expires_at timestamptz NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_teacher_subscription_status_check'
      AND conrelid = 'public.profiles_teacher'::regclass
  ) THEN
    ALTER TABLE public.profiles_teacher
      ADD CONSTRAINT profiles_teacher_subscription_status_check
      CHECK (subscription_status IN ('active', 'inactive', 'canceled'));
  END IF;
END $$;

COMMENT ON COLUMN public.profiles_teacher.subscription_plan IS
  'Plan de suscripción del maestro: basic, pro o premium.';
COMMENT ON COLUMN public.profiles_teacher.subscription_status IS
  'Estado del ciclo de suscripción: active, inactive o canceled.';
COMMENT ON COLUMN public.profiles_teacher.subscription_expires_at IS
  'Fin del periodo pagado actual; NULL si no aplica o sin fecha definida.';

CREATE OR REPLACE FUNCTION public.assert_cronograma_matches_subscription_plan(
  p_subscription_plan text,
  p_cronograma jsonb,
  p_horarios jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  plan_val text;
  lim_specific int := 5;
  cnt_specific int := 0;
  doc jsonb;
  elem jsonb;
  is_weekly boolean;
  daycnt int;
BEGIN
  plan_val := lower(trim(coalesce(p_subscription_plan, 'basic')));
  IF plan_val NOT IN ('basic', 'pro', 'premium') THEN
    plan_val := 'basic';
  END IF;

  doc := coalesce(p_cronograma, p_horarios, '[]'::jsonb);
  IF doc IS NULL OR jsonb_typeof(doc) <> 'array' THEN
    RETURN;
  END IF;

  FOR elem IN SELECT jsonb_array_elements(doc)
  LOOP
    IF (elem->>'tipo') IS DISTINCT FROM 'clase' THEN
      CONTINUE;
    END IF;

    is_weekly :=
      lower(trim(coalesce(elem->>'fechaModo', ''))) = 'semanal'
      OR lower(trim(coalesce(elem->>'recurrente', ''))) = 'semanal';

    daycnt := 0;
    IF elem ? 'diasSemana' AND jsonb_typeof(elem->'diasSemana') = 'array' THEN
      IF jsonb_array_length(elem->'diasSemana') > 0 THEN
        daycnt := jsonb_array_length(elem->'diasSemana');
      END IF;
    END IF;
    IF daycnt = 0 AND elem->>'diaSemana' IS NOT NULL AND btrim(elem->>'diaSemana') <> '' THEN
      daycnt := 1;
    END IF;

    IF plan_val = 'basic' THEN
      IF (elem->>'fechaModo') = 'especifica' THEN
        cnt_specific := cnt_specific + 1;
      ELSIF (elem->>'fechaModo') IS NULL OR btrim(coalesce(elem->>'fechaModo', '')) = '' THEN
        IF (elem->>'recurrente') IS DISTINCT FROM 'semanal'
           AND (elem->>'fecha') IS NOT NULL
           AND btrim(elem->>'fecha') <> '' THEN
          cnt_specific := cnt_specific + 1;
        END IF;
      END IF;
    END IF;

    IF plan_val = 'basic' AND is_weekly THEN
      RAISE EXCEPTION 'ACADEMY_BASIC_NO_WEEKLY_CLASS: La modalidad semanal está disponible en Pro o Premium. Actualiza tu plan para crear clases semanales recurrentes.'
        USING ERRCODE = 'check_violation';
    END IF;

    IF plan_val = 'pro' AND is_weekly AND daycnt > 1 THEN
      RAISE EXCEPTION 'ACADEMY_PRO_WEEKLY_MAX_ONE_DAY: Tu plan Pro permite solo 1 día semanal por clase.'
        USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  IF plan_val = 'basic' AND cnt_specific > lim_specific THEN
    RAISE EXCEPTION 'ACADEMY_SPECIFIC_DATE_CLASS_LIMIT: Basic permite como máximo % clases con fecha específica. Actualiza a Pro o Premium.',
      lim_specific
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.assert_cronograma_matches_subscription_plan(text, jsonb, jsonb) IS
  'Valida JSON de cronograma/horarios contra el plan (Basic/Pro/Premium). Usado por triggers de academia y maestro.';

CREATE OR REPLACE FUNCTION public.enforce_academy_subscription_cronograma_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_cronograma_matches_subscription_plan(
    NEW.subscription_plan,
    NEW.cronograma,
    NEW.horarios
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_teacher_subscription_cronograma_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.assert_cronograma_matches_subscription_plan(
    NEW.subscription_plan,
    NEW.cronograma,
    NULL::jsonb
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_teacher_subscription_cronograma_rules() IS
  'BEFORE INSERT/UPDATE OF cronograma en profiles_teacher: aplica assert_cronograma_matches_subscription_plan.';

DROP TRIGGER IF EXISTS trg_profiles_teacher_subscription_cronograma ON public.profiles_teacher;

CREATE TRIGGER trg_profiles_teacher_subscription_cronograma
  BEFORE INSERT OR UPDATE OF cronograma
  ON public.profiles_teacher
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_teacher_subscription_cronograma_rules();

COMMENT ON TRIGGER trg_profiles_teacher_subscription_cronograma ON public.profiles_teacher IS
  'Valida cronograma vs plan al insertar o al actualizar cronograma (no en cambios solo de subscription_plan).';

-- Plan: CHECK flexible + normalización (paridad con academia).
ALTER TABLE public.profiles_teacher
  DROP CONSTRAINT IF EXISTS profiles_teacher_subscription_plan_check;

ALTER TABLE public.profiles_teacher
  ADD CONSTRAINT profiles_teacher_subscription_plan_check
  CHECK (lower(btrim(subscription_plan)) IN ('basic', 'pro', 'premium'));

CREATE OR REPLACE FUNCTION public.normalize_profiles_teacher_subscription_plan()
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

DROP TRIGGER IF EXISTS trg_profiles_teacher_normalize_subscription_plan ON public.profiles_teacher;

CREATE TRIGGER trg_profiles_teacher_normalize_subscription_plan
  BEFORE INSERT OR UPDATE OF subscription_plan
  ON public.profiles_teacher
  FOR EACH ROW
  EXECUTE PROCEDURE public.normalize_profiles_teacher_subscription_plan();
