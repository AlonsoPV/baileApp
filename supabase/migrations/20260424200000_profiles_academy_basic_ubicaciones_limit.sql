-- Basic: como máximo 1 fila en `ubicaciones` (jsonb array). Pro/Premium sin límite.

CREATE OR REPLACE FUNCTION public.enforce_academy_basic_ubicaciones_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  plan_val text;
  cnt int;
  doc jsonb;
BEGIN
  plan_val := lower(trim(coalesce(NEW.subscription_plan, 'basic')));
  IF plan_val NOT IN ('basic', 'pro', 'premium') THEN
    plan_val := 'basic';
  END IF;
  IF plan_val <> 'basic' THEN
    RETURN NEW;
  END IF;

  doc := coalesce(NEW.ubicaciones, '[]'::jsonb);
  IF doc IS NULL OR jsonb_typeof(doc) <> 'array' THEN
    RETURN NEW;
  END IF;

  cnt := jsonb_array_length(doc);
  IF cnt > 1 THEN
    RAISE EXCEPTION 'ACADEMY_BASIC_UBICACIONES_LIMIT: Esta academia tiene más ubicaciones de las permitidas en Basic. Para guardar cambios, reduce a 1 ubicación o actualiza el plan.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_academy_basic_ubicaciones_limit() IS
  'Rechaza fila profiles_academy si plan basic y más de 1 ubicación en el array ubicaciones.';

DROP TRIGGER IF EXISTS trg_profiles_academy_basic_ubicaciones_limit ON public.profiles_academy;

CREATE TRIGGER trg_profiles_academy_basic_ubicaciones_limit
  BEFORE INSERT OR UPDATE
  ON public.profiles_academy
  FOR EACH ROW
  EXECUTE PROCEDURE public.enforce_academy_basic_ubicaciones_limit();
