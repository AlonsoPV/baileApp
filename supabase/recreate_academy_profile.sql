-- Script para recrear el perfil de academia para un usuario específico
-- Usuario: 0c20805f-519c-4e8e-9081-341ab64e504d
-- Ejecutar en Supabase SQL Editor

DO $$
DECLARE
    target_user_id UUID := '0c20805f-519c-4e8e-9081-341ab64e504d';
    user_exists BOOLEAN;
    academy_exists BOOLEAN;
    new_academy_id BIGINT;
BEGIN
    -- 1. Verificar que el usuario existe
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = target_user_id) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE EXCEPTION 'El usuario con ID % no existe en auth.users', target_user_id;
    END IF;
    
    RAISE NOTICE '✅ Usuario encontrado: %', target_user_id;
    
    -- 2. Verificar si ya existe un perfil de academia para este usuario
    SELECT EXISTS(SELECT 1 FROM public.profiles_academy WHERE user_id = target_user_id) INTO academy_exists;
    
    IF academy_exists THEN
        RAISE NOTICE '⚠️  Ya existe un perfil de academia para este usuario. Eliminando el existente...';
        DELETE FROM public.profiles_academy WHERE user_id = target_user_id;
        RAISE NOTICE '✅ Perfil anterior eliminado';
    END IF;
    
    -- 3. Crear el nuevo perfil de academia con valores por defecto
    -- Incluir redes_sociales como objeto vacío para evitar null
    INSERT INTO public.profiles_academy (
        user_id,
        nombre_publico,
        estado_aprobacion,
        redes_sociales
    ) VALUES (
        target_user_id,
        'Mi Academia', -- nombre_publico (requerido)
        'borrador', -- estado_aprobacion
        '{}'::jsonb -- redes_sociales como objeto vacío (no null)
    )
    RETURNING id INTO new_academy_id;
    
    -- Las demás columnas tienen valores por defecto en la tabla
    
    RAISE NOTICE '✅ Perfil de academia creado exitosamente con ID: %', new_academy_id;
    RAISE NOTICE '📋 El usuario puede ahora editar su perfil desde la aplicación';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al crear el perfil de academia: %', SQLERRM;
END $$;

-- 4. Verificar que el perfil fue creado correctamente
SELECT 
    id,
    user_id,
    nombre_publico,
    estado_aprobacion,
    created_at,
    updated_at
FROM public.profiles_academy
WHERE user_id = '0c20805f-519c-4e8e-9081-341ab64e504d';

-- 5. Mostrar mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '🎉 Script ejecutado exitosamente!';
    RAISE NOTICE 'El perfil de academia ha sido recreado para el usuario 0c20805f-519c-4e8e-9081-341ab64e504d';
END $$;

