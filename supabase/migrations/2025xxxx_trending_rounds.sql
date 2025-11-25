-- ================================================
-- SISTEMA DE RONDAS PARA TRENDING
-- ================================================
-- Permite configurar competencias por rondas con avances automáticos
-- ================================================

-- ================================================
-- 1. MODIFICAR TABLA TRENDINGS
-- ================================================

-- Agregar configuración de rondas
ALTER TABLE IF EXISTS public.trendings
  ADD COLUMN IF NOT EXISTS rounds_config JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_round_number INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_rounds INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lists_config JSONB DEFAULT NULL;

-- rounds_config estructura:
-- {
--   "rounds": [
--     {
--       "round_number": 1,
--       "advances_per_list": 10,
--       "duration_type": "days" | "hours" | "unlimited",
--       "duration_value": 1 (si es days o hours)
--     },
--     ...
--   ]
-- }

-- lists_config estructura:
-- {
--   "lists": [
--     {
--       "name": "Lista A",
--       "size": 20
--     },
--     {
--       "name": "Lista B", 
--       "size": 20
--     }
--   ]
-- }

-- ================================================
-- 2. TABLA DE RONDAS
-- ================================================

CREATE TABLE IF NOT EXISTS public.trending_rounds (
  id BIGSERIAL PRIMARY KEY,
  trending_id BIGINT NOT NULL REFERENCES public.trendings(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  advances_per_list INT NOT NULL,
  duration_type TEXT NOT NULL CHECK (duration_type IN ('days', 'hours', 'unlimited')),
  duration_value INT DEFAULT NULL, -- NULL si es unlimited
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'closed', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (trending_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_trending_rounds_trending ON public.trending_rounds(trending_id);
CREATE INDEX IF NOT EXISTS idx_trending_rounds_status ON public.trending_rounds(status);
CREATE INDEX IF NOT EXISTS idx_trending_rounds_dates ON public.trending_rounds(starts_at, ends_at);

-- ================================================
-- 3. MODIFICAR TABLA TRENDING_CANDIDATES
-- ================================================

ALTER TABLE IF EXISTS public.trending_candidates
  ADD COLUMN IF NOT EXISTS round_number INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS advanced_from_round INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_active_in_round BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_candidates_round ON public.trending_candidates(trending_id, round_number);
CREATE INDEX IF NOT EXISTS idx_candidates_active_round ON public.trending_candidates(trending_id, round_number, is_active_in_round);

-- ================================================
-- 4. MODIFICAR TABLA TRENDING_VOTES
-- ================================================

ALTER TABLE IF EXISTS public.trending_votes
  ADD COLUMN IF NOT EXISTS round_number INT DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_votes_round ON public.trending_votes(trending_id, round_number);

-- ================================================
-- 5. TRIGGERS
-- ================================================

-- Trigger para updated_at en trending_rounds
CREATE OR REPLACE FUNCTION set_trending_rounds_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trending_rounds_updated_at ON public.trending_rounds;
CREATE TRIGGER trg_trending_rounds_updated_at
  BEFORE UPDATE ON public.trending_rounds
  FOR EACH ROW
  EXECUTE FUNCTION set_trending_rounds_updated_at();

-- ================================================
-- 6. RLS POLICIES
-- ================================================

ALTER TABLE public.trending_rounds ENABLE ROW LEVEL SECURITY;

-- Lectura pública de rondas
DROP POLICY IF EXISTS sel_rounds_public ON public.trending_rounds;
CREATE POLICY sel_rounds_public ON public.trending_rounds
  FOR SELECT USING (true);

-- Solo superadmin puede modificar rondas
DROP POLICY IF EXISTS mod_rounds_admin ON public.trending_rounds;
CREATE POLICY mod_rounds_admin ON public.trending_rounds
  FOR ALL USING (app_is_superadmin());

-- ================================================
-- 7. FUNCIONES RPC
-- ================================================

-- Función para crear/actualizar configuración de rondas
CREATE OR REPLACE FUNCTION rpc_trending_set_rounds_config(
  p_trending_id BIGINT,
  p_rounds_config JSONB,
  p_lists_config JSONB,
  p_total_rounds INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT app_is_superadmin() THEN
    RAISE EXCEPTION 'Solo superadmin puede configurar rondas';
  END IF;

  UPDATE public.trendings
  SET 
    rounds_config = p_rounds_config,
    lists_config = p_lists_config,
    total_rounds = p_total_rounds,
    current_round_number = 0
  WHERE id = p_trending_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Trending no existe';
  END IF;
END;
$$;

-- Función para inicializar la primera ronda
CREATE OR REPLACE FUNCTION rpc_trending_start_first_round(
  p_trending_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rounds_config JSONB;
  v_first_round JSONB;
  v_starts_at TIMESTAMPTZ;
  v_ends_at TIMESTAMPTZ;
  v_duration_type TEXT;
  v_duration_value INT;
BEGIN
  IF NOT app_is_superadmin() THEN
    RAISE EXCEPTION 'Solo superadmin puede iniciar rondas';
  END IF;

  -- Obtener configuración de rondas
  SELECT rounds_config INTO v_rounds_config
  FROM public.trendings
  WHERE id = p_trending_id;

  IF v_rounds_config IS NULL THEN
    RAISE EXCEPTION 'Trending no tiene configuración de rondas';
  END IF;

  -- Obtener primera ronda
  v_first_round := v_rounds_config->'rounds'->0;
  
  IF v_first_round IS NULL THEN
    RAISE EXCEPTION 'No hay rondas configuradas';
  END IF;

  v_duration_type := v_first_round->>'duration_type';
  v_duration_value := (v_first_round->>'duration_value')::INT;
  v_starts_at := NOW();

  -- Calcular fecha de fin según tipo de duración
  IF v_duration_type = 'days' THEN
    v_ends_at := v_starts_at + (v_duration_value || ' days')::INTERVAL;
  ELSIF v_duration_type = 'hours' THEN
    v_ends_at := v_starts_at + (v_duration_value || ' hours')::INTERVAL;
  ELSE
    v_ends_at := NULL; -- unlimited
  END IF;

  -- Crear registro de ronda
  INSERT INTO public.trending_rounds (
    trending_id,
    round_number,
    advances_per_list,
    duration_type,
    duration_value,
    starts_at,
    ends_at,
    status
  )
  VALUES (
    p_trending_id,
    1,
    (v_first_round->>'advances_per_list')::INT,
    v_duration_type,
    v_duration_value,
    v_starts_at,
    v_ends_at,
    'active'
  )
  ON CONFLICT (trending_id, round_number) DO UPDATE
  SET 
    advances_per_list = EXCLUDED.advances_per_list,
    duration_type = EXCLUDED.duration_type,
    duration_value = EXCLUDED.duration_value,
    starts_at = EXCLUDED.starts_at,
    ends_at = EXCLUDED.ends_at,
    status = 'active';

  -- Actualizar trending
  UPDATE public.trendings
  SET current_round_number = 1
  WHERE id = p_trending_id;

  -- Activar todos los candidatos en la ronda 1
  UPDATE public.trending_candidates
  SET 
    round_number = 1,
    is_active_in_round = TRUE
  WHERE trending_id = p_trending_id;
END;
$$;

-- Función para cerrar una ronda y avanzar ganadores
CREATE OR REPLACE FUNCTION rpc_trending_close_round(
  p_trending_id BIGINT,
  p_round_number INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round RECORD;
  v_next_round_number INT;
  v_rounds_config JSONB;
  v_next_round_config JSONB;
  v_current_round_config JSONB;
  v_advances_per_list INT;
  v_list_name TEXT;
  v_candidate RECORD;
  v_rank INT;
BEGIN
  IF NOT app_is_superadmin() THEN
    RAISE EXCEPTION 'Solo superadmin puede cerrar rondas';
  END IF;

  -- Obtener información de la ronda actual
  SELECT * INTO v_round
  FROM public.trending_rounds
  WHERE trending_id = p_trending_id AND round_number = p_round_number;

  IF v_round IS NULL THEN
    RAISE EXCEPTION 'Ronda no existe';
  END IF;

  IF v_round.status = 'closed' THEN
    RAISE EXCEPTION 'Ronda ya está cerrada';
  END IF;

  -- Obtener configuración de rondas
  SELECT rounds_config INTO v_rounds_config
  FROM public.trendings
  WHERE id = p_trending_id;

  -- Obtener configuración de la RONDA ACTUAL (la que se está cerrando)
  -- El advances_per_list de la ronda actual indica cuántos avanzan desde esta ronda
  v_current_round_config := v_rounds_config->'rounds'->(p_round_number - 1);
  
  IF v_current_round_config IS NULL THEN
    RAISE EXCEPTION 'No hay configuración para la ronda %', p_round_number;
  END IF;
  
  -- Obtener cuántos candidatos avanzan desde esta ronda
  v_advances_per_list := (v_current_round_config->>'advances_per_list')::INT;
  
  IF v_advances_per_list IS NULL OR v_advances_per_list <= 0 THEN
    RAISE EXCEPTION 'advances_per_list no está configurado o es inválido para la ronda %', p_round_number;
  END IF;
  
  RAISE NOTICE 'Ronda %: Avanzarán % candidatos por lista', p_round_number, v_advances_per_list;

  -- Calcular siguiente ronda
  v_next_round_number := p_round_number + 1;

  -- Verificar si hay siguiente ronda
  v_next_round_config := v_rounds_config->'rounds'->(v_next_round_number - 1);

  -- Cerrar ronda actual
  UPDATE public.trending_rounds
  SET 
    status = 'closed',
    ends_at = COALESCE(ends_at, NOW())
  WHERE trending_id = p_trending_id AND round_number = p_round_number;

  -- Si hay siguiente ronda, avanzar ganadores
  IF v_next_round_config IS NOT NULL THEN

    -- Obtener listas únicas de candidatos activos en esta ronda
    FOR v_list_name IN
      SELECT DISTINCT COALESCE(list_name, 'General') as list_name
      FROM public.trending_candidates
      WHERE trending_id = p_trending_id
        AND round_number = p_round_number
        AND is_active_in_round = TRUE
      ORDER BY list_name
    LOOP
      -- Avanzar top N candidatos por lista (solo los configurados en advances_per_list)
      v_rank := 0;
      
      RAISE NOTICE 'Procesando lista: % - Avanzarán % candidatos', v_list_name, v_advances_per_list;
      
      FOR v_candidate IN
        SELECT 
          c.id,
          c.user_id,
          c.display_name,
          COUNT(v.voter_user_id) as votes
        FROM public.trending_candidates c
        LEFT JOIN public.trending_votes v
          ON v.trending_id = c.trending_id
          AND v.candidate_id = c.id
          AND v.round_number = p_round_number
        WHERE c.trending_id = p_trending_id
          AND c.round_number = p_round_number
          AND c.is_active_in_round = TRUE
          AND (
            (v_list_name = 'General' AND c.list_name IS NULL)
            OR (v_list_name != 'General' AND c.list_name = v_list_name)
          )
        GROUP BY c.id, c.user_id, c.display_name
        ORDER BY votes DESC, c.id ASC
        LIMIT v_advances_per_list  -- ⚠️ IMPORTANTE: Solo avanzan los top N configurados
      LOOP
        v_rank := v_rank + 1;
        
        RAISE NOTICE '  %° lugar: % (ID: %) - % votos', 
          v_rank, 
          COALESCE(v_candidate.display_name, 'Sin nombre'),
          v_candidate.id,
          v_candidate.votes;
        
        -- Actualizar candidato para siguiente ronda
        UPDATE public.trending_candidates
        SET 
          round_number = v_next_round_number,
          advanced_from_round = p_round_number,
          is_active_in_round = TRUE
        WHERE id = v_candidate.id;
      END LOOP;
      
      RAISE NOTICE 'Lista %: % candidatos avanzaron de % configurados', 
        v_list_name, 
        v_rank, 
        v_advances_per_list;
    END LOOP;

    -- Crear registro de siguiente ronda
    INSERT INTO public.trending_rounds (
      trending_id,
      round_number,
      advances_per_list,
      duration_type,
      duration_value,
      starts_at,
      ends_at,
      status
    )
    VALUES (
      p_trending_id,
      v_next_round_number,
      v_advances_per_list,
      v_next_round_config->>'duration_type',
      (v_next_round_config->>'duration_value')::INT,
      NOW(),
      CASE 
        WHEN v_next_round_config->>'duration_type' = 'days' THEN
          NOW() + ((v_next_round_config->>'duration_value')::INT || ' days')::INTERVAL
        WHEN v_next_round_config->>'duration_type' = 'hours' THEN
          NOW() + ((v_next_round_config->>'duration_value')::INT || ' hours')::INTERVAL
        ELSE NULL
      END,
      'active'
    )
    ON CONFLICT (trending_id, round_number) DO UPDATE
    SET 
      status = 'active',
      starts_at = NOW(),
      ends_at = CASE 
        WHEN v_next_round_config->>'duration_type' = 'days' THEN
          NOW() + ((v_next_round_config->>'duration_value')::INT || ' days')::INTERVAL
        WHEN v_next_round_config->>'duration_type' = 'hours' THEN
          NOW() + ((v_next_round_config->>'duration_value')::INT || ' hours')::INTERVAL
        ELSE NULL
      END;

    -- Actualizar trending
    UPDATE public.trendings
    SET current_round_number = v_next_round_number
    WHERE id = p_trending_id;
    
    -- Desactivar candidatos que NO avanzaron (después de avanzar los ganadores)
    -- Solo desactivar los que aún están en la ronda actual (no avanzaron)
    -- Los que avanzaron ya tienen round_number = v_next_round_number
    UPDATE public.trending_candidates
    SET is_active_in_round = FALSE
    WHERE trending_id = p_trending_id
      AND round_number = p_round_number  -- Solo los que aún están en esta ronda
      AND is_active_in_round = TRUE;     -- Y están activos (no avanzaron)
    
    RAISE NOTICE 'Candidatos desactivados en ronda % (no avanzaron)', p_round_number;
  ELSE
    -- Es la ronda final, marcar trending como cerrado
    UPDATE public.trendings
    SET status = 'closed'
    WHERE id = p_trending_id;
    
    -- Desactivar todos los candidatos de la ronda final
    UPDATE public.trending_candidates
    SET is_active_in_round = FALSE
    WHERE trending_id = p_trending_id
      AND round_number = p_round_number
      AND is_active_in_round = TRUE;
  END IF;
END;
$$;

-- Función para obtener candidatos activos de una ronda
DROP FUNCTION IF EXISTS rpc_trending_get_round_candidates(BIGINT, INT);
CREATE FUNCTION rpc_trending_get_round_candidates(
  p_trending_id BIGINT,
  p_round_number INT
)
RETURNS TABLE (
  candidate_id BIGINT,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  bio_short TEXT,
  list_name TEXT,
  ritmo_slug TEXT,
  votes BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id as candidate_id,
    c.user_id,
    COALESCE(c.display_name, 'Sin nombre') as display_name,
    c.avatar_url,
    c.bio_short,
    c.list_name,
    c.ritmo_slug,
    COUNT(v.voter_user_id) as votes
  FROM public.trending_candidates c
  LEFT JOIN public.trending_votes v
    ON v.trending_id = c.trending_id
    AND v.candidate_id = c.id
    AND v.round_number = p_round_number
  WHERE c.trending_id = p_trending_id
    -- Solo mostrar candidatos activos en la ronda actual (no los que ya avanzaron)
    AND c.round_number = p_round_number
    AND c.is_active_in_round = TRUE
  GROUP BY c.id, c.user_id, c.display_name, c.avatar_url, c.bio_short, c.list_name, c.ritmo_slug
  ORDER BY c.list_name, votes DESC, c.id ASC;
$$;

-- Función para votar en una ronda específica
CREATE OR REPLACE FUNCTION rpc_trending_vote_round(
  p_trending_id BIGINT,
  p_candidate_id BIGINT,
  p_round_number INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trending_status TEXT;
  v_round_status TEXT;
  v_round_ends_at TIMESTAMPTZ;
  v_candidate_round INT;
  v_candidate_active BOOLEAN;
BEGIN
  -- Verificar que el usuario esté autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para votar';
  END IF;

  -- Verificar que el trending existe y está abierto
  SELECT status INTO v_trending_status
  FROM public.trendings
  WHERE id = p_trending_id;

  IF v_trending_status IS NULL THEN
    RAISE EXCEPTION 'Trending no existe';
  END IF;

  IF v_trending_status != 'open' THEN
    RAISE EXCEPTION 'Trending no está abierto para votación';
  END IF;

  -- Verificar que la ronda está activa
  SELECT status, ends_at INTO v_round_status, v_round_ends_at
  FROM public.trending_rounds
  WHERE trending_id = p_trending_id AND round_number = p_round_number;

  IF v_round_status IS NULL THEN
    RAISE EXCEPTION 'Ronda no existe';
  END IF;

  IF v_round_status != 'active' THEN
    RAISE EXCEPTION 'Ronda no está activa';
  END IF;

  -- Verificar que la ronda no haya expirado
  IF v_round_ends_at IS NOT NULL AND NOW() > v_round_ends_at THEN
    RAISE EXCEPTION 'Ronda ha expirado';
  END IF;

  -- Verificar que el candidato pertenece a la ronda y está activo
  SELECT round_number, is_active_in_round 
  INTO v_candidate_round, v_candidate_active
  FROM public.trending_candidates
  WHERE id = p_candidate_id AND trending_id = p_trending_id;

  IF v_candidate_round IS NULL THEN
    RAISE EXCEPTION 'Candidato no existe';
  END IF;

  IF v_candidate_round != p_round_number THEN
    RAISE EXCEPTION 'Candidato no pertenece a esta ronda';
  END IF;

  IF NOT v_candidate_active THEN
    RAISE EXCEPTION 'Candidato no está activo en esta ronda';
  END IF;

  -- Toggle vote (insertar o eliminar)
  IF EXISTS (
    SELECT 1 FROM public.trending_votes
    WHERE trending_id = p_trending_id
      AND candidate_id = p_candidate_id
      AND voter_user_id = auth.uid()
      AND round_number = p_round_number
  ) THEN
    -- Eliminar voto
    DELETE FROM public.trending_votes
    WHERE trending_id = p_trending_id
      AND candidate_id = p_candidate_id
      AND voter_user_id = auth.uid()
      AND round_number = p_round_number;
  ELSE
    -- Insertar voto
    INSERT INTO public.trending_votes(trending_id, candidate_id, voter_user_id, round_number)
    VALUES (p_trending_id, p_candidate_id, auth.uid(), p_round_number);
  END IF;
END;
$$;

-- Función para obtener información de rondas de un trending
CREATE OR REPLACE FUNCTION rpc_trending_get_rounds(
  p_trending_id BIGINT
)
RETURNS TABLE (
  round_number INT,
  advances_per_list INT,
  duration_type TEXT,
  duration_value INT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.round_number,
    r.advances_per_list,
    r.duration_type,
    r.duration_value,
    r.starts_at,
    r.ends_at,
    r.status
  FROM public.trending_rounds r
  WHERE r.trending_id = p_trending_id
  ORDER BY r.round_number ASC;
$$;

-- ================================================
-- 8. GRANTS
-- ================================================

GRANT EXECUTE ON FUNCTION rpc_trending_set_rounds_config(BIGINT, JSONB, JSONB, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_trending_start_first_round(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_trending_close_round(BIGINT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_trending_get_round_candidates(BIGINT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_trending_vote_round(BIGINT, BIGINT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_trending_get_rounds(BIGINT) TO anon, authenticated;

-- ================================================
-- 9. COMENTARIOS
-- ================================================

COMMENT ON TABLE public.trending_rounds IS 'Rondas de competencia para trendings';
COMMENT ON COLUMN public.trendings.rounds_config IS 'Configuración JSONB de rondas con avances y duraciones';
COMMENT ON COLUMN public.trendings.lists_config IS 'Configuración JSONB de listas participantes';
COMMENT ON COLUMN public.trendings.current_round_number IS 'Número de ronda actual (0 = no iniciado)';
COMMENT ON COLUMN public.trending_candidates.round_number IS 'Ronda en la que participa el candidato';
COMMENT ON COLUMN public.trending_candidates.advanced_from_round IS 'Ronda desde la cual avanzó (NULL si es ronda inicial)';
COMMENT ON COLUMN public.trending_votes.round_number IS 'Ronda en la que se emitió el voto';

