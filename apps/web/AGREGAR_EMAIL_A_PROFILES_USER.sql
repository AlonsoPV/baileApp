-- ============================================
-- AGREGAR EMAIL A PROFILES_USER
-- Script para agregar campo email a la tabla profiles_user
-- ============================================

-- 1) Agregar columna email a profiles_user
ALTER TABLE public.profiles_user 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2) Poblar el campo email con datos de auth.users
UPDATE public.profiles_user 
SET email = au.email
FROM auth.users au
WHERE profiles_user.user_id = au.id
  AND profiles_user.email IS NULL;

-- 3) Hacer el campo email único (opcional, pero recomendado)
ALTER TABLE public.profiles_user 
ADD CONSTRAINT unique_email UNIQUE (email);

-- 4) Verificar que se pobló correctamente
SELECT 
    pu.user_id,
    pu.email,
    pu.display_name,
    au.email as auth_email,
    CASE 
        WHEN pu.email = au.email THEN '✅ Coincide'
        ELSE '❌ No coincide'
    END as verificacion
FROM public.profiles_user pu
LEFT JOIN auth.users au ON pu.user_id = au.id
ORDER BY pu.created_at DESC;

-- 5) Mostrar estadísticas
SELECT 
    COUNT(*) as total_perfiles,
    COUNT(email) as perfiles_con_email,
    COUNT(*) - COUNT(email) as perfiles_sin_email
FROM public.profiles_user;

-- 6) Crear índice para búsquedas por email (opcional)
CREATE INDEX IF NOT EXISTS idx_profiles_user_email 
ON public.profiles_user (email);

-- 7) Función para mantener sincronizado el email
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar email en profiles_user cuando cambie en auth.users
  UPDATE public.profiles_user 
  SET email = NEW.email
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8) Trigger para mantener sincronizado el email
DROP TRIGGER IF EXISTS sync_email_trigger ON auth.users;
CREATE TRIGGER sync_email_trigger
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_email();

-- 9) Comentario en la columna
COMMENT ON COLUMN public.profiles_user.email IS 
'Email del usuario, sincronizado automáticamente con auth.users.email';

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Verificar que todo está correcto
DO $$
DECLARE
    total_perfiles INT;
    perfiles_con_email INT;
    usuarios_auth INT;
BEGIN
    SELECT COUNT(*) INTO total_perfiles FROM public.profiles_user;
    SELECT COUNT(*) INTO perfiles_con_email FROM public.profiles_user WHERE email IS NOT NULL;
    SELECT COUNT(*) INTO usuarios_auth FROM auth.users;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total perfiles: %', total_perfiles;
    RAISE NOTICE 'Perfiles con email: %', perfiles_con_email;
    RAISE NOTICE 'Usuarios en auth.users: %', usuarios_auth;
    
    IF perfiles_con_email = total_perfiles THEN
        RAISE NOTICE '✅ TODOS LOS PERFILES TIENEN EMAIL';
    ELSE
        RAISE NOTICE '⚠️ % perfiles sin email', (total_perfiles - perfiles_con_email);
    END IF;
    RAISE NOTICE '==========================================';
END $$;
