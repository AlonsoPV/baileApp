-- ================================================
-- SCRIPT SIMPLE: Cambiar contraseña de usuario por UUID
-- ================================================
-- Usuario: 501bdfe7-5568-4411-a666-7b17d21face1
-- ⚠️ IMPORTANTE: Cambia 'TuNuevaContraseña123!' por la contraseña deseada
-- ================================================

-- Habilitar extensión pgcrypto si no está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Verificar que el usuario existe y mostrar información
SELECT 
  'VERIFICACIÓN' as info,
  id,
  email,
  created_at,
  updated_at,
  email_confirmed_at,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN 'Tiene contraseña'
    ELSE 'Sin contraseña'
  END as estado_contraseña
FROM auth.users
WHERE id = '501bdfe7-5568-4411-a666-7b17d21face1';

-- 2. Actualizar la contraseña
-- ⚠️ CAMBIA 'TuNuevaContraseña123!' POR LA CONTRASEÑA DESEADA
UPDATE auth.users
SET 
  encrypted_password = crypt('TuNuevaContraseña123!', gen_salt('bf')),
  updated_at = NOW()
WHERE id = '501bdfe7-5568-4411-a666-7b17d21face1';

-- 3. Verificar el resultado después del cambio
SELECT 
  'RESULTADO' as info,
  id,
  email,
  updated_at,
  email_confirmed_at,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Contraseña actualizada correctamente'
    ELSE '❌ Error: No se pudo actualizar la contraseña'
  END as estado
FROM auth.users
WHERE id = '501bdfe7-5568-4411-a666-7b17d21face1';

-- ================================================
-- NOTAS:
-- ================================================
-- 1. Este script requiere permisos de administrador en Supabase
-- 2. La contraseña se hashea con bcrypt usando crypt() y gen_salt('bf')
-- 3. La contraseña debe tener al menos 6 caracteres
-- 4. Ejecuta este script completo en el SQL Editor de Supabase
-- ================================================

