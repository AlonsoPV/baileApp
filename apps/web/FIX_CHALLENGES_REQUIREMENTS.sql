-- FIX CHALLENGES: Agregar campo de requisitos (lista) y actualizar RPC

-- 1) Agregar columna requirements (JSONB con arreglo de strings)
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS requirements jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2) Normalizar valores existentes que no sean arreglos
UPDATE public.challenges
SET requirements = '[]'::jsonb
WHERE NOT jsonb_typeof(requirements) = 'array';

-- 3) Función helper para limpiar el arreglo de requisitos
CREATE OR REPLACE FUNCTION public.clean_requirements(p_requirements jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_array jsonb := '[]'::jsonb;
  v_item text;
BEGIN
  IF p_requirements IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  IF jsonb_typeof(p_requirements) <> 'array' THEN
    RETURN '[]'::jsonb;
  END IF;

  FOR v_item IN SELECT value::text FROM jsonb_array_elements_text(p_requirements)
  LOOP
    IF v_item IS NOT NULL AND btrim(v_item) <> '' THEN
      v_array := v_array || to_jsonb(btrim(v_item));
    END IF;
  END LOOP;

  RETURN v_array;
END;
$$;

-- 4) Actualizar función challenge_create para aceptar requisitos
CREATE OR REPLACE FUNCTION public.challenge_create(
  p_title text,
  p_description text DEFAULT NULL,
  p_ritmo_slug text DEFAULT NULL,
  p_cover_image_url text DEFAULT NULL,
  p_owner_video_url text DEFAULT NULL,
  p_submission_deadline timestamptz DEFAULT NULL,
  p_voting_deadline timestamptz DEFAULT NULL,
  p_requirements jsonb DEFAULT '[]'::jsonb
) RETURNS bigint AS $$
DECLARE
  v_id bigint;
BEGIN
  IF NOT public.user_role_in(auth.uid(), ARRAY['usuario','superadmin']) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  INSERT INTO public.challenges (
    owner_id,
    title,
    description,
    ritmo_slug,
    cover_image_url,
    owner_video_url,
    submission_deadline,
    voting_deadline,
    requirements
  ) VALUES (
    auth.uid(),
    p_title,
    p_description,
    p_ritmo_slug,
    p_cover_image_url,
    p_owner_video_url,
    p_submission_deadline,
    p_voting_deadline,
    public.clean_requirements(p_requirements)
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) Actualizar requirements existentes con la función sanitizadora
UPDATE public.challenges
SET requirements = public.clean_requirements(requirements);

-- 6) Verificación
SELECT id, title, requirements
FROM public.challenges
ORDER BY created_at DESC
LIMIT 5;

