-- FIX CHALLENGES: Agregar video base del owner y corregir nombres de columnas

-- 1) Agregar columna para el video base del owner
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS owner_video_url text;

-- 2) Renombrar cover_url a cover_image_url para consistencia
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'challenges' 
    AND column_name = 'cover_url'
  ) THEN
    ALTER TABLE public.challenges RENAME COLUMN cover_url TO cover_image_url;
  END IF;
END $$;

-- 3) Recrear la función challenge_create con los nombres correctos
CREATE OR REPLACE FUNCTION public.challenge_create(
  p_title text,
  p_description text DEFAULT NULL,
  p_ritmo_slug text DEFAULT NULL,
  p_cover_image_url text DEFAULT NULL,
  p_owner_video_url text DEFAULT NULL,
  p_submission_deadline timestamptz DEFAULT NULL,
  p_voting_deadline timestamptz DEFAULT NULL
) RETURNS bigint AS $$
DECLARE
  v_id bigint;
BEGIN
  IF NOT public.user_role_in(auth.uid(), ARRAY['usuario','superadmin']) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  INSERT INTO public.challenges (
    owner_id, title, description, ritmo_slug, cover_image_url, owner_video_url,
    submission_deadline, voting_deadline
  ) VALUES (
    auth.uid(), p_title, p_description, p_ritmo_slug, p_cover_image_url, p_owner_video_url,
    p_submission_deadline, p_voting_deadline
  ) RETURNING id INTO v_id;
  RETURN v_id;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Verificar las columnas
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'challenges'
  AND column_name IN ('cover_image_url', 'owner_video_url', 'cover_url')
ORDER BY column_name;

-- 5) Ver un ejemplo de challenge
SELECT 
  id,
  title,
  cover_image_url,
  owner_video_url,
  status
FROM public.challenges
LIMIT 1;

