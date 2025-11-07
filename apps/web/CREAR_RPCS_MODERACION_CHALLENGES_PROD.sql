-- ============================================================================
-- CREAR RPCs DE MODERACIÓN DE CHALLENGES EN PRODUCCIÓN
-- ============================================================================
-- Funciones para aprobar/rechazar submissions
-- ============================================================================

BEGIN;

-- 1. Eliminar TODAS las versiones de las funciones existentes
DROP FUNCTION IF EXISTS public.challenge_approve_submission(bigint);
DROP FUNCTION IF EXISTS public.challenge_approve_submission(uuid);
DROP FUNCTION IF EXISTS public.challenge_approve_submission(uuid, text);
DROP FUNCTION IF EXISTS public.challenge_approve_submission(bigint, text);
DROP FUNCTION IF EXISTS public.challenge_reject_submission(bigint);
DROP FUNCTION IF EXISTS public.challenge_reject_submission(uuid);
DROP FUNCTION IF EXISTS public.challenge_reject_submission(uuid, text);
DROP FUNCTION IF EXISTS public.challenge_reject_submission(bigint, text);

-- 2. Crear función para aprobar submission (usando UUID)
CREATE OR REPLACE FUNCTION public.challenge_approve_submission(p_submission_id uuid)
RETURNS void AS $$
BEGIN
  -- Verificar permisos: superadmin O owner del challenge
  IF NOT (
    public.is_superadmin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.challenge_submissions s
      JOIN public.challenges c ON c.id = s.challenge_id
      WHERE s.id = p_submission_id AND c.owner_id = auth.uid()
    )
  ) THEN 
    RAISE EXCEPTION 'No tienes permisos para aprobar esta submission';
  END IF;
  
  -- Aprobar submission
  UPDATE public.challenge_submissions 
  SET status = 'approved',
      updated_at = now()
  WHERE id = p_submission_id;
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear función para rechazar submission (usando UUID)
CREATE OR REPLACE FUNCTION public.challenge_reject_submission(p_submission_id uuid)
RETURNS void AS $$
BEGIN
  -- Verificar permisos: superadmin O owner del challenge
  IF NOT (
    public.is_superadmin(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.challenge_submissions s
      JOIN public.challenges c ON c.id = s.challenge_id
      WHERE s.id = p_submission_id AND c.owner_id = auth.uid()
    )
  ) THEN 
    RAISE EXCEPTION 'No tienes permisos para rechazar esta submission';
  END IF;
  
  -- Rechazar submission
  UPDATE public.challenge_submissions 
  SET status = 'rejected',
      updated_at = now()
  WHERE id = p_submission_id;
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grants
GRANT EXECUTE ON FUNCTION public.challenge_approve_submission(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.challenge_reject_submission(uuid) TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver que las funciones se crearon
SELECT 
    proname,
    proargnames
FROM pg_proc
WHERE proname IN (
    'challenge_approve_submission',
    'challenge_reject_submission'
)
ORDER BY proname;

-- Probar que is_superadmin funciona
SELECT public.is_superadmin('0c20805f-519c-4e8e-9081-341ab64e504d') as soy_superadmin;
-- Debe retornar: true

