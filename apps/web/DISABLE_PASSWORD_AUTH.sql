-- Script para deshabilitar autenticación por contraseña
-- y habilitar solo Magic Link (email sin contraseña)

-- 1. Verificar configuración actual de autenticación
SELECT 
  'Configuración actual' as info,
  key,
  value
FROM auth.config 
WHERE key IN ('DISABLE_SIGNUP', 'ENABLE_SIGNUP', 'ENABLE_EMAIL_CONFIRMATIONS', 'ENABLE_EMAIL_AUTOCONFIRM');

-- 2. Habilitar Magic Link (email sin contraseña)
-- Esto permite que los usuarios se registren e inicien sesión solo con email
UPDATE auth.config 
SET value = 'false'
WHERE key = 'DISABLE_SIGNUP';

UPDATE auth.config 
SET value = 'true'
WHERE key = 'ENABLE_SIGNUP';

UPDATE auth.config 
SET value = 'true'
WHERE key = 'ENABLE_EMAIL_CONFIRMATIONS';

UPDATE auth.config 
SET value = 'true'
WHERE key = 'ENABLE_EMAIL_AUTOCONFIRM';

-- 3. Verificar la nueva configuración
SELECT 
  'Nueva configuración' as info,
  key,
  value
FROM auth.config 
WHERE key IN ('DISABLE_SIGNUP', 'ENABLE_SIGNUP', 'ENABLE_EMAIL_CONFIRMATIONS', 'ENABLE_EMAIL_AUTOCONFIRM');

-- 4. Opcional: Limpiar contraseñas existentes (solo si quieres forzar magic link)
-- UPDATE auth.users 
-- SET encrypted_password = NULL
-- WHERE email IS NOT NULL;
