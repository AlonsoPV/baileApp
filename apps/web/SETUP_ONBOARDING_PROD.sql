-- ============================================================================
-- CONFIGURAR SISTEMA DE ONBOARDING EN PRODUCCIÓN
-- ============================================================================
-- Sistema de onboarding con flag de completado y PIN de seguridad
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. AGREGAR COLUMNAS DE ONBOARDING (SI NO EXISTEN)
-- ============================================================================

-- Columna para marcar si el usuario completó el onboarding
ALTER TABLE public.profiles_user
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Columna para almacenar el hash del PIN (seguridad de sesión)
ALTER TABLE public.profiles_user
ADD COLUMN IF NOT EXISTS pin_hash text;

-- Columna para timestamp de última verificación de PIN
ALTER TABLE public.profiles_user
ADD COLUMN IF NOT EXISTS pin_verified_at timestamptz;

-- ============================================================================
-- 2. ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_onboarding 
ON public.profiles_user(onboarding_completed);

CREATE INDEX IF NOT EXISTS idx_profiles_user_pin_verified 
ON public.profiles_user(pin_verified_at);

-- ============================================================================
-- 3. FUNCIÓN PARA COMPLETAR ONBOARDING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.complete_user_onboarding(
    p_user_id uuid,
    p_display_name text,
    p_ritmos integer[],
    p_zonas integer[],
    p_pin_hash text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- Validar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM public.profiles_user WHERE user_id = p_user_id) THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;

    -- Actualizar perfil con datos de onboarding
    UPDATE public.profiles_user
    SET 
        display_name = p_display_name,
        ritmos = p_ritmos,
        zonas = p_zonas,
        pin_hash = COALESCE(p_pin_hash, pin_hash),
        onboarding_completed = true,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Retornar resultado
    SELECT jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'onboarding_completed', true
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. FUNCIÓN PARA VERIFICAR PIN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_user_pin(
    p_user_id uuid,
    p_pin_hash text
)
RETURNS jsonb AS $$
DECLARE
    v_stored_hash text;
    v_result jsonb;
BEGIN
    -- Obtener hash almacenado
    SELECT pin_hash INTO v_stored_hash
    FROM public.profiles_user
    WHERE user_id = p_user_id;

    -- Verificar si coincide
    IF v_stored_hash = p_pin_hash THEN
        -- Actualizar timestamp de verificación
        UPDATE public.profiles_user
        SET pin_verified_at = now()
        WHERE user_id = p_user_id;

        SELECT jsonb_build_object(
            'success', true,
            'verified', true
        ) INTO v_result;
    ELSE
        SELECT jsonb_build_object(
            'success', false,
            'verified', false,
            'error', 'PIN incorrecto'
        ) INTO v_result;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. FUNCIÓN PARA ACTUALIZAR PIN
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_user_pin(
    p_user_id uuid,
    p_new_pin_hash text
)
RETURNS jsonb AS $$
BEGIN
    -- Validar que el usuario existe
    IF NOT EXISTS (SELECT 1 FROM public.profiles_user WHERE user_id = p_user_id) THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;

    -- Actualizar PIN
    UPDATE public.profiles_user
    SET 
        pin_hash = p_new_pin_hash,
        pin_verified_at = now(),
        updated_at = now()
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'PIN actualizado correctamente'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. TRIGGER PARA AUTO-CREAR PERFIL DE USUARIO
-- ============================================================================

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles_user (user_id, email, onboarding_completed)
    VALUES (NEW.id, NEW.email, false)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en auth.users (si tienes acceso)
-- Nota: Este trigger puede requerir permisos especiales
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 7. GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.complete_user_onboarding(uuid, text, integer[], integer[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_user_pin(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_pin(uuid, text) TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver columnas de onboarding
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_user'
  AND column_name IN ('onboarding_completed', 'pin_hash', 'pin_verified_at')
ORDER BY column_name;

-- Ver funciones de onboarding
SELECT proname, proargnames
FROM pg_proc
WHERE proname IN ('complete_user_onboarding', 'verify_user_pin', 'update_user_pin', 'handle_new_user')
ORDER BY proname;

-- Ver triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Estadísticas de onboarding
SELECT 
    onboarding_completed,
    COUNT(*) as total_usuarios
FROM public.profiles_user
GROUP BY onboarding_completed
ORDER BY onboarding_completed;

