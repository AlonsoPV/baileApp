-- ================================================
-- SCRIPT DIRECTO: Cambiar contraseña por UUID
-- ================================================
-- Usuario: 501bdfe7-5568-4411-a666-7b17d21face1
-- ⚠️ CAMBIA 'TuNuevaContraseña123!' POR TU CONTRASEÑA
-- ================================================

-- Habilitar extensión pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verificar usuario antes
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE id = '501bdfe7-5568-4411-a666-7b17d21face1';

-- ACTUALIZAR CONTRASEÑA
-- ⚠️ CAMBIA 'TuNuevaContraseña123!' POR TU CONTRASEÑA DESEADA
UPDATE auth.users
SET 
  encrypted_password = crypt('TuNuevaContraseña123!', gen_salt('bf')),
  updated_at = NOW()
WHERE id = '501bdfe7-5568-4411-a666-7b17d21face1';

-- Verificar después
SELECT 
  id,
  email,
  updated_at,
  CASE 
    WHEN encrypted_password IS NOT NULL THEN '✅ Contraseña actualizada'
    ELSE '❌ Error'
  END as estado
FROM auth.users
WHERE id = '501bdfe7-5568-4411-a666-7b17d21face1';

