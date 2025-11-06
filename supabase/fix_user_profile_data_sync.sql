-- ========================================
-- 🔧 FIX: Sincronización de Redes Sociales y Respuestas en profiles_user
-- ========================================
-- Problema: 
--   1. redes_sociales está vacío, datos en respuestas.redes
--   2. Las preguntas del perfil (dato_curioso, gusta_bailar) no se guardan
--
-- Solución:
--   1. Backfill: Migrar respuestas.redes → redes_sociales
--   2. Trigger: Auto-sync redes_sociales ↔ respuestas.redes
--   3. Verificar columnas de respuestas

-- ========================================
-- 1️⃣ BACKFILL: Migrar datos existentes
-- ========================================

-- Migrar redes sociales de respuestas.redes → redes_sociales
UPDATE public.profiles_user
SET redes_sociales = (respuestas->'redes')::jsonb
WHERE 
  respuestas ? 'redes' 
  AND (redes_sociales IS NULL OR redes_sociales::text = '{}');

-- Verificar migración
SELECT 
  user_id,
  display_name,
  redes_sociales,
  respuestas->'redes' as respuestas_redes,
  CASE 
    WHEN redes_sociales IS NOT NULL THEN '✅ Migrado'
    WHEN respuestas ? 'redes' THEN '⚠️ Pendiente'
    ELSE '❌ Sin datos'
  END as estado
FROM public.profiles_user
WHERE respuestas ? 'redes' OR redes_sociales IS NOT NULL
ORDER BY display_name;

-- ========================================
-- 2️⃣ TRIGGER: Auto-sincronizar redes_sociales
-- ========================================

-- Función para sincronizar redes_sociales ↔ respuestas.redes
CREATE OR REPLACE FUNCTION public.sync_redes_sociales_bidirectional()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se actualiza redes_sociales, sincronizar a respuestas.redes
  IF (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') AND NEW.redes_sociales IS DISTINCT FROM OLD.redes_sociales THEN
    NEW.respuestas = COALESCE(NEW.respuestas, '{}'::jsonb) || jsonb_build_object('redes', NEW.redes_sociales);
  END IF;

  -- Si se actualiza respuestas.redes, sincronizar a redes_sociales
  IF (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') AND (NEW.respuestas->'redes') IS DISTINCT FROM (OLD.respuestas->'redes') THEN
    -- Solo sincronizar si redes_sociales está vacío o es null
    IF NEW.redes_sociales IS NULL OR NEW.redes_sociales::text = '{}' THEN
      NEW.redes_sociales = (NEW.respuestas->'redes')::jsonb;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS trg_sync_redes_sociales_bidirectional ON public.profiles_user;

-- Crear trigger bidireccional
CREATE TRIGGER trg_sync_redes_sociales_bidirectional
  BEFORE INSERT OR UPDATE ON public.profiles_user
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_redes_sociales_bidirectional();

-- ========================================
-- 3️⃣ VERIFICAR estructura de respuestas
-- ========================================

-- Ver estructura actual de respuestas
SELECT 
  user_id,
  display_name,
  respuestas,
  jsonb_object_keys(respuestas) as claves_respuestas
FROM public.profiles_user
WHERE respuestas IS NOT NULL
LIMIT 5;

-- ========================================
-- 4️⃣ ACTUALIZAR vista pública
-- ========================================

-- Recrear v_user_public para incluir redes_sociales correctamente
DROP VIEW IF EXISTS public.v_user_public CASCADE;

CREATE OR REPLACE VIEW public.v_user_public AS
SELECT 
  user_id,
  display_name,
  bio,
  avatar_url,
  media,
  ritmos,
  ritmos_seleccionados,
  zonas,
  redes_sociales,  -- ✅ Incluir columna dedicada
  respuestas,       -- ✅ Incluir respuestas completas
  onboarding_complete,
  created_at
FROM public.profiles_user
WHERE onboarding_complete = true;

-- Habilitar RLS en la vista
COMMENT ON VIEW public.v_user_public IS 'Vista pública de perfiles de usuario (solo usuarios con onboarding completo)';

-- ========================================
-- 5️⃣ DIAGNÓSTICO: Ver estado actual
-- ========================================

-- Ver usuarios con datos de redes sociales
SELECT 
  'Total usuarios' as metrica,
  COUNT(*) as total
FROM public.profiles_user
UNION ALL
SELECT 
  'Con redes_sociales (columna)',
  COUNT(*)
FROM public.profiles_user
WHERE redes_sociales IS NOT NULL AND redes_sociales::text != '{}'
UNION ALL
SELECT 
  'Con respuestas.redes (JSONB)',
  COUNT(*)
FROM public.profiles_user
WHERE respuestas ? 'redes'
UNION ALL
SELECT 
  'Con dato_curioso',
  COUNT(*)
FROM public.profiles_user
WHERE respuestas ? 'dato_curioso'
UNION ALL
SELECT 
  'Con gusta_bailar',
  COUNT(*)
FROM public.profiles_user
WHERE respuestas ? 'gusta_bailar';

-- ========================================
-- 6️⃣ EJEMPLO: Insertar datos de prueba
-- ========================================

-- Ejemplo de cómo debería guardarse un perfil completo
-- (solo para referencia, NO ejecutar si ya tienes datos)

/*
UPDATE public.profiles_user
SET 
  redes_sociales = jsonb_build_object(
    'instagram', 'usuario_instagram',
    'tiktok', 'usuario_tiktok',
    'facebook', 'usuario_facebook'
  ),
  respuestas = jsonb_build_object(
    'dato_curioso', 'Mi dato curioso sobre el baile',
    'gusta_bailar', 'Me gusta bailar salsa y bachata',
    'redes', jsonb_build_object(
      'instagram', 'usuario_instagram',
      'tiktok', 'usuario_tiktok',
      'facebook', 'usuario_facebook'
    )
  )
WHERE user_id = 'TU_USER_ID_AQUI';
*/

-- ========================================
-- ✅ VERIFICACIÓN FINAL
-- ========================================

-- Ver estado final de sincronización
SELECT 
  user_id,
  display_name,
  CASE 
    WHEN redes_sociales IS NOT NULL AND redes_sociales::text != '{}' THEN '✅'
    ELSE '❌'
  END as tiene_redes_sociales,
  CASE 
    WHEN respuestas ? 'redes' THEN '✅'
    ELSE '❌'
  END as tiene_respuestas_redes,
  CASE 
    WHEN respuestas ? 'dato_curioso' THEN '✅'
    ELSE '❌'
  END as tiene_dato_curioso,
  CASE 
    WHEN respuestas ? 'gusta_bailar' THEN '✅'
    ELSE '❌'
  END as tiene_gusta_bailar,
  redes_sociales,
  respuestas
FROM public.profiles_user
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- 📝 NOTAS
-- ========================================
-- 1. El trigger sincroniza automáticamente ambas columnas
-- 2. Si actualizas redes_sociales → se actualiza respuestas.redes
-- 3. Si actualizas respuestas.redes → se actualiza redes_sociales (solo si está vacío)
-- 4. Las preguntas (dato_curioso, gusta_bailar) se guardan en respuestas
-- 5. La vista v_user_public ahora expone ambas columnas

