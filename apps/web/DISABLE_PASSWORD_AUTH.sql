-- ========================================
-- CONFIGURACIÓN DE MAGIC LINK
-- ========================================
-- 
-- ⚠️ IMPORTANTE: La configuración de autenticación ya NO se hace por SQL.
-- auth.config ya no existe en versiones recientes de Supabase.
--
-- 📋 INSTRUCCIONES PARA HABILITAR MAGIC LINK:
--
-- 1. Ve a Supabase Dashboard
-- 2. Authentication > Providers > Email
-- 3. Configurar:
--    ✅ Enable Email provider
--    ✅ Confirm email
--    ✅ Enable Magic Link (también llamado "Email OTP")
--    
-- 4. Opcional - Si solo quieres Magic Link (sin contraseñas):
--    Authentication > Providers > Email
--    ❌ Disable "Enable Email & Password"
--    ✅ Solo dejar habilitado "Enable Magic Link"
--
-- 5. Configurar Email Templates (opcional):
--    Authentication > Email Templates
--    - Personalizar plantilla de "Magic Link"
--
-- ========================================

-- Verificar usuarios que pueden usar Magic Link
SELECT 
  'Usuarios con email (listos para Magic Link)' as info,
  COUNT(*) as total_usuarios_con_email,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as emails_confirmados,
  COUNT(CASE WHEN encrypted_password IS NULL THEN 1 END) as usuarios_solo_magic_link
FROM auth.users
WHERE email IS NOT NULL;

-- Mostrar últimos usuarios
SELECT 
  'Últimos 10 usuarios' as info,
  id,
  email,
  email_confirmed_at,
  CASE WHEN encrypted_password IS NULL THEN 'Solo Magic Link' ELSE 'Con contraseña' END as tipo_auth,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
