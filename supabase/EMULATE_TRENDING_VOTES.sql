-- ================================================
-- SCRIPT: Emular votos para usuarios del trending
-- ================================================
-- Este script genera votos aleatorios para los candidatos
-- de un trending basándose en los user_ids proporcionados
-- ================================================
-- USO:
-- 1. Cambia p_trending_id por el ID del trending (ej: 9)
-- 2. Ajusta p_votes_per_candidate_min y p_votes_per_candidate_max
--    para controlar cuántos votos recibe cada candidato
-- 3. Ajusta p_round_number si quieres votos en una ronda específica
--    (NULL = usa la ronda actual del trending)
-- ================================================

DO $$
DECLARE
  -- ================================================
  -- CONFIGURACIÓN
  -- ================================================
  p_trending_id BIGINT := 9; -- ⚠️ CAMBIAR: ID del trending
  p_votes_per_candidate_min INT := 5; -- Mínimo de votos por candidato
  p_votes_per_candidate_max INT := 15; -- Máximo de votos por candidato
  p_round_number INT := NULL; -- NULL = usa la ronda actual del trending
  
  -- ================================================
  -- DATOS DE PARTICIPANTES (de la lista proporcionada)
  -- ================================================
  v_participant_user_ids UUID[] := ARRAY[
    -- Lista "Leads"
    '48cdf88b-ca0a-40a3-979c-690520a036b8'::UUID, -- Edgar Pérez
    '449cffd0-e105-41a8-94a0-0154136f95b4'::UUID, -- Vic Salsero
    '7408d5af-13c2-4549-9bb5-758d542855b6'::UUID, -- Santiago
    '6eccf8b5-da3b-43e4-b1fe-057869881ca9'::UUID, -- Abraham Harris
    '64d17906-38ef-4cfb-b9d9-235a8cd1409c'::UUID, -- Edgar
    'f141385c-dd6e-4f9a-97a1-75c996c313bb'::UUID, -- Sergio Pizarro
    -- Lista "Follows"
    '29a34274-50bf-4c72-b845-4204a4d3d517'::UUID, -- melichachachá
    '4a3695ce-5e07-440b-950d-cdcfb3c4d88c'::UUID, -- Haydeé
    '97a366b0-b1f3-4b85-8069-cb4fea828dda'::UUID, -- Annie
    'dbed56f4-edeb-4439-8e3d-ce6003d4a91d'::UUID, -- Naiie
    '689b66aa-992f-43e2-ab22-13437c34e825'::UUID, -- Agla
    '3eeeb2fc-66e4-4e4d-a7e6-d9901dc47bf9'::UUID  -- Tania Sifuentes
  ];
  
  -- ================================================
  -- VARIABLES INTERNAS
  -- ================================================
  v_current_round INT;
  v_candidate RECORD;
  v_voter_user_id UUID;
  v_votes_count INT;
  v_total_votes_inserted INT := 0;
  v_candidates_found INT := 0;
  v_available_voters UUID[];
  v_random_votes INT;
