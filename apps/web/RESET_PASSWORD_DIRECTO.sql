-- Script DIRECTO para resetear contraseña
-- ⚠️ REEMPLAZA 'tu_email@ejemplo.com' con tu email real
-- ⚠️ REEMPLAZA 'NuevaContraseña123!' con tu nueva contraseña

-- 1. Verificar usuario existente
SELECT 
  'Usuario encontrado' as info,
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'alpeva96@gmail.com';

-- 2. Actualizar contraseña directamente
UPDATE auth.users 
SET 
  encrypted_password = crypt('NuevaContraseña123!', gen_salt('bf')),
  updated_at = now(),
  email_confirmed_at = now()
WHERE email = 'alpeva96@gmail.com';

-- 3. Verificar el cambio
SELECT 
  'Contraseña actualizada' as info,
  id,
  email,
  updated_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'alpeva96@gmail.com';

-- 4. Si el usuario no existe, crear uno nuevo (solo si no existe)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) 
SELECT 
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'alpeva96@gmail.com',
  crypt('NuevaContraseña123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'alpeva96@gmail.com'
);
