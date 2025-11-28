-- ================================================
-- SCRIPT: Cambiar contraseña de usuario por UUID
-- ================================================
-- Usuario: 501bdfe7-5568-4411-a666-7b17d21face1
-- ⚠️ IMPORTANTE: Cambia 'TuNuevaContraseña123!' por la contraseña deseada
-- ================================================

-- Habilitar extensión pgcrypto si no está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Verificar que el usuario existe
DO $$
DECLARE
  v_user_id UUID := '501bdfe7-5568-4411-a666-7b17d21face1';
  v_user_email TEXT;
  v_user_exists BOOLEAN;
BEGIN
  -- Verificar existencia
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = v_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'Usuario con ID % no encontrado', v_user_id;
  END IF;
  
  -- Obtener email del usuario
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ Usuario encontrado';
  RAISE NOTICE '   ID: %', v_user_id;
  RAISE NOTICE '   Email: %', v_user_email;
END $$;

-- 2. Mostrar información del usuario antes del cambio
SELECT 
  'ANTES DEL CAMBIO' as info,
  id,
  email,
  created_at,
  updated_at,
  email_confirmed_at,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN 'Tiene contraseña'
    ELSE 'Sin contraseña'
  END as estado_contraseña
FROM auth.users
WHERE id = '501bdfe7-5568-4411-a666-7b17d21face1';

-- 3. Actualizar la contraseña
-- ⚠️ CAMBIA 'TuNuevaContraseña123!' POR LA CONTRASEÑA DESEADA
UPDATE auth.users
SET 
  encrypted_password = crypt('TuNuevaContraseña123!', gen_salt('bf')),
  updated_at = NOW()
WHERE id = '501bdfe7-5568-4411-a666-7b17d21face1';

-- 4. Verificar el resultado después del cambio
SELECT 
  'DESPUÉS DEL CAMBIO' as info,
  id,
  email,
  updated_at,
  email_confirmed_at,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Contraseña actualizada correctamente'
    ELSE '❌ Error: No se pudo actualizar la contraseña'
  END as estado
FROM auth.users
WHERE id = '501bdfe7-5568-4411-a666-7b17d21face1';

-- ================================================
-- OPCIÓN ALTERNATIVA: Usar función con validación
-- ================================================
CREATE OR REPLACE FUNCTION change_user_password_by_uuid(
  p_user_id UUID,
  p_new_password TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_email TEXT;
  v_user_exists BOOLEAN;
BEGIN
  -- Verificar que el usuario existe
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'Usuario con ID % no encontrado', p_user_id;
  END IF;
  
  -- Obtener email del usuario
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  -- Validar que la contraseña no esté vacía
  IF p_new_password IS NULL OR LENGTH(TRIM(p_new_password)) = 0 THEN
    RAISE EXCEPTION 'La contraseña no puede estar vacía';
  END IF;
  
  -- Validar longitud mínima de contraseña (6 caracteres, como Supabase)
  IF LENGTH(p_new_password) < 6 THEN
    RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
  END IF;
  
  -- Actualizar la contraseña
  UPDATE auth.users
  SET 
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN '✅ Contraseña actualizada correctamente para usuario: ' || v_user_email || ' (ID: ' || p_user_id || ')';
END;
$$;

-- Ejecutar la función (descomenta y cambia la contraseña)
-- SELECT change_user_password_by_uuid('501bdfe7-5568-4411-a666-7b17d21face1'::uuid, 'TuNuevaContraseña123!');

-- ================================================
-- NOTAS IMPORTANTES:
-- ================================================
-- 1. Este script requiere permisos de administrador en Supabase
-- 2. La contraseña se hashea con bcrypt usando crypt() y gen_salt('bf')
-- 3. La forma MÁS SEGURA es usar el Dashboard de Supabase:
--    - Ve a Authentication > Users
--    - Busca el usuario por ID o email
--    - Haz clic en "..." > "Reset Password"
-- 4. O usa la Management API de Supabase:
--    curl -X PUT 'https://your-project.supabase.co/auth/v1/admin/users/501bdfe7-5568-4411-a666-7b17d21face1' \
--      -H "apikey: YOUR_SERVICE_ROLE_KEY" \
--      -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
--      -H "Content-Type: application/json" \
--      -d '{"password": "nueva_contraseña"}'
-- ================================================

