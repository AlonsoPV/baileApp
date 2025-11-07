-- ============================================================================
-- CORREGIR rpc_trending_vote PARA QUE FUNCIONE COMO TOGGLE
-- ============================================================================
-- Problema: La función solo inserta votos, no los elimina (toggle)
-- Solución: Hacer que elimine el voto si ya existe, o lo inserte si no existe
-- ============================================================================

BEGIN;

-- Eliminar función existente
DROP FUNCTION IF EXISTS public.rpc_trending_vote(bigint, bigint);

-- Recrear función con lógica de toggle
CREATE OR REPLACE FUNCTION public.rpc_trending_vote(
    p_trending_id bigint,
    p_candidate_id bigint
)
RETURNS void AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Debes estar autenticado para votar';
    END IF;

    -- Toggle: Si ya existe el voto, eliminarlo; si no existe, insertarlo
    IF EXISTS (
        SELECT 1 FROM public.trending_votes
        WHERE trending_id = p_trending_id
          AND candidate_id = p_candidate_id
          AND voter_user_id = auth.uid()
    ) THEN
        -- Ya votó, eliminar voto
        DELETE FROM public.trending_votes
        WHERE trending_id = p_trending_id
          AND candidate_id = p_candidate_id
          AND voter_user_id = auth.uid();
    ELSE
        -- No ha votado, insertar voto
        INSERT INTO public.trending_votes (trending_id, candidate_id, voter_user_id)
        VALUES (p_trending_id, p_candidate_id, auth.uid());
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant
GRANT EXECUTE ON FUNCTION public.rpc_trending_vote(bigint, bigint) TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver que la función se creó correctamente
SELECT 
    proname,
    proargnames,
    prosrc
FROM pg_proc
WHERE proname = 'rpc_trending_vote';

-- Probar el toggle (reemplaza con IDs reales)
-- SELECT public.rpc_trending_vote(1, 1); -- Primera vez: inserta
-- SELECT public.rpc_trending_vote(1, 1); -- Segunda vez: elimina
-- SELECT public.rpc_trending_vote(1, 1); -- Tercera vez: inserta de nuevo

