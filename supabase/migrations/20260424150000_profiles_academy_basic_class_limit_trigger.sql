-- Límite Basic: máximo 5 clases con fecha específica en cronograma/horarios (alineado con PLAN_CAPABILITIES en app).

CREATE OR REPLACE FUNCTION public.enforce_academy_basic_specific_class_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  plan_val text;
  lim int := 5;
  cnt int := 0;
  doc jsonb;
  elem jsonb;
BEGIN
  plan_val := lower(trim(coalesce(NEW.subscription_plan, 'basic')));
  IF plan_val NOT IN ('basic', 'pro', 'premium') THEN
    plan_val := 'basic';
  END IF;
  IF plan_val <> 'basic' THEN
    RETURN NEW;
  END IF;

  doc := coalesce(NEW.cronograma, NEW.horarios, '[]'::jsonb);
  IF doc IS NULL OR jsonb_typeof(doc) <> 'array' THEN
    RETURN NEW;
  END IF;

  FOR elem IN SELECT jsonb_array_elements(doc)
  LOOP
    IF (elem->>'tipo') = 'clase' THEN
      IF (elem->>'fechaModo') = 'especifica' THEN
        cnt := cnt + 1;
      ELSIF (elem->>'fechaModo') IS NULL OR btrim(coalesce(elem->>'fechaModo', '')) = '' THEN
        IF (elem->>'recurrente') IS DISTINCT FROM 'semanal'
           AND (elem->>'fecha') IS NOT NULL
           AND btrim(elem->>'fecha') <> '' THEN
          cnt := cnt + 1;
        END IF;
      END IF;
    END IF;
  END LOOP;

  IF cnt > lim THEN
    RAISE EXCEPTION 'ACADEMY_SPECIFIC_DATE_CLASS_LIMIT: Basic permite como máximo % clases con fecha específica. Actualiza a Pro o Premium.',
      lim
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_academy_basic_specific_class_limit() IS
  'Rechaza insert/update en profiles_academy si plan basic y más de 5 clases tipo clase con fecha específica en cronograma/horarios.';

DROP TRIGGER IF EXISTS trg_profiles_academy_basic_specific_class_limit ON public.profiles_academy;

CREATE TRIGGER trg_profiles_academy_basic_specific_class_limit
  BEFORE INSERT OR UPDATE OF cronograma, horarios, subscription_plan
  ON public.profiles_academy
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_academy_basic_specific_class_limit();
