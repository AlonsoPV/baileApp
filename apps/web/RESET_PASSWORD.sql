-- Script para resetear contraseña de usuario en Supabase
-- ⚠️ IMPORTANTE: Reemplaza 'tu_email@ejemplo.com' con tu email real

-- 1. Verificar si el usuario existe
SELECT 
  'Verificando usuario' as info,
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'tu_email@ejemplo.com';

-- 2. Actualizar contraseña (reemplaza 'nueva_contraseña_segura' con tu contraseña deseada)
-- NOTA: La contraseña debe ser hasheada con bcrypt
UPDATE auth.users 
SET 
  encrypted_password = crypt('nueva_contraseña_segura', gen_salt('bf')),
  updated_at = now()
WHERE email = 'tu_email@ejemplo.com';

-- 3. Verificar el cambio
SELECT 
  'Contraseña actualizada' as info,
  id,
  email,
  updated_at
FROM auth.users 
WHERE email = 'tu_email@ejemplo.com';

-- 4. Opcional: Confirmar email si no está confirmado
UPDATE auth.users 
SET 
  email_confirmed_at = now(),
  updated_at = now()
WHERE email = 'tu_email@ejemplo.com' 
  AND email_confirmed_at IS NULL;
