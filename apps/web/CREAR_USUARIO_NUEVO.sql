-- Script para crear un usuario completamente nuevo
-- ⚠️ REEMPLAZA con tus datos reales

-- 1. Crear usuario en auth.users
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
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'tu_nuevo_email@ejemplo.com',
  crypt('TuNuevaContraseña123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- 2. Crear perfil de usuario asociado
INSERT INTO profiles_user (
  user_id,
  display_name,
  bio,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'tu_nuevo_email@ejemplo.com'),
  'Tu Nombre',
  'Tu biografía',
  now(),
  now()
);

-- 3. Verificar que se creó correctamente
SELECT 
  'Usuario creado' as info,
  u.id,
  u.email,
  u.email_confirmed_at,
  p.display_name
FROM auth.users u
LEFT JOIN profiles_user p ON p.user_id = u.id
WHERE u.email = 'tu_nuevo_email@ejemplo.com';