BEGIN
  -- ================================================
  -- 1. VERIFICAR QUE EL TRENDING EXISTE
  -- ================================================
  IF NOT EXISTS (SELECT 1 FROM public.trendings WHERE id = p_trending_id) THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ Trending con ID % no existe.', p_trending_id;
    RAISE NOTICE '';
    RAISE NOTICE '📋 TRENDINGS DISPONIBLES:';
    RAISE NOTICE '';
    FOR v_candidate IN
      SELECT id, title, status, current_round_number, created_at
      FROM public.trendings
      ORDER BY id DESC
      LIMIT 10
    LOOP
      RAISE NOTICE '   ID: % | Título: % | Estado: % | Ronda actual: % | Creado: %',
        v_candidate.id,
        v_candidate.title,
        v_candidate.status,
        COALESCE(v_candidate.current_round_number::TEXT, 'N/A'),
        v_candidate.created_at;
    END LOOP;
    RAISE NOTICE '';
    RAISE EXCEPTION 'Por favor, actualiza p_trending_id con un ID válido de la lista anterior.';
  END IF;
  
  -- ================================================
  -- 2. OBTENER LA RONDA ACTUAL O USAR LA ESPECIFICADA
  -- ================================================
  IF p_round_number IS NULL THEN
    SELECT current_round_number INTO v_current_round
    FROM public.trendings
    WHERE id = p_trending_id;
    
    IF v_current_round IS NULL OR v_current_round = 0 THEN
      v_current_round := 1; -- Por defecto, ronda 1
      RAISE NOTICE '⚠️ Trending no tiene ronda activa. Usando ronda 1.';
    ELSE
      RAISE NOTICE '✅ Usando ronda actual: %', v_current_round;
    END IF;
  ELSE
    v_current_round := p_round_number;
    RAISE NOTICE '✅ Usando ronda especificada: %', v_current_round;
  END IF;
  
  -- ================================================
  -- 3. OBTENER USUARIOS DISPONIBLES PARA VOTAR
  -- ================================================
  -- Obtener usuarios autenticados que NO sean candidatos en este trending
  SELECT ARRAY_AGG(id) INTO v_available_voters
  FROM auth.users
  WHERE id != ALL(v_participant_user_ids) -- Excluir a los candidatos
    AND id IS NOT NULL;
  
  IF v_available_voters IS NULL OR array_length(v_available_voters, 1) = 0 THEN
    RAISE EXCEPTION 'No hay usuarios disponibles para votar. Necesitas usuarios que no sean candidatos.';
  END IF;
  
  RAISE NOTICE '✅ Usuarios disponibles para votar: %', array_length(v_available_voters, 1);
  
  -- ================================================
  -- 4. ENCONTRAR CANDIDATOS Y GENERAR VOTOS
  -- ================================================
  FOR v_candidate IN
    SELECT 
      c.id as candidate_id,
      c.user_id,
      c.display_name,
      c.list_name,
      c.round_number,
      c.is_active_in_round
    FROM public.trending_candidates c
    WHERE c.trending_id = p_trending_id
      AND c.user_id = ANY(v_participant_user_ids)
      AND (c.round_number = v_current_round OR c.round_number IS NULL)
      AND (c.is_active_in_round = TRUE OR c.is_active_in_round IS NULL)
  LOOP
    v_candidates_found := v_candidates_found + 1;
    
    -- Generar número aleatorio de votos para este candidato
    v_random_votes := floor(random() * (p_votes_per_candidate_max - p_votes_per_candidate_min + 1)) + p_votes_per_candidate_min;
    
    RAISE NOTICE '📊 Candidato: % (ID: %, Lista: %) - Generando % votos...', 
      v_candidate.display_name, 
      v_candidate.candidate_id,
      v_candidate.list_name,
      v_random_votes;
    
    -- Generar votos aleatorios
    v_votes_count := 0;
    FOR i IN 1..v_random_votes LOOP
      -- Seleccionar un votante aleatorio de los disponibles
      v_voter_user_id := v_available_voters[floor(random() * array_length(v_available_voters, 1)) + 1];
      
      -- Insertar voto (ignorar si ya existe)
      BEGIN
        INSERT INTO public.trending_votes (
          trending_id,
          candidate_id,
          voter_user_id,
          round_number,
          created_at
        )
        VALUES (
          p_trending_id,
          v_candidate.candidate_id,
          v_voter_user_id,
          v_current_round,
          NOW() - (random() * INTERVAL '7 days') -- Votos distribuidos en los últimos 7 días
        )
        ON CONFLICT (trending_id, candidate_id, voter_user_id, round_number) DO NOTHING;
        -- Nota: La PK incluye round_number, por lo que un usuario puede votar por el mismo
        -- candidato en diferentes rondas, pero solo una vez por ronda.
        
        IF FOUND THEN
          v_votes_count := v_votes_count + 1;
          v_total_votes_inserted := v_total_votes_inserted + 1;
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
          -- Ignorar errores de duplicados u otros
          NULL;
      END;
    END LOOP;
    
    RAISE NOTICE '   ✅ Votos insertados: %', v_votes_count;
  END LOOP;
  
  -- ================================================
  -- 5. RESUMEN FINAL
  -- ================================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 RESUMEN DE VOTOS GENERADOS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Trending ID: %', p_trending_id;
  RAISE NOTICE 'Ronda: %', v_current_round;
  RAISE NOTICE 'Candidatos encontrados: %', v_candidates_found;
  RAISE NOTICE 'Total de votos insertados: %', v_total_votes_inserted;
  RAISE NOTICE '========================================';
  
  -- Mostrar leaderboard actualizado
  RAISE NOTICE '';
  RAISE NOTICE '🏆 LEADERBOARD ACTUALIZADO:';
  RAISE NOTICE '';
  
  FOR v_candidate IN
    SELECT 
      c.id as candidate_id,
      c.display_name,
      c.list_name,
      COUNT(v.voter_user_id) as votes
    FROM public.trending_candidates c
    LEFT JOIN public.trending_votes v
      ON v.trending_id = c.trending_id
      AND v.candidate_id = c.id
      AND v.round_number = v_current_round
    WHERE c.trending_id = p_trending_id
      AND c.user_id = ANY(v_participant_user_ids)
    GROUP BY c.id, c.display_name, c.list_name
    ORDER BY votes DESC, c.display_name ASC
  LOOP
    RAISE NOTICE '   % - % votos (Lista: %)', 
      v_candidate.display_name, 
      v_candidate.votes,
      v_candidate.list_name;
  END LOOP;
  
END $$;

-- ================================================
-- VERIFICACIÓN ADICIONAL
-- ================================================
-- Ver todos los votos generados para el trending
SELECT 
  c.display_name as candidato,
  c.list_name as lista,
  COUNT(v.voter_user_id) as total_votos,
  COUNT(DISTINCT v.voter_user_id) as votantes_unicos,
  v.round_number as ronda
FROM public.trending_candidates c
LEFT JOIN public.trending_votes v
  ON v.trending_id = c.trending_id
  AND v.candidate_id = c.id
WHERE c.trending_id = 9 -- ⚠️ CAMBIAR: ID del trending
GROUP BY c.id, c.display_name, c.list_name, v.round_number
ORDER BY total_votos DESC, c.list_name, c.display_name;

