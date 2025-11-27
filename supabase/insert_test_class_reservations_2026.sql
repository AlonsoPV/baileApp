-- ========================================
-- 📝 SCRIPT PARA INSERTAR RESERVAS TENTATIVAS DE PRUEBA
-- ========================================
-- Fecha de referencia: 26 de noviembre de 2026, 11:40 AM
-- Este script inserta reservas tentativas con fechas realistas
-- basadas en la fecha actual

-- IMPORTANTE: Reemplaza ACADEMY_ID con el ID real de tu academia
-- ========================================
-- INSTRUCCIONES:
-- 1. Reemplaza v_academy_id con el ID real de tu academia (línea 21)
-- 2. Ejecuta este script en Supabase SQL Editor
-- ========================================

DO $$
DECLARE
  v_academy_id BIGINT := 15; -- ⚠️ CAMBIAR: Poner el ID real de la academia aquí
  v_class_ids BIGINT[] := ARRAY[
    17630664842505942,  -- Bachata Tradicional
    17630664842509348,  -- Bachata Moderna
    17630664842505916,  -- Bachata
    17630664842503890,  -- Salsa On 1 y Salsa On 2
    17630664842508124,  -- Bachata Partner Work (Martes)
    17630664842504376,  -- Salsa On 1
    17630664842506504   -- Bachata Partner Work (Jueves)
  ];
  v_user_ids UUID[] := ARRAY[
    '0c20805f-519c-4e8e-9081-341ab64e504d'::UUID,
    '6dc3ee23-0811-4953-968e-9a80cf743125'::UUID,
    '29a34274-50bf-4c72-b845-4204a4d3d517'::UUID,
    '7a044697-5ece-4cd0-9d81-8e1fddf13b05'::UUID,
    '4a3695ce-5e07-440b-950d-cdcfb3c4d88c'::UUID,
    '97a366b0-b1f3-4b85-8069-cb4fea828dda'::UUID,
    '6eccf8b5-da3b-43e4-b1fe-057869881ca9'::UUID
  ];
  v_zona_tag_id BIGINT := 8;
  v_total_inserted INT := 0;
  v_row_count INT;
  v_user_index INT;
  v_user_exists INT;
  v_current_date DATE := '2026-11-26'::DATE; -- Fecha de referencia: 26 de noviembre de 2026
  v_current_datetime TIMESTAMPTZ := '2026-11-26 11:40:00'::TIMESTAMPTZ;
