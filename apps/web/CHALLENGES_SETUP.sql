-- CHALLENGES: schema, RLS, RPCs

-- 1) Types
DO $$ BEGIN
  CREATE TYPE challenge_status AS ENUM ('draft','submitted','open','closed','archived','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Tables
CREATE TABLE IF NOT EXISTS public.challenges (
  id                   bigserial PRIMARY KEY,
  owner_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                text NOT NULL,
  description          text,
  ritmo_slug           text,
  cover_url            text,
  status               challenge_status NOT NULL DEFAULT 'draft',
  approved_by          uuid NULL REFERENCES auth.users(id),
  approved_at          timestamptz NULL,
  submission_deadline  timestamptz NULL,
  voting_deadline      timestamptz NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_ritmo ON public.challenges(ritmo_slug);

CREATE TABLE IF NOT EXISTS public.challenge_submissions (
  id            bigserial PRIMARY KEY,
  challenge_id  bigint NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url     text NOT NULL,
  caption       text,
  status        text NOT NULL DEFAULT 'pending',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id, video_url)
);

CREATE TABLE IF NOT EXISTS public.challenge_votes (
  submission_id bigint NOT NULL REFERENCES public.challenge_submissions(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (submission_id, user_id)
);

-- 3) updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_challenges_touch ON public.challenges;
CREATE TRIGGER trg_challenges_touch
BEFORE UPDATE ON public.challenges
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_challenge_submissions_touch ON public.challenge_submissions;
CREATE TRIGGER trg_challenge_submissions_touch
BEFORE UPDATE ON public.challenge_submissions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) Guard: no OPEN sin aprobación
CREATE OR REPLACE FUNCTION public.enforce_open_requires_approval() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'open' AND (NEW.approved_by IS NULL OR NEW.approved_at IS NULL) THEN
    RAISE EXCEPTION 'Challenge cannot be OPEN without approval fields';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_challenge_open_guard ON public.challenges;
CREATE TRIGGER trg_challenge_open_guard
BEFORE UPDATE ON public.challenges
FOR EACH ROW EXECUTE FUNCTION public.enforce_open_requires_approval();

-- 5) RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_votes ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Helper: Vista para mapear user_id a role_slug
-- ========================================
DROP VIEW IF EXISTS public.v_user_roles CASCADE;
CREATE OR REPLACE VIEW public.v_user_roles AS
SELECT 
  ur.user_id,
  ur.role_slug
FROM public.user_roles ur;

-- ========================================
-- Helper Functions
-- ========================================
CREATE OR REPLACE FUNCTION public.is_superadmin(uid uuid) RETURNS boolean AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.v_user_roles r
    WHERE r.user_id = uid AND r.role_slug = 'superadmin'
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.user_role_in(uid uuid, allowed text[]) RETURNS boolean AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.v_user_roles r
    WHERE r.user_id = uid AND r.role_slug = ANY(allowed)
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.is_owner_challenge(cid bigint, uid uuid) RETURNS boolean AS $$
  SELECT EXISTS(SELECT 1 FROM public.challenges c WHERE c.id = cid AND c.owner_id = uid);
$$ LANGUAGE sql STABLE;

-- challenges
DROP POLICY IF EXISTS challenges_select_public ON public.challenges;
CREATE POLICY challenges_select_public ON public.challenges
FOR SELECT USING (
  status IN ('open','closed','archived')
  OR owner_id = auth.uid()
  OR public.is_superadmin(auth.uid())
);

DROP POLICY IF EXISTS challenges_insert_allowed ON public.challenges;
CREATE POLICY challenges_insert_allowed ON public.challenges
FOR INSERT WITH CHECK (
  public.user_role_in(auth.uid(), ARRAY['usuario','superadmin'])
);

DROP POLICY IF EXISTS challenges_update_owner ON public.challenges;
CREATE POLICY challenges_update_owner ON public.challenges
FOR UPDATE USING (
  owner_id = auth.uid() AND status IN ('draft','rejected')
) WITH CHECK (
  owner_id = auth.uid() AND status IN ('draft','rejected')
);

DROP POLICY IF EXISTS challenges_update_superadmin ON public.challenges;
CREATE POLICY challenges_update_superadmin ON public.challenges
FOR UPDATE USING (public.is_superadmin(auth.uid()))
WITH CHECK (true);

-- challenge_submissions
DROP POLICY IF EXISTS cs_select ON public.challenge_submissions;
CREATE POLICY cs_select ON public.challenge_submissions
FOR SELECT USING (
  status = 'approved'
  OR user_id = auth.uid()
  OR public.is_superadmin(auth.uid())
  OR public.is_owner_challenge(challenge_id, auth.uid())
);

DROP POLICY IF EXISTS cs_insert ON public.challenge_submissions;
CREATE POLICY cs_insert ON public.challenge_submissions
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_id AND c.status = 'open'
  )
);

DROP POLICY IF EXISTS cs_update_moderation ON public.challenge_submissions;
CREATE POLICY cs_update_moderation ON public.challenge_submissions
FOR UPDATE USING (
  public.is_superadmin(auth.uid()) OR public.is_owner_challenge(challenge_id, auth.uid())
) WITH CHECK (
  public.is_superadmin(auth.uid()) OR public.is_owner_challenge(challenge_id, auth.uid())
);

DROP POLICY IF EXISTS cs_delete ON public.challenge_submissions;
CREATE POLICY cs_delete ON public.challenge_submissions
FOR DELETE USING (
  user_id = auth.uid()
  OR public.is_owner_challenge(challenge_id, auth.uid())
  OR public.is_superadmin(auth.uid())
);

-- challenge_votes
DROP POLICY IF EXISTS votes_select ON public.challenge_votes;
CREATE POLICY votes_select ON public.challenge_votes
FOR SELECT USING (true);

