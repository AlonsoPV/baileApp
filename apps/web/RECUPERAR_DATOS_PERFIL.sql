-- =====================================================
-- SCRIPT DE RECUPERACIÓN: Datos de Perfil
-- =====================================================
-- Use este script para verificar y recuperar datos perdidos
-- =====================================================

-- 1) VERIFICAR TU PERFIL ACTUAL
-- Reemplaza 'TU-USER-ID-AQUI' con tu user_id real
SELECT 
  user_id,
  display_name,
  bio,
  avatar_url,
  ritmos,
  zonas,
  media,
  redes_sociales,
  onboarding_complete
FROM profiles_user 
WHERE user_id = 'TU-USER-ID-AQUI';

-- Si todo está en null o vacío, continúa con el paso 2

-- =====================================================
-- 2) BUSCAR VERSIONES ANTERIORES (si tienes backups)
-- =====================================================

-- Supabase no tiene versionado automático, pero si hiciste backups:
-- Ve a: Dashboard → Database → Backups

-- =====================================================
-- 3) RESTAURAR MANUALMENTE (si recuerdas tus datos)
-- =====================================================

-- Reemplaza con tus datos reales:
UPDATE profiles_user
SET 
  display_name = 'Tu Nombre',
  bio = 'Tu Bio',
  ritmos = ARRAY[1, 2, 3], -- IDs de ritmos que bailas
  zonas = ARRAY[4, 5],     -- IDs de zonas
  redes_sociales = '{
    "instagram": "@tuusuario",
    "facebook": "",
    "whatsapp": "+521234567890"
  }'::jsonb
WHERE user_id = 'TU-USER-ID-AQUI';

-- =====================================================
-- 4) VERIFICAR QUE SE APLICÓ
-- =====================================================

SELECT 
  display_name,
  bio,
  ritmos,
  zonas,
  redes_sociales
FROM profiles_user 
WHERE user_id = 'TU-USER-ID-AQUI';

-- =====================================================
-- 5) PREVENIR FUTURAS PÉRDIDAS
-- =====================================================

-- A) Activar Point-in-Time Recovery (PITR) en Supabase
-- Ve a: Dashboard → Database → Backups → Enable PITR
-- Esto te permite restaurar la BD a cualquier punto en el tiempo

-- B) Verificar que el trigger de protección de media esté activo
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles_user'
  AND trigger_name = 'trg_profiles_user_keep_media';

-- Debería mostrar:
-- trigger_name: trg_profiles_user_keep_media
-- event_manipulation: UPDATE
-- action_statement: EXECUTE FUNCTION keep_media_on_null()

-- =====================================================
-- 6) VERIFICAR LA FUNCIÓN RPC
-- =====================================================

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'merge_profiles_user';

-- Debería mostrar:
-- routine_name: merge_profiles_user
-- routine_type: FUNCTION

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

