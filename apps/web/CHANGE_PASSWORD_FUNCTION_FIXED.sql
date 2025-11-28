-- ================================================
-- FUNCIÓN CORREGIDA: Cambiar contraseña por UUID
-- ================================================
-- Esta función se puede usar después de crearla
-- ================================================

-- Habilitar extensión pgcrypto si no está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear o reemplazar la función con tipos explícitos
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

-- Ejecutar la función (cambia la contraseña)
-- IMPORTANTE: Ejecuta primero la función CREATE OR REPLACE de arriba,
-- luego ejecuta esta línea con la contraseña deseada:
SELECT change_user_password_by_uuid(
  '501bdfe7-5568-4411-a666-7b17d21face1'::uuid, 
  'TuNuevaContraseña123!'::text
);

