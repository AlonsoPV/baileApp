-- ============================================================================
-- CORREGIR URLs DE AVATARES EN PRODUCCIÓN
-- ============================================================================
-- Problema: Algunos avatares tienen paths relativos en lugar de URLs completas
-- Solución: Convertir paths a URLs públicas de Supabase Storage
-- ============================================================================

-- IMPORTANTE: Reemplaza [TU-PROYECTO-PROD] con tu URL de Supabase producción
-- Ejemplo: https://abcdefgh.supabase.co

DO $$
DECLARE
    supabase_url text := 'https://[TU-PROYECTO-PROD].supabase.co';
    rec record;
BEGIN
    -- Actualizar avatares que son paths relativos (media/...)
    FOR rec IN 
        SELECT user_id, avatar_url
        FROM public.profiles_user
        WHERE avatar_url IS NOT NULL
          AND avatar_url LIKE 'media/%'
          AND avatar_url NOT LIKE 'https://%'
    LOOP
        UPDATE public.profiles_user
        SET avatar_url = supabase_url || '/storage/v1/object/public/' || rec.avatar_url
        WHERE user_id = rec.user_id;
    END LOOP;
    
    RAISE NOTICE 'Avatares actualizados correctamente';
END $$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver avatares actualizados
SELECT 
    user_id,
    display_name,
    avatar_url,
    CASE 
        WHEN avatar_url LIKE 'https://%' THEN '✅ URL completa'
        ELSE '❌ Formato incorrecto'
    END as estado
FROM public.profiles_user
WHERE avatar_url IS NOT NULL
ORDER BY created_at DESC;

-- Contar por formato
SELECT 
    CASE 
        WHEN avatar_url IS NULL THEN 'Sin avatar'
        WHEN avatar_url LIKE 'https://%' THEN '✅ URL completa'
        ELSE '❌ Formato incorrecto'
    END as formato,
    COUNT(*) as total
FROM public.profiles_user
GROUP BY 
    CASE 
        WHEN avatar_url IS NULL THEN 'Sin avatar'
        WHEN avatar_url LIKE 'https://%' THEN '✅ URL completa'
        ELSE '❌ Formato incorrecto'
    END
ORDER BY formato;

