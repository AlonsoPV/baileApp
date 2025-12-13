-- ============================================================================
-- 🗑️ ELIMINAR RSVPs DE CLASES DE ACADEMIA ID 15
-- ============================================================================
-- Este script elimina todos los registros de RSVP (asistencias tentativas)
-- para las clases de la academia con id = 15
-- ============================================================================

BEGIN;

-- Verificar cuántos registros se van a eliminar antes de borrar
DO $$
DECLARE
  total_registros integer;
BEGIN
  SELECT COUNT(*) INTO total_registros
  FROM public.clase_asistencias
  WHERE academy_id = 15;
  
  RAISE NOTICE '📊 Total de RSVPs a eliminar para academia 15: %', total_registros;
  
  IF total_registros = 0 THEN
    RAISE NOTICE 'ℹ️  No hay RSVPs para eliminar para la academia 15';
  END IF;
END $$;

-- Eliminar todos los RSVPs de clases de la academia 15
DELETE FROM public.clase_asistencias
WHERE academy_id = 15;

-- Verificar que se eliminaron correctamente
DO $$
DECLARE
  registros_restantes integer;
BEGIN
  SELECT COUNT(*) INTO registros_restantes
  FROM public.clase_asistencias
  WHERE academy_id = 15;
  
  IF registros_restantes = 0 THEN
    RAISE NOTICE '✅ Todos los RSVPs de la academia 15 han sido eliminados correctamente';
  ELSE
    RAISE WARNING '⚠️  Aún quedan % registros para la academia 15', registros_restantes;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Mostrar resumen de RSVPs restantes por academia (para verificar)
SELECT 
  academy_id,
  COUNT(*) as total_rsvps,
  COUNT(DISTINCT user_id) as usuarios_unicos,
  COUNT(DISTINCT class_id) as clases_unicas
FROM public.clase_asistencias
WHERE academy_id IS NOT NULL
GROUP BY academy_id
ORDER BY academy_id;

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- ✅ Se eliminaron todos los registros de clase_asistencias donde academy_id = 15
-- ✅ Esto incluye todas las asistencias tentativas a clases de esa academia
-- ✅ Los registros se eliminan permanentemente (no hay soft delete)
-- ✅ Las métricas de la academia se actualizarán automáticamente al recalcular
-- ============================================================================

