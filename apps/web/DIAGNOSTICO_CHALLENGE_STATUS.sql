-- DIAGNÓSTICO: Estado del Challenge y Transiciones Permitidas

-- ================================================
-- 1. Ver todos los challenges y sus estados
-- ================================================
SELECT 
  id,
  title,
  status,
  owner_id,
  approved_by,
  approved_at,
  created_at,
  CASE 
    WHEN owner_id = auth.uid() THEN 'Sí (eres el dueño)'
    ELSE 'No'
  END as eres_dueno,
  CASE 
    WHEN status IN ('draft', 'rejected', 'submitted') THEN 'Sí - Puedes publicar'
    WHEN status = 'open' THEN 'No - Ya está abierto'
    WHEN status = 'closed' THEN 'No - Ya está cerrado'
    WHEN status = 'archived' THEN 'No - Está archivado'
    ELSE 'Estado desconocido'
  END as puede_publicar
FROM public.challenges
ORDER BY created_at DESC
LIMIT 10;

-- ================================================
-- 2. Ver el estado de un challenge específico
-- ================================================
-- Reemplaza el ID con el ID real de tu challenge
DO $$
DECLARE
  v_challenge_id bigint := 1;  -- <-- CAMBIA ESTE NÚMERO
  v_status text;
  v_owner_id uuid;
  v_current_user uuid;
  v_can_publish boolean;
BEGIN
  -- Obtener usuario actual
  v_current_user := auth.uid();
  
  -- Obtener datos del challenge
  SELECT status, owner_id 
  INTO v_status, v_owner_id
  FROM public.challenges
  WHERE id = v_challenge_id;
  
  IF v_status IS NULL THEN
    RAISE NOTICE 'Challenge % no encontrado', v_challenge_id;
    RETURN;
  END IF;
  
  -- Verificar si puede publicar
  v_can_publish := (
    v_status IN ('draft', 'rejected', 'submitted')
    AND (
      v_owner_id = v_current_user
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = v_current_user
        AND ur.role_slug = 'superadmin'
      )
    )
  );
  
  RAISE NOTICE '=== DIAGNÓSTICO DEL CHALLENGE % ===', v_challenge_id;
  RAISE NOTICE 'Estado actual: %', v_status;
  RAISE NOTICE 'Eres el dueño: %', (v_owner_id = v_current_user);
  RAISE NOTICE 'Puedes publicar: %', v_can_publish;
  
  IF NOT v_can_publish THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ NO PUEDES PUBLICAR porque:';
    IF v_status NOT IN ('draft', 'rejected', 'submitted') THEN
      RAISE NOTICE '   - El estado es "%" (debe ser draft, rejected o submitted)', v_status;
    END IF;
    IF v_owner_id != v_current_user THEN
      RAISE NOTICE '   - No eres el dueño del challenge';
    END IF;
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ PUEDES PUBLICAR este challenge';
  END IF;
END $$;

-- ================================================
-- 3. Transiciones de estado permitidas
-- ================================================
/*
Estados posibles:
  - draft      → Borrador inicial
  - submitted  → Enviado para revisión (no usado actualmente)
  - rejected   → Rechazado por admin (no usado actualmente)
  - open       → Abierto y aceptando participaciones
  - closed     → Cerrado, no acepta más participaciones
  - archived   → Archivado

Transiciones permitidas con challenge_publish:
  - draft → open ✅
  - rejected → open ✅
  - submitted → open ✅
  
Transiciones NO permitidas:
  - open → open ❌ (ya está abierto)
  - closed → open ❌ (necesitas función específica)
  - archived → open ❌ (necesitas función específica)
*/

-- ================================================
-- 4. SOLUCIÓN: Cambiar estado manualmente (SOLO SI ES NECESARIO)
-- ================================================
-- Si tu challenge está en un estado incorrecto y necesitas cambiarlo:

-- Opción A: Cambiar de cualquier estado a 'draft' para poder publicar después
/*
UPDATE public.challenges
SET status = 'draft'
WHERE id = 1  -- <-- CAMBIA ESTE ID
  AND owner_id = auth.uid();  -- Solo si eres el dueño

-- Luego podrás usar challenge_publish normalmente
*/

-- Opción B: Publicar directamente (solo si eres dueño o superadmin)
/*
UPDATE public.challenges
SET 
  status = 'open',
  approved_by = auth.uid(),
  approved_at = now()
WHERE id = 1  -- <-- CAMBIA ESTE ID
  AND (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_slug = 'superadmin'
    )
  );
*/

-- Opción C: Reabrir un challenge cerrado
/*
UPDATE public.challenges
SET status = 'open'
WHERE id = 1  -- <-- CAMBIA ESTE ID
  AND status = 'closed'
  AND (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_slug = 'superadmin'
    )
  );
*/

-- ================================================
-- 5. Verificar el resultado
-- ================================================
SELECT 
  id,
  title,
  status,
  approved_by,
  approved_at,
  updated_at
FROM public.challenges
ORDER BY updated_at DESC
LIMIT 5;

