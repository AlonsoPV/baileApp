-- ============================================
-- SCRIPT 7: ONBOARDING FLAG
-- BaileApp - Arreglar loop de onboarding
-- ============================================

-- NOTA: Este script se ejecuta en el SQL Editor de Supabase
-- Asegúrate de tener permisos de administrador

-- ============================================
-- 1. AGREGAR COLUMNA ONBOARDING_COMPLETE
-- ============================================

-- Agregar columna onboarding_complete a profiles_user
ALTER TABLE public.profiles_user
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. BACKFILL - MARCAR COMO COMPLETO SI YA TIENE DATOS
-- ============================================

-- Marca como completo si ya tiene datos mínimos
UPDATE public.profiles_user
SET onboarding_complete = TRUE
WHERE COALESCE(display_name,'') <> ''
  AND COALESCE(array_length(ritmos,1),0) > 0
  AND COALESCE(array_length(zonas,1),0) > 0;

-- ============================================
-- 3. VERIFICACIÓN
-- ============================================

-- Verificar columna agregada
SELECT 'Column added:' as info, 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles_user' 
  AND column_name = 'onboarding_complete';

-- Verificar cuántos usuarios están marcados como completos
SELECT 'Users with complete onboarding:' as info, 
  COUNT(*) as count
FROM public.profiles_user 
WHERE onboarding_complete = TRUE;

-- Verificar cuántos usuarios están marcados como incompletos
SELECT 'Users with incomplete onboarding:' as info, 
  COUNT(*) as count
FROM public.profiles_user 
WHERE onboarding_complete = FALSE;

-- Mostrar algunos ejemplos
SELECT 'Sample profiles:' as info,
  user_id,
  display_name,
  array_length(ritmos,1) as ritmos_count,
  array_length(zonas,1) as zonas_count,
  onboarding_complete
FROM public.profiles_user
ORDER BY created_at DESC
LIMIT 5;
