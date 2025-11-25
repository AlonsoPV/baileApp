-- ================================================
-- MIGRACIÓN: Actualizar PK de trending_votes para incluir round_number
-- ================================================
-- Esto permite que un usuario vote por el mismo candidato
-- en diferentes rondas, pero solo una vez por ronda
-- ================================================

-- 1. Eliminar la clave primaria actual
ALTER TABLE IF EXISTS public.trending_votes
  DROP CONSTRAINT IF EXISTS trending_votes_pkey;

-- 2. Crear nueva clave primaria que incluya round_number
ALTER TABLE IF EXISTS public.trending_votes
  ADD CONSTRAINT trending_votes_pkey 
  PRIMARY KEY (trending_id, candidate_id, voter_user_id, round_number);

-- 3. Actualizar el script de emulación de votos para usar el nuevo constraint
-- (El script ya está actualizado para incluir round_number en el INSERT)

COMMENT ON CONSTRAINT trending_votes_pkey ON public.trending_votes IS 
  'Clave primaria que incluye round_number para permitir votos por ronda. Un usuario puede votar por el mismo candidato en diferentes rondas, pero solo una vez por ronda.';

