-- ============================================================================
-- TRENDING SYSTEM - SETUP COMPLETO PARA PRODUCCIÓN
-- ============================================================================
-- Sistema completo de votaciones por trending con ritmos y candidatos
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. TABLAS
-- ============================================================================

-- Tabla principal de trendings
CREATE TABLE IF NOT EXISTS public.trendings (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    description text,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
    starts_at timestamptz,
    ends_at timestamptz,
    allowed_vote_mode text DEFAULT 'authenticated' CHECK (allowed_vote_mode IN ('authenticated', 'anonymous')),
    cover_url text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at)
);

-- Ritmos asociados a un trending
CREATE TABLE IF NOT EXISTS public.trending_ritmos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trending_id bigint NOT NULL REFERENCES public.trendings(id) ON DELETE CASCADE,
    ritmo_slug text NOT NULL,
    UNIQUE (trending_id, ritmo_slug)
);

-- Candidatos por trending y ritmo
CREATE TABLE IF NOT EXISTS public.trending_candidates (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trending_id bigint NOT NULL REFERENCES public.trendings(id) ON DELETE CASCADE,
    ritmo_slug text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text NOT NULL,
    avatar_url text,
    bio_short text,
    list_name text NOT NULL, -- 'lista_a' o 'lista_b'
    created_at timestamptz DEFAULT now(),
    UNIQUE (trending_id, ritmo_slug, user_id)
);

-- Votos de usuarios
CREATE TABLE IF NOT EXISTS public.trending_votes (
    trending_id bigint NOT NULL REFERENCES public.trendings(id) ON DELETE CASCADE,
    candidate_id bigint NOT NULL REFERENCES public.trending_candidates(id) ON DELETE CASCADE,
    voter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    ip text,
    PRIMARY KEY (trending_id, candidate_id, voter_user_id)
);

