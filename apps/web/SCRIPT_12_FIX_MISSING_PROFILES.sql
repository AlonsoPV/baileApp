-- SCRIPT_12_FIX_MISSING_PROFILES.sql
-- Crea perfiles faltantes para usuarios que ya existen en auth.users
-- pero no tienen registro en profiles_user

-- EJECUTAR ESTE SCRIPT SOLO SI:
-- 1. Ya ejecutaste SCRIPT_11_AUTO_CREATE_USER_PROFILE.sql
-- 2. Tienes usuarios que se registraron ANTES del trigger
-- 3. Estás viendo errores de "perfil no encontrado"

-- 1. Crear perfiles para todos los usuarios que no tienen uno
INSERT INTO public.profiles_user (user_id, email, onboarding_complete, created_at)
SELECT 
    au.id AS user_id,
    au.email AS email,  -- Incluir email del usuario
    false AS onboarding_complete,  -- Necesitan completar onboarding
    au.created_at
FROM 
    auth.users au
LEFT JOIN 
    public.profiles_user pu ON au.id = pu.user_id
WHERE 
    pu.user_id IS NULL  -- Solo usuarios sin perfil
ON CONFLICT (user_id) DO NOTHING;  -- Si ya existe, no hacer nada

-- 2. Mostrar cuántos perfiles se crearon
DO $$
DECLARE
    usuarios_sin_perfil INT;
    total_usuarios INT;
BEGIN
    -- Contar usuarios sin perfil ANTES de la corrección
    SELECT COUNT(*) INTO total_usuarios FROM auth.users;
    
    -- Contar perfiles existentes
    SELECT COUNT(*) INTO usuarios_sin_perfil FROM profiles_user;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total de usuarios en auth.users: %', total_usuarios;
    RAISE NOTICE 'Total de perfiles en profiles_user: %', usuarios_sin_perfil;
    
    IF total_usuarios = usuarios_sin_perfil THEN
        RAISE NOTICE '✅ TODOS LOS USUARIOS TIENEN PERFIL';
    ELSE
        RAISE NOTICE '⚠️ Diferencia: % usuarios sin perfil', (total_usuarios - usuarios_sin_perfil);
    END IF;
    RAISE NOTICE '==========================================';
END $$;

-- 3. Verificar los perfiles recién creados
SELECT 
    pu.user_id,
    au.email,
    pu.display_name,
    pu.onboarding_complete,
    pu.created_at
FROM 
    public.profiles_user pu
JOIN 
    auth.users au ON pu.user_id = au.id
WHERE 
    pu.display_name IS NULL  -- Perfiles sin completar
ORDER BY 
    pu.created_at DESC
LIMIT 10;

-- 4. Comentario final
COMMENT ON TABLE public.profiles_user IS 
'Tabla de perfiles de usuario. Los perfiles se crean automáticamente al registrarse gracias al trigger on_auth_user_created';

