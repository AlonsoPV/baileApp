-- ========================================
-- 🗑️ SCRIPT PARA BORRAR RESERVAS DE CLASES
-- ========================================
-- Este script elimina todas las reservas tentativas de clases
-- para una academia específica

-- IMPORTANTE: Reemplaza ACADEMY_ID con el ID real de tu academia
-- ========================================

DO $$
DECLARE
  v_academy_id BIGINT := 15; -- ⚠️ CAMBIAR: Poner el ID real de tu academia aquí
  v_deleted_count INT := 0;
BEGIN
  -- Verificar que se haya configurado el academy_id
  IF v_academy_id IS NULL THEN
    RAISE EXCEPTION '⚠️ ERROR: Debes configurar v_academy_id con el ID real de tu academia';
  END IF;

  -- Verificar que la academia existe
  IF NOT EXISTS (SELECT 1 FROM profiles_academy WHERE id = v_academy_id) THEN
    RAISE EXCEPTION '⚠️ ERROR: No se encontró la academia con ID %', v_academy_id;
  END IF;

  RAISE NOTICE '🗑️ Iniciando eliminación de reservas tentativas...';
  RAISE NOTICE '   Academia ID: %', v_academy_id;
  
  -- Contar reservas antes de eliminar
  SELECT COUNT(*) INTO v_deleted_count
  FROM clase_asistencias
  WHERE academy_id = v_academy_id
    AND status = 'tentative';
  
  RAISE NOTICE '   Reservas encontradas: %', v_deleted_count;
  
  IF v_deleted_count = 0 THEN
    RAISE NOTICE '   ℹ️ No hay reservas para eliminar';
  ELSE
    -- Eliminar reservas
    DELETE FROM clase_asistencias
    WHERE academy_id = v_academy_id
      AND status = 'tentative';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Eliminación completada: % reservas eliminadas', v_deleted_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Verificación:';
  SELECT COUNT(*) INTO v_deleted_count
  FROM clase_asistencias
  WHERE academy_id = v_academy_id
    AND status = 'tentative';
  
  RAISE NOTICE '   Reservas restantes: %', v_deleted_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Script completado exitosamente!';

END $$;

-- ========================================
-- VERIFICACIÓN
-- ========================================
-- Verificar que se eliminaron las reservas
SELECT 
  '📋 VERIFICACIÓN POST-ELIMINACIÓN' as info;

-- Ver cuántas reservas quedan (reemplaza 15 con tu academy_id)
SELECT 
  COUNT(*) as reservas_restantes
FROM clase_asistencias 
WHERE academy_id = 15 -- ⚠️ Reemplazar con tu ID
  AND status = 'tentative';

