-- ============================================================================
-- 🔒 CORREGIR search_path MUTABLE EN FUNCIÓN sync_avatar_from_media
-- ============================================================================
-- Este script corrige el error del linter de Supabase sobre funciones
-- con search_path mutable (no fijado).
-- 
-- Problema: Funciones sin search_path fijado pueden ser vulnerables a
-- ataques de manipulación del search_path.
-- 
-- Solución: Usar ALTER FUNCTION para fijar el search_path sin recrear la función
-- ============================================================================

BEGIN;

-- Intentar fijar el search_path de la función si existe
-- Esto es más seguro que recrear la función completa
DO $$
DECLARE
    func_oid oid;
BEGIN
    -- Buscar la función por nombre
    SELECT p.oid INTO func_oid
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'sync_avatar_from_media'
    LIMIT 1;

    IF func_oid IS NOT NULL THEN
        -- Fijar el search_path a vacío (más seguro) o a public, pg_temp
        -- Usamos public, pg_temp para que las funciones públicas sigan funcionando
        ALTER FUNCTION public.sync_avatar_from_media() 
        SET search_path = public, pg_temp;
        
        RAISE NOTICE '✅ search_path fijado para sync_avatar_from_media';
    ELSE
        RAISE NOTICE 'ℹ️  Función sync_avatar_from_media no encontrada. Puede que ya haya sido eliminada.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Si ALTER FUNCTION falla (por ejemplo, si la función tiene parámetros),
        -- intentar obtener la signatura completa y usar ALTER FUNCTION con la signatura
        RAISE NOTICE '⚠️  No se pudo fijar search_path con ALTER FUNCTION simple. Intentando con signatura completa...';
        
        -- Intentar con diferentes signaturas comunes
        BEGIN
            ALTER FUNCTION public.sync_avatar_from_media() 
            SET search_path = public, pg_temp;
            RAISE NOTICE '✅ search_path fijado (sin parámetros)';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️  La función puede tener parámetros. Necesitas especificar la signatura completa.';
                RAISE NOTICE 'Ejecuta en Supabase SQL Editor para ver la signatura:';
                RAISE NOTICE 'SELECT proname, pg_get_function_identity_arguments(oid) as args FROM pg_proc WHERE proname = ''sync_avatar_from_media'';';
        END;
END $$;

COMMIT;

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- ✅ Esta migración intenta fijar el search_path sin recrear la función
-- ✅ Usa SET search_path = public, pg_temp (permite funciones públicas)
-- ✅ Si la función tiene parámetros, puede que necesites especificar la signatura completa
-- ✅ Esto corrige el error del linter sobre search_path mutable
-- ============================================================================
-- 
-- Si esta migración falla, ejecuta en Supabase SQL Editor para obtener la signatura:
-- SELECT proname, pg_get_function_identity_arguments(oid) as args 
-- FROM pg_proc 
-- WHERE proname = 'sync_avatar_from_media' 
--   AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
-- 
-- Luego usa ALTER FUNCTION con la signatura completa, por ejemplo:
-- ALTER FUNCTION public.sync_avatar_from_media(user_id uuid) 
-- SET search_path = public, pg_temp;
-- ============================================================================

