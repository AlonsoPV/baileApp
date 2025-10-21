-- Script 5: Trigger para evitar media = null accidental
-- Ejecutar en Supabase SQL Editor

-- Si algún update manda media = null sin querer, preserva el valor anterior
CREATE OR REPLACE FUNCTION keep_media_on_null()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.media IS NULL THEN
    NEW.media := OLD.media;
  END IF;
  RETURN NEW;
END;
$$;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS trg_profiles_user_keep_media ON public.profiles_user;

-- Crear trigger
CREATE TRIGGER trg_profiles_user_keep_media
  BEFORE UPDATE ON public.profiles_user
  FOR EACH ROW 
  EXECUTE FUNCTION keep_media_on_null();

-- Verificar que el trigger se creó correctamente
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'trg_profiles_user_keep_media';
