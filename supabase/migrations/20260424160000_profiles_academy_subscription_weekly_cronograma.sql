-- Reglas de cronograma por plan: fecha específica (Basic), modalidad semanal (Basic prohibida, Pro máx. 1 día).

DROP TRIGGER IF EXISTS trg_profiles_academy_basic_specific_class_limit ON public.profiles_academy;

DROP FUNCTION IF EXISTS public.enforce_academy_basic_specific_class_limit();

CREATE OR REPLACE FUNCTION public.enforce_academy_subscription_cronograma_rules()
RETURNS TRIGGER
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
  plan_val := lower(trim(coalesce(NEW.subscription_plan, 'basic')));
  IF plan_val NOT IN ('basic', 'pro', 'premium') THEN
    plan_val := 'basic';
  END IF;

  doc := coalesce(NEW.cronograma, NEW.horarios, '[]'::jsonb);
  IF doc IS NULL OR jsonb_typeof(doc) <> 'array' THEN
    RETURN NEW;
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

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_academy_subscription_cronograma_rules() IS
  'Valida cronograma/horarios según subscription_plan: Basic (cupo fecha específica + sin semanal), Pro (semanal con 1 día como máximo).';

CREATE TRIGGER trg_profiles_academy_subscription_cronograma
  BEFORE INSERT OR UPDATE OF cronograma, horarios, subscription_plan
  ON public.profiles_academy
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_academy_subscription_cronograma_rules();
