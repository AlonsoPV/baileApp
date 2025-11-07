-- ============================================================================
-- UNIFICAR COLUMNAS DE ONBOARDING EN PRODUCCIÓN
-- ============================================================================
-- Problema: Existen dos columnas (onboarding_complete y onboarding_completed)
-- Solución: Sincronizar ambas y usar solo una en el futuro
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: DIAGNÓSTICO
-- ============================================================================

-- Ver estado actual de ambas columnas
SELECT 
    onboarding_complete,
    onboarding_completed,
    COUNT(*) as total_usuarios
FROM public.profiles_user
GROUP BY onboarding_complete, onboarding_completed
ORDER BY onboarding_complete, onboarding_completed;

-- ============================================================================
-- PASO 2: SINCRONIZAR COLUMNAS
-- ============================================================================

-- Opción A: Copiar onboarding_complete → onboarding_completed
-- (Si onboarding_complete es la columna "buena")
UPDATE public.profiles_user
SET onboarding_completed = COALESCE(onboarding_complete, false)
WHERE onboarding_completed IS NULL 
   OR onboarding_completed != COALESCE(onboarding_complete, false);

-- Opción B: Copiar onboarding_completed → onboarding_complete
-- (Si onboarding_completed es la columna "buena")
UPDATE public.profiles_user
SET onboarding_complete = COALESCE(onboarding_completed, false)
WHERE onboarding_complete IS NULL 
   OR onboarding_complete != COALESCE(onboarding_completed, false);

-- ============================================================================
-- PASO 3: CREAR TRIGGER PARA MANTENER SINCRONIZADAS
-- ============================================================================

-- Función para sincronizar automáticamente ambas columnas
CREATE OR REPLACE FUNCTION public.sync_onboarding_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Si cambia onboarding_completed, actualizar onboarding_complete
    IF NEW.onboarding_completed IS DISTINCT FROM OLD.onboarding_completed THEN
        NEW.onboarding_complete = NEW.onboarding_completed;
    END IF;
    
    -- Si cambia onboarding_complete, actualizar onboarding_completed
    IF NEW.onboarding_complete IS DISTINCT FROM OLD.onboarding_complete THEN
        NEW.onboarding_completed = NEW.onboarding_complete;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trg_sync_onboarding ON public.profiles_user;
CREATE TRIGGER trg_sync_onboarding
    BEFORE UPDATE ON public.profiles_user
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_onboarding_columns();

COMMIT;

-- ============================================================================
-- PASO 4: ACTUALIZAR VISTA v_user_public
-- ============================================================================

-- Recrear vista para usar ambas columnas en el filtro
DROP VIEW IF EXISTS public.v_user_public CASCADE;

CREATE VIEW public.v_user_public AS
SELECT
    user_id,
    display_name,
    bio,
    avatar_url,
    media,
    ritmos,
    ritmos_seleccionados,
    zonas,
    redes_sociales,
    email,
    created_at,
    updated_at,
    onboarding_complete,
    onboarding_completed,
    pin_hash,
    pin_verified_at,
    premios,
    respuestas,
    rsvp_events
FROM public.profiles_user
WHERE (onboarding_completed = true OR onboarding_complete = true)
  AND display_name IS NOT NULL
  AND display_name != '';

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Ver que ambas columnas están sincronizadas
SELECT 
    onboarding_complete,
    onboarding_completed,
    COUNT(*) as total_usuarios
FROM public.profiles_user
GROUP BY onboarding_complete, onboarding_completed
ORDER BY onboarding_complete, onboarding_completed;

-- Contar usuarios en la vista pública
SELECT COUNT(*) as usuarios_en_vista_publica
FROM public.v_user_public;

-- Ver usuarios en la vista
SELECT 
    user_id,
    display_name,
    onboarding_complete,
    onboarding_completed,
    array_length(ritmos, 1) as cant_ritmos,
    array_length(zonas, 1) as cant_zonas
FROM public.v_user_public
LIMIT 10;

-- Ver usuarios que NO están en la vista (para debug)
SELECT 
    user_id,
    display_name,
    onboarding_complete,
    onboarding_completed,
    display_name IS NULL as sin_nombre,
    display_name = '' as nombre_vacio
FROM public.profiles_user
WHERE NOT (
    (onboarding_completed = true OR onboarding_complete = true)
    AND display_name IS NOT NULL
    AND display_name != ''
)
LIMIT 10;

