-- ================================================
-- SCRIPT: Actualizar contraseña de usuario
-- ================================================
-- Este script actualiza la contraseña de un usuario
-- por su correo electrónico: alpeva96@gmail.com
-- ================================================
-- IMPORTANTE: 
-- 1. Cambia 'TuNuevaContraseña123!' por la contraseña deseada
-- 2. Este script requiere permisos de superadmin
-- 3. La forma más segura es usar el Dashboard de Supabase
-- ================================================

-- Verificar que el usuario existe
DO $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT := 'alpeva96@gmail.com';
BEGIN
  -- Buscar el usuario por email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_user_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email % no encontrado', v_user_email;
  END IF;
  
  RAISE NOTICE 'Usuario encontrado: %', v_user_id;
  RAISE NOTICE 'Email: %', v_user_email;
END $$;

-- ================================================
-- OPCIÓN 1: Usar Dashboard de Supabase (RECOMENDADO)
-- ================================================
-- 1. Ve a Authentication > Users
-- 2. Busca el usuario alpeva96@gmail.com
-- 3. Haz clic en "..." > "Reset Password"
-- 4. Se enviará un email de reset al usuario

-- ================================================
-- OPCIÓN 2: Actualizar directamente (SOLO DESARROLLO)
-- ================================================
-- ADVERTENCIA: Esto solo funciona si tienes acceso directo a auth.users
-- y permisos de service_role. En producción, usa la Opción 1.

-- Primero, habilita la extensión pgcrypto si no está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Función para actualizar contraseña
CREATE OR REPLACE FUNCTION admin_update_user_password(
  p_email TEXT,
  p_new_password TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar que el usuario sea superadmin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN auth.users u ON u.id = ur.user_id
    WHERE u.id = auth.uid() AND ur.role_slug = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Solo superadmin puede actualizar contraseñas';
  END IF;
  
  -- Buscar el usuario por email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email % no encontrado', p_email;
  END IF;
  
  -- Actualizar la contraseña
  -- Nota: Supabase usa un formato específico para las contraseñas
  -- En producción, es mejor usar la API de Supabase Auth
  UPDATE auth.users
  SET 
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = v_user_id;
  
  RETURN 'Contraseña actualizada para usuario: ' || p_email;
END;
$$;

-- Ejecutar la función para actualizar la contraseña
-- ⚠️ IMPORTANTE: Cambia 'TuNuevaContraseña123!' por la contraseña deseada
SELECT admin_update_user_password('alpeva96@gmail.com', 'TuNuevaContraseña123!');

-- ================================================
-- OPCIÓN 3: Usar Supabase Management API (RECOMENDADO PARA PRODUCCIÓN)
-- ================================================
-- Usa la API de Supabase para actualizar la contraseña:
-- 
-- curl -X PUT 'https://your-project.supabase.co/auth/v1/admin/users/{user_id}' \
--   -H "apikey: YOUR_SERVICE_ROLE_KEY" \
--   -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
--   -H "Content-Type: application/json" \
--   -d '{"password": "nueva_contraseña"}'

-- ================================================
-- NOTAS IMPORTANTES:
-- ================================================
-- 1. Las contraseñas en Supabase se almacenan hasheadas con bcrypt
-- 2. La forma MÁS SEGURA es usar el Dashboard de Supabase (Opción 1)
-- 3. Este script requiere permisos de superadmin
-- 4. Si usas este script, asegúrate de cambiar la contraseña después de la primera sesión
-- 5. Para producción, usa la Management API de Supabase (Opción 3)

