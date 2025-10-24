-- Script SIMPLE para resetear contraseña
-- Email: alpeva96@gmail.com
-- Nueva contraseña: NuevaContraseña123!

-- 1. Verificar si el usuario existe
SELECT 
  'Verificando usuario' as info,
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'alpeva96@gmail.com';

-- 2. Actualizar contraseña (solo si el usuario existe)
UPDATE auth.users 
SET 
  encrypted_password = crypt('NuevaContraseña123!', gen_salt('bf')),
  updated_at = now(),
  email_confirmed_at = now()
WHERE email = 'alpeva96@gmail.com';

-- 3. Verificar el resultado
SELECT 
  'Resultado final' as info,
  id,
  email,
  updated_at,
  email_confirmed_at,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN 'Contraseña actualizada'
    ELSE 'Usuario no encontrado'
  END as estado
FROM auth.users 
WHERE email = 'alpeva96@gmail.com';
