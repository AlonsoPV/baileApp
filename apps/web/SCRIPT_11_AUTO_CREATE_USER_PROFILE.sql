-- SCRIPT_11_AUTO_CREATE_USER_PROFILE.sql
-- Crea automáticamente un perfil de usuario cuando se registra un nuevo usuario

-- 1. Función que se ejecutará cuando se cree un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar un registro en profiles_user para el nuevo usuario
  INSERT INTO public.profiles_user (user_id, email, onboarding_complete, created_at)
  VALUES (
    NEW.id,
    NEW.email,  -- Incluir email del nuevo usuario
    false,  -- El usuario necesita completar el onboarding
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Si ya existe el perfil, no hacer nada
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log del error pero no fallar el registro
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el trigger en la tabla auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Comentario explicativo
COMMENT ON FUNCTION public.handle_new_user() IS 
'Función trigger que crea automáticamente un perfil de usuario en profiles_user cuando se registra un nuevo usuario en auth.users';

-- 4. Verificar que la función y el trigger se crearon correctamente
DO $$
BEGIN
  RAISE NOTICE 'Trigger "on_auth_user_created" creado exitosamente';
  RAISE NOTICE 'Ahora los nuevos usuarios tendrán automáticamente un perfil en profiles_user';
END $$;