BEGIN
  -- Verificar que se haya configurado el academy_id
  IF v_academy_id IS NULL THEN
    RAISE EXCEPTION '⚠️ ERROR: Debes configurar v_academy_id con el ID real de tu academia';
  END IF;

  -- Verificar que la academia existe
  IF NOT EXISTS (SELECT 1 FROM profiles_academy WHERE id = v_academy_id) THEN
    RAISE EXCEPTION '⚠️ ERROR: No se encontró la academia con ID %', v_academy_id;
  END IF;

  RAISE NOTICE '🚀 Iniciando inserción de reservas tentativas...';
  RAISE NOTICE '   Academia ID: %', v_academy_id;
  RAISE NOTICE '   Fecha de referencia: %', v_current_date;
  RAISE NOTICE '   Clases: %', array_length(v_class_ids, 1);
  RAISE NOTICE '   Usuarios: %', array_length(v_user_ids, 1);
  RAISE NOTICE '';

  -- Verificar que los usuarios existan en auth.users
  RAISE NOTICE '🔍 Verificando usuarios...';
  FOR v_user_index IN 1..array_length(v_user_ids, 1) LOOP
    SELECT COUNT(*) INTO v_user_exists
    FROM auth.users
    WHERE id = v_user_ids[v_user_index];
    
    IF v_user_exists = 0 THEN
      RAISE WARNING '⚠️ Usuario no encontrado en auth.users: %', v_user_ids[v_user_index];
    ELSE
      RAISE NOTICE '   ✅ Usuario % existe', v_user_index;
    END IF;
  END LOOP;
  RAISE NOTICE '';

  -- ========================================
  -- BACHATA TRADICIONAL (Miércoles - día 3)
  -- ========================================
  -- Usuario 1: Miércoles 27 de noviembre de 2026
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[1],
      v_class_ids[1],
      v_academy_id,
      'leader',
      v_zona_tag_id,
      'tentative',
      '2026-11-27'::DATE, -- Miércoles siguiente
      v_current_datetime - INTERVAL '2 days'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 1 -> Bachata Tradicional (Miércoles 27-nov)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
  END;

  -- Usuario 2: Miércoles 4 de diciembre de 2026
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[2],
      v_class_ids[1],
      v_academy_id,
      'follower',
      v_zona_tag_id,
      'tentative',
      '2026-12-04'::DATE, -- Miércoles siguiente
      v_current_datetime - INTERVAL '1 day'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 2 -> Bachata Tradicional (Miércoles 4-dic)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
  END;

  -- ========================================
  -- BACHATA MODERNA (Martes - día 2)
  -- ========================================
  -- Usuario 3: Martes 1 de diciembre de 2026
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[3],
      v_class_ids[2],
      v_academy_id,
      'ambos',
      v_zona_tag_id,
      'tentative',
      '2026-12-01'::DATE, -- Martes
      v_current_datetime - INTERVAL '3 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 3 -> Bachata Moderna (Martes 1-dic)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
  END;

  -- Usuario 4: Martes 8 de diciembre de 2026
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[4],
      v_class_ids[2],
      v_academy_id,
      'leader',
      v_zona_tag_id,
      'tentative',
      '2026-12-08'::DATE, -- Martes siguiente
      v_current_datetime - INTERVAL '5 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 4 -> Bachata Moderna (Martes 8-dic)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
  END;

  -- ========================================
  -- BACHATA (Sin día específico - clase general)
  -- ========================================
  -- Usuario 5: Sin fecha específica (clase recurrente sin fecha seleccionada)
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[5],
      v_class_ids[3],
      v_academy_id,
      'follower',
      v_zona_tag_id,
      'tentative',
      NULL, -- Sin fecha específica
      v_current_datetime - INTERVAL '1 hour'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 5 -> Bachata (Sin fecha específica)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
  END;

  -- ========================================
  -- SALSA ON 1 Y SALSA ON 2 (Jueves - día 4)
  -- ========================================
  -- Usuario 6: Jueves 28 de noviembre de 2026
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[6],
      v_class_ids[4],
      v_academy_id,
      'ambos',
      v_zona_tag_id,
      'tentative',
      '2026-11-28'::DATE, -- Jueves
      v_current_datetime - INTERVAL '30 minutes'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 6 -> Salsa On 1 y Salsa On 2 (Jueves 28-nov)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
  END;

  -- Usuario 7: Jueves 5 de diciembre de 2026
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[7],
      v_class_ids[4],
      v_academy_id,
      'leader',
      v_zona_tag_id,
      'tentative',
      '2026-12-05'::DATE, -- Jueves siguiente
      v_current_datetime - INTERVAL '15 minutes'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 7 -> Salsa On 1 y Salsa On 2 (Jueves 5-dic)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
  END;

  -- ========================================
  -- BACHATA PARTNER WORK (Martes - día 2)
  -- ========================================
  -- Usuario 1 también: Martes 1 de diciembre de 2026
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[1],
      v_class_ids[5],
      v_academy_id,
      'follower',
      v_zona_tag_id,
      'tentative',
      '2026-12-01'::DATE, -- Martes
      v_current_datetime - INTERVAL '4 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 1 -> Bachata Partner Work (Martes 1-dic)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
  END;

  -- Usuario 2 también: Martes 8 de diciembre de 2026
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[2],
      v_class_ids[5],
      v_academy_id,
      'leader',
      v_zona_tag_id,
      'tentative',
      '2026-12-08'::DATE, -- Martes siguiente
      v_current_datetime - INTERVAL '6 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 2 -> Bachata Partner Work (Martes 8-dic)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
  END;

  -- ========================================
  -- SALSA ON 1 (Lunes - día 1)
  -- ========================================
  -- Usuario 3 también: Lunes 30 de noviembre de 2026
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[3],
      v_class_ids[6],
      v_academy_id,
      'follower',
      v_zona_tag_id,
      'tentative',
      '2026-11-30'::DATE, -- Lunes
      v_current_datetime - INTERVAL '8 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 3 -> Salsa On 1 (Lunes 30-nov)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
  END;

  -- Usuario 4 también: Lunes 7 de diciembre de 2026
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[4],
      v_class_ids[6],
      v_academy_id,
      'ambos',
      v_zona_tag_id,
      'tentative',
      '2026-12-07'::DATE, -- Lunes siguiente
      v_current_datetime - INTERVAL '10 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 4 -> Salsa On 1 (Lunes 7-dic)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
  END;

  -- ========================================
  -- BACHATA PARTNER WORK (Jueves - día 4)
  -- ========================================
  -- Usuario 5 también: Jueves 3 de diciembre de 2026
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[5],
      v_class_ids[7],
      v_academy_id,
      'leader',
      v_zona_tag_id,
      'tentative',
      '2026-12-03'::DATE, -- Jueves
      v_current_datetime - INTERVAL '12 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 5 -> Bachata Partner Work (Jueves 3-dic)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
  END;

  -- Usuario 6 también: Jueves 10 de diciembre de 2026
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[6],
      v_class_ids[7],
      v_academy_id,
      'follower',
      v_zona_tag_id,
      'tentative',
      '2026-12-10'::DATE, -- Jueves siguiente
      v_current_datetime - INTERVAL '14 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 6 -> Bachata Partner Work (Jueves 10-dic)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
  END;

  -- Usuario 7 también: Miércoles 2 de diciembre de 2026 (Bachata Tradicional)
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[7],
      v_class_ids[1],
      v_academy_id,
      'ambos',
      v_zona_tag_id,
      'tentative',
      '2026-12-02'::DATE, -- Miércoles siguiente
      v_current_datetime - INTERVAL '16 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 7 -> Bachata Tradicional (Miércoles 2-dic)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
  END;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Inserción completada: % reservas nuevas insertadas', v_total_inserted;
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumen de reservas por clase:';
  
  -- Mostrar resumen
  DECLARE
    v_class_index INT;
    v_count INT;
    v_class_name TEXT;
  BEGIN
    FOR v_class_index IN 1..array_length(v_class_ids, 1) LOOP
      SELECT COUNT(*) INTO v_count
      FROM clase_asistencias
      WHERE class_id = v_class_ids[v_class_index]
        AND academy_id = v_academy_id
        AND status = 'tentative';
      
      -- Intentar obtener el nombre de la clase desde el cronograma
      SELECT clase->>'titulo' INTO v_class_name
      FROM profiles_academy,
           jsonb_array_elements(cronograma) AS clase
      WHERE id = v_academy_id
        AND (clase->>'id')::BIGINT = v_class_ids[v_class_index]
      LIMIT 1;
      
      IF v_class_name IS NULL THEN
        v_class_name := 'Clase #' || v_class_ids[v_class_index];
      END IF;
      
      RAISE NOTICE '   %: % reservas', v_class_name, v_count;
    END LOOP;
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumen por rol:';
  RAISE NOTICE '   Leader: %', (SELECT COUNT(*) FROM clase_asistencias WHERE academy_id = v_academy_id AND role_baile IN ('leader', 'lead') AND status = 'tentative');
  RAISE NOTICE '   Follower: %', (SELECT COUNT(*) FROM clase_asistencias WHERE academy_id = v_academy_id AND role_baile IN ('follower', 'follow') AND status = 'tentative');
  RAISE NOTICE '   Ambos: %', (SELECT COUNT(*) FROM clase_asistencias WHERE academy_id = v_academy_id AND role_baile = 'ambos' AND status = 'tentative');
  RAISE NOTICE '';
  RAISE NOTICE '📅 Resumen por fecha:';
  RAISE NOTICE '';
  
  -- Mostrar resumen por fecha
  DECLARE
    v_fecha_record RECORD;
  BEGIN
    FOR v_fecha_record IN 
      SELECT fecha_especifica, COUNT(*) as cnt
      FROM clase_asistencias
      WHERE academy_id = v_academy_id
        AND status = 'tentative'
        AND fecha_especifica IS NOT NULL
      GROUP BY fecha_especifica
      ORDER BY fecha_especifica
    LOOP
      RAISE NOTICE '   %: % reservas', v_fecha_record.fecha_especifica, v_fecha_record.cnt;
    END LOOP;
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Script completado exitosamente!';

END $$;

-- ========================================
-- VERIFICACIÓN
-- ========================================
-- Ejecutar después del script para verificar las reservas insertadas

SELECT 
  '📋 RESUMEN DE RESERVAS INSERTADAS' as info;

-- Verificar reservas (reemplaza 15 con tu academy_id)
SELECT 
  ca.class_id,
  ca.user_id,
  pu.display_name as nombre_usuario,
  ca.role_baile,
  ca.fecha_especifica,
  ca.zona_tag_id,
  ca.status,
  ca.created_at
FROM clase_asistencias ca
LEFT JOIN profiles_user pu ON pu.user_id = ca.user_id
WHERE ca.academy_id = 15 -- ⚠️ Reemplazar con tu ID
  AND ca.status = 'tentative'
ORDER BY ca.fecha_especifica NULLS LAST, ca.created_at DESC;