DROP POLICY IF EXISTS votes_insert ON public.challenge_votes;
CREATE POLICY votes_insert ON public.challenge_votes
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS votes_delete ON public.challenge_votes;
CREATE POLICY votes_delete ON public.challenge_votes
FOR DELETE USING (user_id = auth.uid() OR public.is_superadmin(auth.uid()));

-- 6) RPCs
CREATE OR REPLACE FUNCTION public.challenge_submit_for_review(p_id bigint)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.challenges WHERE id=p_id AND owner_id=auth.uid()) THEN
    RAISE EXCEPTION 'Not owner';
  END IF;
  UPDATE public.challenges
  SET status='submitted'
  WHERE id=p_id AND status IN ('draft','rejected');
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid state transition'; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear challenge (rol permitido: usuario o superadmin)
CREATE OR REPLACE FUNCTION public.challenge_create(
  p_title text,
  p_description text DEFAULT NULL,
  p_ritmo_slug text DEFAULT NULL,
  p_cover_url text DEFAULT NULL,
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
    owner_id, title, description, ritmo_slug, cover_url,
    submission_deadline, voting_deadline
  ) VALUES (
    auth.uid(), p_title, p_description, p_ritmo_slug, p_cover_url,
    p_submission_deadline, p_voting_deadline
  ) RETURNING id INTO v_id;
  RETURN v_id;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Publicar challenge (auto-aprueba y abre)
CREATE OR REPLACE FUNCTION public.challenge_publish(p_id bigint)
RETURNS void AS $$
BEGIN
  -- Dueño o superadmin
  IF NOT (
    public.is_superadmin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.challenges c WHERE c.id=p_id AND c.owner_id=auth.uid()
    )
  ) THEN RAISE EXCEPTION 'Not allowed'; END IF;

  UPDATE public.challenges
  SET status='open', approved_by=auth.uid(), approved_at=now()
  WHERE id=p_id AND status IN ('draft','rejected','submitted');
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid state transition'; END IF;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enviar video (submission)
CREATE OR REPLACE FUNCTION public.challenge_submit(
  p_challenge_id bigint,
  p_video_url text,
  p_caption text DEFAULT NULL
) RETURNS bigint AS $$
DECLARE v_id bigint; v_open boolean;
BEGIN
  SELECT (c.status='open') INTO v_open FROM public.challenges c WHERE c.id = p_challenge_id;
  IF NOT v_open THEN RAISE EXCEPTION 'Challenge not open'; END IF;
  INSERT INTO public.challenge_submissions (challenge_id, user_id, video_url, caption)
  VALUES (p_challenge_id, auth.uid(), p_video_url, p_caption)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Moderación: aprobar/rechazar submission
CREATE OR REPLACE FUNCTION public.challenge_approve_submission(p_submission_id bigint)
RETURNS void AS $$
BEGIN
  IF NOT (
    public.is_superadmin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.challenge_submissions s
      JOIN public.challenges c ON c.id = s.challenge_id
      WHERE s.id = p_submission_id AND c.owner_id = auth.uid()
    )
  ) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  UPDATE public.challenge_submissions SET status='approved' WHERE id=p_submission_id;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.challenge_reject_submission(p_submission_id bigint)
RETURNS void AS $$
BEGIN
  IF NOT (
    public.is_superadmin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.challenge_submissions s
      JOIN public.challenges c ON c.id = s.challenge_id
      WHERE s.id = p_submission_id AND c.owner_id = auth.uid()
    )
  ) THEN RAISE EXCEPTION 'Not allowed'; END IF;
  UPDATE public.challenge_submissions SET status='rejected' WHERE id=p_submission_id;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle vote
CREATE OR REPLACE FUNCTION public.challenge_toggle_vote(p_submission_id bigint)
RETURNS void AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.challenge_votes WHERE submission_id=p_submission_id AND user_id=auth.uid()
  ) THEN
    DELETE FROM public.challenge_votes WHERE submission_id=p_submission_id AND user_id=auth.uid();
  ELSE
    INSERT INTO public.challenge_votes (submission_id, user_id) VALUES (p_submission_id, auth.uid());
  END IF;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Leaderboard view
CREATE OR REPLACE VIEW public.v_challenge_leaderboard AS
SELECT s.challenge_id,
       s.id AS submission_id,
       s.user_id,
       count(v.user_id)::int AS votes
FROM public.challenge_submissions s
LEFT JOIN public.challenge_votes v ON v.submission_id = s.id
WHERE s.status = 'approved'
GROUP BY s.challenge_id, s.id, s.user_id;

CREATE OR REPLACE FUNCTION public.challenge_approve_and_publish(p_id bigint)
RETURNS void AS $$
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN RAISE EXCEPTION 'Not superadmin'; END IF;
  UPDATE public.challenges
  SET status='open', approved_by=auth.uid(), approved_at=now()
  WHERE id=p_id AND status='submitted';
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid state transition'; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.challenge_reject(p_id bigint)
RETURNS void AS $$
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN RAISE EXCEPTION 'Not superadmin'; END IF;
  UPDATE public.challenges
  SET status='rejected'
  WHERE id=p_id AND status='submitted';
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid state transition'; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.challenge_close(p_id bigint) RETURNS void AS $$
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN RAISE EXCEPTION 'Not superadmin'; END IF;
  UPDATE public.challenges SET status='closed' WHERE id=p_id AND status='open';
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid state transition'; END IF;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.challenge_archive(p_id bigint) RETURNS void AS $$
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN RAISE EXCEPTION 'Not superadmin'; END IF;
  UPDATE public.challenges SET status='archived' WHERE id=p_id AND status IN ('closed','open');
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid state transition'; END IF;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;


