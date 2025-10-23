-- ============================================
-- MIGRAR: Avatar URL a Slot P1
-- ============================================
-- Este script migra todos los avatares existentes en avatar_url
-- al slot p1 del sistema de media unificado.
-- ============================================

DO $$
DECLARE
    user_record RECORD;
    migrated_count INT := 0;
    skipped_count INT := 0;
    error_count INT := 0;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'INICIANDO MIGRACIÓN DE AVATARES A SLOT P1';
    RAISE NOTICE '==========================================';

    -- Iterar sobre todos los usuarios con avatar_url
    FOR user_record IN 
        SELECT 
            user_id,
            display_name,
            avatar_url,
            media
        FROM public.profiles_user
        WHERE avatar_url IS NOT NULL 
          AND avatar_url != ''
    LOOP
        BEGIN
            -- Verificar si ya existe un slot p1 en media
            IF EXISTS (
                SELECT 1 
                FROM jsonb_array_elements(COALESCE(user_record.media, '[]'::jsonb)) elem
                WHERE elem->>'slot' = 'p1'
            ) THEN
                RAISE NOTICE 'Usuario %: Ya tiene slot p1, omitiendo...', user_record.display_name;
                skipped_count := skipped_count + 1;
                CONTINUE;
            END IF;

            -- Crear el objeto de media para p1
            UPDATE public.profiles_user
            SET media = COALESCE(media, '[]'::jsonb) || jsonb_build_array(
                jsonb_build_object(
                    'slot', 'p1',
                    'kind', 'photo',
                    'url', user_record.avatar_url,
                    'title', 'Avatar Principal'
                )
            )
            WHERE user_id = user_record.user_id;

            RAISE NOTICE 'Usuario %: Avatar migrado exitosamente a slot p1', user_record.display_name;
            migrated_count := migrated_count + 1;

        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR en usuario %: %', user_record.display_name, SQLERRM;
            error_count := error_count + 1;
        END;
    END LOOP;

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'RESUMEN DE MIGRACIÓN:';
    RAISE NOTICE '✅ Migrados exitosamente: %', migrated_count;
    RAISE NOTICE '⏭️ Omitidos (ya tenían p1): %', skipped_count;
    RAISE NOTICE '❌ Errores: %', error_count;
    RAISE NOTICE '==========================================';

    -- Opcional: Limpiar el campo avatar_url después de la migración
    -- Descomenta estas líneas si quieres limpiar avatar_url después de migrar
    /*
    UPDATE public.profiles_user
    SET avatar_url = NULL
    WHERE avatar_url IS NOT NULL 
      AND avatar_url != ''
      AND EXISTS (
          SELECT 1 
          FROM jsonb_array_elements(COALESCE(media, '[]'::jsonb)) elem
          WHERE elem->>'slot' = 'p1'
      );
    
    RAISE NOTICE '🧹 Campo avatar_url limpiado para usuarios migrados';
    */

END $$;

-- ============================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================

-- Ver usuarios con slot p1
SELECT 
    user_id,
    display_name,
    avatar_url,
    (
        SELECT elem->>'url'
        FROM jsonb_array_elements(COALESCE(media, '[]'::jsonb)) elem
        WHERE elem->>'slot' = 'p1'
        LIMIT 1
    ) as p1_url,
    jsonb_array_length(COALESCE(media, '[]'::jsonb)) as total_media
FROM public.profiles_user
WHERE EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(COALESCE(media, '[]'::jsonb)) elem
    WHERE elem->>'slot' = 'p1'
)
ORDER BY display_name;

-- Estadísticas generales
DO $$
DECLARE
    total_users INT;
    users_with_avatar_url INT;
    users_with_p1 INT;
    users_pending_migration INT;
BEGIN
    SELECT COUNT(*) INTO total_users FROM public.profiles_user;
    
    SELECT COUNT(*) INTO users_with_avatar_url 
    FROM public.profiles_user 
    WHERE avatar_url IS NOT NULL AND avatar_url != '';
    
    SELECT COUNT(*) INTO users_with_p1 
    FROM public.profiles_user 
    WHERE EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(COALESCE(media, '[]'::jsonb)) elem
        WHERE elem->>'slot' = 'p1'
    );
    
    SELECT COUNT(*) INTO users_pending_migration 
    FROM public.profiles_user 
    WHERE (avatar_url IS NOT NULL AND avatar_url != '')
      AND NOT EXISTS (
          SELECT 1 
          FROM jsonb_array_elements(COALESCE(media, '[]'::jsonb)) elem
          WHERE elem->>'slot' = 'p1'
      );

    RAISE NOTICE '==========================================';
    RAISE NOTICE 'ESTADÍSTICAS GENERALES:';
    RAISE NOTICE 'Total de usuarios: %', total_users;
    RAISE NOTICE 'Usuarios con avatar_url: %', users_with_avatar_url;
    RAISE NOTICE 'Usuarios con slot p1: %', users_with_p1;
    RAISE NOTICE 'Pendientes de migrar: %', users_pending_migration;
    RAISE NOTICE '==========================================';
END $$;