-- ============================================================================
-- 2. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_trendings_status ON public.trendings(status);
CREATE INDEX IF NOT EXISTS idx_trendings_dates ON public.trendings(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_trending_ritmos_trending ON public.trending_ritmos(trending_id);
CREATE INDEX IF NOT EXISTS idx_trending_candidates_trending ON public.trending_candidates(trending_id);
CREATE INDEX IF NOT EXISTS idx_trending_candidates_ritmo ON public.trending_candidates(ritmo_slug);
CREATE INDEX IF NOT EXISTS idx_trending_votes_trending ON public.trending_votes(trending_id);
CREATE INDEX IF NOT EXISTS idx_trending_votes_candidate ON public.trending_votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_trending_votes_voter ON public.trending_votes(voter_user_id);

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trendings_updated_at ON public.trendings;
CREATE TRIGGER trg_trendings_updated_at
    BEFORE UPDATE ON public.trendings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Trigger para validar votos
CREATE OR REPLACE FUNCTION public.trg_validate_vote()
RETURNS TRIGGER AS $$
DECLARE
    v_trending_status text;
    v_starts_at timestamptz;
    v_ends_at timestamptz;
    v_allowed_mode text;
    v_candidate_trending bigint;
BEGIN
    -- Obtener info del trending
    SELECT status, starts_at, ends_at, allowed_vote_mode
    INTO v_trending_status, v_starts_at, v_ends_at, v_allowed_mode
    FROM public.trendings
    WHERE id = NEW.trending_id;

    -- Validar que el trending esté abierto
    IF v_trending_status != 'open' THEN
        RAISE EXCEPTION 'Trending no está abierto para votación';
    END IF;

    -- Validar ventana de votación
    IF v_starts_at IS NOT NULL AND now() < v_starts_at THEN
        RAISE EXCEPTION 'La votación aún no ha comenzado';
    END IF;

    IF v_ends_at IS NOT NULL AND now() > v_ends_at THEN
        RAISE EXCEPTION 'La votación ha finalizado';
    END IF;

    -- Validar que el candidato pertenece al trending
    SELECT trending_id INTO v_candidate_trending
    FROM public.trending_candidates
    WHERE id = NEW.candidate_id;

    IF v_candidate_trending IS NULL OR v_candidate_trending != NEW.trending_id THEN
        RAISE EXCEPTION 'Candidato no pertenece a este trending';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_vote ON public.trending_votes;
CREATE TRIGGER trg_validate_vote
    BEFORE INSERT ON public.trending_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_validate_vote();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.trendings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_ritmos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_votes ENABLE ROW LEVEL SECURITY;

-- Políticas para trendings
DROP POLICY IF EXISTS trendings_select_public ON public.trendings;
CREATE POLICY trendings_select_public ON public.trendings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS trendings_insert_superadmin ON public.trendings;
CREATE POLICY trendings_insert_superadmin ON public.trendings
    FOR INSERT WITH CHECK (
        public.is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS trendings_update_superadmin ON public.trendings;
CREATE POLICY trendings_update_superadmin ON public.trendings
    FOR UPDATE USING (
        public.is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS trendings_delete_superadmin ON public.trendings;
CREATE POLICY trendings_delete_superadmin ON public.trendings
    FOR DELETE USING (
        public.is_superadmin(auth.uid())
    );

-- Políticas para trending_ritmos
DROP POLICY IF EXISTS trending_ritmos_select_public ON public.trending_ritmos;
CREATE POLICY trending_ritmos_select_public ON public.trending_ritmos
    FOR SELECT USING (true);

DROP POLICY IF EXISTS trending_ritmos_insert_superadmin ON public.trending_ritmos;
CREATE POLICY trending_ritmos_insert_superadmin ON public.trending_ritmos
    FOR INSERT WITH CHECK (
        public.is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS trending_ritmos_delete_superadmin ON public.trending_ritmos;
CREATE POLICY trending_ritmos_delete_superadmin ON public.trending_ritmos
    FOR DELETE USING (
        public.is_superadmin(auth.uid())
    );

-- Políticas para trending_candidates
DROP POLICY IF EXISTS trending_candidates_select_public ON public.trending_candidates;
CREATE POLICY trending_candidates_select_public ON public.trending_candidates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS trending_candidates_insert_superadmin ON public.trending_candidates;
CREATE POLICY trending_candidates_insert_superadmin ON public.trending_candidates
    FOR INSERT WITH CHECK (
        public.is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS trending_candidates_delete_superadmin ON public.trending_candidates;
CREATE POLICY trending_candidates_delete_superadmin ON public.trending_candidates
    FOR DELETE USING (
        public.is_superadmin(auth.uid())
    );

-- Políticas para trending_votes (privacidad: no SELECT público)
DROP POLICY IF EXISTS trending_votes_insert_authenticated ON public.trending_votes;
CREATE POLICY trending_votes_insert_authenticated ON public.trending_votes
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND voter_user_id = auth.uid()
    );

DROP POLICY IF EXISTS trending_votes_delete_own ON public.trending_votes;
CREATE POLICY trending_votes_delete_own ON public.trending_votes
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND voter_user_id = auth.uid()
    );

DROP POLICY IF EXISTS trending_votes_select_own ON public.trending_votes;
CREATE POLICY trending_votes_select_own ON public.trending_votes
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND voter_user_id = auth.uid()
    );

-- ============================================================================
-- 5. REMOTE PROCEDURE CALLS (RPCs)
-- ============================================================================

-- RPC: Crear trending
DROP FUNCTION IF EXISTS public.rpc_trending_create(text,text,timestamptz,timestamptz,text,text);

CREATE OR REPLACE FUNCTION public.rpc_trending_create(
    p_title text,
    p_description text DEFAULT NULL,
    p_starts_at timestamptz DEFAULT NULL,
    p_ends_at timestamptz DEFAULT NULL,
    p_allowed_vote_mode text DEFAULT 'authenticated',
    p_cover_url text DEFAULT NULL
)
RETURNS bigint AS $$
DECLARE
    v_id bigint;
BEGIN
    IF NOT public.is_superadmin(auth.uid()) THEN
        RAISE EXCEPTION 'Solo superadmins pueden crear trendings';
    END IF;

    INSERT INTO public.trendings (
        title, description, starts_at, ends_at, 
        allowed_vote_mode, cover_url, created_by
    ) VALUES (
        p_title, p_description, p_starts_at, p_ends_at,
        p_allowed_vote_mode, p_cover_url, auth.uid()
    ) RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Publicar trending
DROP FUNCTION IF EXISTS public.rpc_trending_publish(bigint);

CREATE OR REPLACE FUNCTION public.rpc_trending_publish(p_trending_id bigint)
RETURNS void AS $$
BEGIN
    IF NOT public.is_superadmin(auth.uid()) THEN
        RAISE EXCEPTION 'Solo superadmins pueden publicar trendings';
    END IF;

    UPDATE public.trendings
    SET status = 'open'
    WHERE id = p_trending_id AND status = 'draft';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Cerrar trending
DROP FUNCTION IF EXISTS public.rpc_trending_close(bigint);

CREATE OR REPLACE FUNCTION public.rpc_trending_close(p_trending_id bigint)
RETURNS void AS $$
BEGIN
    IF NOT public.is_superadmin(auth.uid()) THEN
        RAISE EXCEPTION 'Solo superadmins pueden cerrar trendings';
    END IF;

    UPDATE public.trendings
    SET status = 'closed'
    WHERE id = p_trending_id AND status = 'open';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Agregar ritmo a trending
DROP FUNCTION IF EXISTS public.rpc_trending_add_ritmo(bigint,text);

CREATE OR REPLACE FUNCTION public.rpc_trending_add_ritmo(
    p_trending_id bigint,
    p_ritmo_slug text
)
RETURNS void AS $$
BEGIN
    IF NOT public.is_superadmin(auth.uid()) THEN
        RAISE EXCEPTION 'Solo superadmins pueden agregar ritmos';
    END IF;

    INSERT INTO public.trending_ritmos (trending_id, ritmo_slug)
    VALUES (p_trending_id, p_ritmo_slug)
    ON CONFLICT (trending_id, ritmo_slug) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Agregar candidato
-- Primero eliminar la función existente si tiene firma diferente
DROP FUNCTION IF EXISTS public.rpc_trending_add_candidate(bigint,text,uuid,text,text,text,text);
DROP FUNCTION IF EXISTS public.rpc_trending_add_candidate(bigint,text,uuid,text,text,text);
DROP FUNCTION IF EXISTS public.rpc_trending_add_candidate(bigint,text,uuid,text);

CREATE OR REPLACE FUNCTION public.rpc_trending_add_candidate(
    p_trending_id bigint,
    p_ritmo_slug text,
    p_user_id uuid,
    p_display_name text,
    p_avatar_url text DEFAULT NULL,
    p_bio_short text DEFAULT NULL,
    p_list_name text DEFAULT 'lista_a'
)
RETURNS bigint AS $$
DECLARE
    v_id bigint;
BEGIN
    IF NOT public.is_superadmin(auth.uid()) THEN
        RAISE EXCEPTION 'Solo superadmins pueden agregar candidatos';
    END IF;

    INSERT INTO public.trending_candidates (
        trending_id, ritmo_slug, user_id, display_name,
        avatar_url, bio_short, list_name
    ) VALUES (
        p_trending_id, p_ritmo_slug, p_user_id, p_display_name,
        p_avatar_url, p_bio_short, p_list_name
    ) RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Votar
DROP FUNCTION IF EXISTS public.rpc_trending_vote(bigint,bigint);

CREATE OR REPLACE FUNCTION public.rpc_trending_vote(
    p_trending_id bigint,
    p_candidate_id bigint
)
RETURNS void AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Debes estar autenticado para votar';
    END IF;

    INSERT INTO public.trending_votes (trending_id, candidate_id, voter_user_id)
    VALUES (p_trending_id, p_candidate_id, auth.uid())
    ON CONFLICT (trending_id, candidate_id, voter_user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Leaderboard (conteo de votos)
DROP FUNCTION IF EXISTS public.rpc_trending_leaderboard(bigint);

CREATE OR REPLACE FUNCTION public.rpc_trending_leaderboard(p_trending_id bigint)
RETURNS TABLE (
    candidate_id bigint,
    ritmo_slug text,
    user_id uuid,
    display_name text,
    avatar_url text,
    bio_short text,
    list_name text,
    votes bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.ritmo_slug,
        c.user_id,
        c.display_name,
        c.avatar_url,
        c.bio_short,
        c.list_name,
        COUNT(v.voter_user_id) as votes
    FROM public.trending_candidates c
    LEFT JOIN public.trending_votes v ON v.candidate_id = c.id
    WHERE c.trending_id = p_trending_id
    GROUP BY c.id, c.ritmo_slug, c.user_id, c.display_name, 
             c.avatar_url, c.bio_short, c.list_name
    ORDER BY votes DESC, c.display_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'trending%'
ORDER BY table_name;

-- Ver funciones RPC creadas
SELECT proname 
FROM pg_proc 
WHERE proname LIKE 'rpc_trending%'
ORDER BY proname;

-- Ver políticas RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'trending%'
ORDER BY tablename, policyname;

-- Estructura de trendings
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'trendings'
ORDER BY ordinal_position;

