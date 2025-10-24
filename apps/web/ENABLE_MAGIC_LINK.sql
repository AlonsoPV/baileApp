-- Script para habilitar Magic Link
-- Este script NO modifica auth.config (que no existe)
-- Solo verifica la configuración actual

-- 1. Verificar usuarios existentes
SELECT 
  'Usuarios existentes' as info,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as usuarios_confirmados,
  COUNT(CASE WHEN encrypted_password IS NOT NULL THEN 1 END) as usuarios_con_contraseña
FROM auth.users;

-- 2. Verificar configuración de RLS en auth.users
SELECT 
  'Políticas RLS en auth.users' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'users';

-- 3. Mostrar usuarios con email confirmado (listos para Magic Link)
SELECT 
  'Usuarios listos para Magic Link' as info,
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
