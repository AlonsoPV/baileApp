-- ========================================
-- 📝 SCRIPT PARA INSERTAR RESERVAS TENTATIVAS EN LOCALHOST
-- ========================================
-- Este script es idéntico al de producción pero con instrucciones
-- específicas para desarrollo local

-- IMPORTANTE: 
-- 1. Asegúrate de que tu Supabase local esté corriendo
-- 2. Ejecuta este script en el SQL Editor de tu Supabase local (http://localhost:54323)
-- 3. O usa: supabase db reset (si quieres empezar desde cero)

-- ========================================
-- INSTRUCCIONES PARA LOCALHOST:
-- ========================================
-- 1. Inicia Supabase local: supabase start
-- 2. Abre el SQL Editor local: http://localhost:54323/project/default/sql
-- 3. Reemplaza v_academy_id con el ID de tu academia LOCAL
-- 4. Ejecuta este script
-- ========================================

DO $$
DECLARE
  v_academy_id BIGINT := NULL; -- ⚠️ CAMBIAR: Poner el ID de tu academia LOCAL aquí
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
  v_inserted_count INT := 0;
  v_total_inserted INT := 0;
  v_row_count INT;
  v_user_index INT;
  v_user_exists INT;
BEGIN
  -- Verificar que se haya configurado el academy_id
  IF v_academy_id IS NULL THEN
    RAISE EXCEPTION '⚠️ ERROR: Debes configurar v_academy_id con el ID de tu academia LOCAL';
  END IF;

  -- Verificar que la academia existe
  IF NOT EXISTS (SELECT 1 FROM profiles_academy WHERE id = v_academy_id) THEN
    RAISE EXCEPTION '⚠️ ERROR: No se encontró la academia con ID % en la base de datos LOCAL', v_academy_id;
  END IF;

  RAISE NOTICE '🚀 Iniciando inserción de reservas tentativas en LOCALHOST...';
  RAISE NOTICE '   Academia ID: %', v_academy_id;
  RAISE NOTICE '   Clases: %', array_length(v_class_ids, 1);
  RAISE NOTICE '   Usuarios: %', array_length(v_user_ids, 1);
  RAISE NOTICE '';

  -- Verificar que los usuarios existan en auth.users
  RAISE NOTICE '🔍 Verificando usuarios en auth.users...';
  FOR v_user_index IN 1..array_length(v_user_ids, 1) LOOP
    SELECT COUNT(*) INTO v_user_exists
    FROM auth.users
    WHERE id = v_user_ids[v_user_index];
    
    IF v_user_exists = 0 THEN
      RAISE WARNING '⚠️ Usuario no encontrado en auth.users: %', v_user_ids[v_user_index];
      RAISE NOTICE '   💡 Tip: Crea este usuario primero o usa IDs de usuarios que ya existan en tu base local';
    ELSE
      RAISE NOTICE '   ✅ Usuario % existe', v_user_ids[v_user_index];
    END IF;
  END LOOP;
  RAISE NOTICE '';

  -- Insertar reservas (mismo código que producción)
  -- Usuario 1: Bachata Tradicional (Leader)
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[1],
      v_class_ids[1],
      v_academy_id,
      'leader',
      v_zona_tag_id,
      'tentative',
      NULL,
      NOW() - INTERVAL '2 days'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 1 -> Bachata Tradicional (Leader)';
    ELSE
      RAISE NOTICE '⚠️ Ya existía: Usuario 1 -> Bachata Tradicional (Leader)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error insertando Usuario 1 -> Bachata Tradicional: %', SQLERRM;
  END;

  -- Usuario 2: Bachata Moderna (Follower)
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[2],
      v_class_ids[2],
      v_academy_id,
      'follower',
      v_zona_tag_id,
      'tentative',
      NULL,
      NOW() - INTERVAL '1 day'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 2 -> Bachata Moderna (Follower)';
    ELSE
      RAISE NOTICE '⚠️ Ya existía: Usuario 2 -> Bachata Moderna (Follower)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error insertando Usuario 2 -> Bachata Moderna: %', SQLERRM;
  END;

  -- Usuario 3: Bachata (Ambos)
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[3],
      v_class_ids[3],
      v_academy_id,
      'ambos',
      v_zona_tag_id,
      'tentative',
      NULL,
      NOW() - INTERVAL '3 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 3 -> Bachata (Ambos)';
    ELSE
      RAISE NOTICE '⚠️ Ya existía: Usuario 3 -> Bachata (Ambos)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error insertando Usuario 3 -> Bachata: %', SQLERRM;
  END;

  -- Usuario 4: Salsa On 1 y Salsa On 2 (Leader)
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[4],
      v_class_ids[4],
      v_academy_id,
      'leader',
      v_zona_tag_id,
      'tentative',
      NULL,
      NOW() - INTERVAL '5 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 4 -> Salsa On 1 y Salsa On 2 (Leader)';
    ELSE
      RAISE NOTICE '⚠️ Ya existía: Usuario 4 -> Salsa On 1 y Salsa On 2 (Leader)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error insertando Usuario 4 -> Salsa On 1 y Salsa On 2: %', SQLERRM;
  END;

  -- Usuario 5: Bachata Partner Work (Martes) (Follower)
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[5],
      v_class_ids[5],
      v_academy_id,
      'follower',
      v_zona_tag_id,
      'tentative',
      NULL,
      NOW() - INTERVAL '1 hour'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 5 -> Bachata Partner Work Martes (Follower)';
    ELSE
      RAISE NOTICE '⚠️ Ya existía: Usuario 5 -> Bachata Partner Work Martes (Follower)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error insertando Usuario 5 -> Bachata Partner Work: %', SQLERRM;
  END;

  -- Usuario 6: Salsa On 1 (Ambos)
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[6],
      v_class_ids[6],
      v_academy_id,
      'ambos',
      v_zona_tag_id,
      'tentative',
      NULL,
      NOW() - INTERVAL '30 minutes'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 6 -> Salsa On 1 (Ambos)';
    ELSE
      RAISE NOTICE '⚠️ Ya existía: Usuario 6 -> Salsa On 1 (Ambos)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error insertando Usuario 6 -> Salsa On 1: %', SQLERRM;
  END;

  -- Usuario 7: Bachata Partner Work (Jueves) (Leader)
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[7],
      v_class_ids[7],
      v_academy_id,
      'leader',
      v_zona_tag_id,
      'tentative',
      NULL,
      NOW() - INTERVAL '15 minutes'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 7 -> Bachata Partner Work Jueves (Leader)';
    ELSE
      RAISE NOTICE '⚠️ Ya existía: Usuario 7 -> Bachata Partner Work Jueves (Leader)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error insertando Usuario 7 -> Bachata Partner Work: %', SQLERRM;
  END;

  -- Segunda ronda de reservas
  -- Usuario 1 también en Bachata Moderna (Follower)
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[1],
      v_class_ids[2],
      v_academy_id,
      'follower',
      v_zona_tag_id,
      'tentative',
      NULL,
      NOW() - INTERVAL '4 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 1 -> Bachata Moderna (Follower)';
    ELSE
      RAISE NOTICE '⚠️ Ya existía: Usuario 1 -> Bachata Moderna (Follower)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error insertando Usuario 1 -> Bachata Moderna: %', SQLERRM;
  END;

  -- Usuario 2 también en Bachata (Leader)
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[2],
      v_class_ids[3],
      v_academy_id,
      'leader',
      v_zona_tag_id,
      'tentative',
      NULL,
      NOW() - INTERVAL '6 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 2 -> Bachata (Leader)';
    ELSE
      RAISE NOTICE '⚠️ Ya existía: Usuario 2 -> Bachata (Leader)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error insertando Usuario 2 -> Bachata: %', SQLERRM;
  END;

  -- Usuario 3 también en Salsa On 1 y Salsa On 2 (Follower)
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[3],
      v_class_ids[4],
      v_academy_id,
      'follower',
      v_zona_tag_id,
      'tentative',
      NULL,
      NOW() - INTERVAL '8 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 3 -> Salsa On 1 y Salsa On 2 (Follower)';
    ELSE
      RAISE NOTICE '⚠️ Ya existía: Usuario 3 -> Salsa On 1 y Salsa On 2 (Follower)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error insertando Usuario 3 -> Salsa On 1 y Salsa On 2: %', SQLERRM;
  END;

  -- Usuario 4 también en Bachata Partner Work (Martes) (Ambos)
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[4],
      v_class_ids[5],
      v_academy_id,
      'ambos',
      v_zona_tag_id,
      'tentative',
      NULL,
      NOW() - INTERVAL '10 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 4 -> Bachata Partner Work Martes (Ambos)';
    ELSE
      RAISE NOTICE '⚠️ Ya existía: Usuario 4 -> Bachata Partner Work Martes (Ambos)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error insertando Usuario 4 -> Bachata Partner Work: %', SQLERRM;
  END;

  -- Usuario 5 también en Salsa On 1 (Leader)
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[5],
      v_class_ids[6],
      v_academy_id,
      'leader',
      v_zona_tag_id,
      'tentative',
      NULL,
      NOW() - INTERVAL '12 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 5 -> Salsa On 1 (Leader)';
    ELSE
      RAISE NOTICE '⚠️ Ya existía: Usuario 5 -> Salsa On 1 (Leader)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error insertando Usuario 5 -> Salsa On 1: %', SQLERRM;
  END;

  -- Usuario 6 también en Bachata Partner Work (Jueves) (Follower)
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[6],
      v_class_ids[7],
      v_academy_id,
      'follower',
      v_zona_tag_id,
      'tentative',
      NULL,
      NOW() - INTERVAL '14 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 6 -> Bachata Partner Work Jueves (Follower)';
    ELSE
      RAISE NOTICE '⚠️ Ya existía: Usuario 6 -> Bachata Partner Work Jueves (Follower)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error insertando Usuario 6 -> Bachata Partner Work: %', SQLERRM;
  END;

  -- Usuario 7 también en Bachata Tradicional (Ambos)
  BEGIN
    INSERT INTO clase_asistencias (user_id, class_id, academy_id, role_baile, zona_tag_id, status, fecha_especifica, created_at)
    VALUES (
      v_user_ids[7],
      v_class_ids[1],
      v_academy_id,
      'ambos',
      v_zona_tag_id,
      'tentative',
      NULL,
      NOW() - INTERVAL '16 hours'
    ) ON CONFLICT (user_id, class_id, fecha_especifica) DO NOTHING;
    GET DIAGNOSTICS v_row_count = ROW_COUNT;
    v_total_inserted := v_total_inserted + v_row_count;
    IF v_row_count > 0 THEN
      RAISE NOTICE '✅ Insertado: Usuario 7 -> Bachata Tradicional (Ambos)';
    ELSE
      RAISE NOTICE '⚠️ Ya existía: Usuario 7 -> Bachata Tradicional (Ambos)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Error insertando Usuario 7 -> Bachata Tradicional: %', SQLERRM;
  END;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Inserción completada en LOCALHOST: % reservas nuevas insertadas', v_total_inserted;
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
  RAISE NOTICE '✅ Script completado exitosamente en LOCALHOST!';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Tip: Si no ves las métricas en localhost, verifica:';
  RAISE NOTICE '   1. Que tu .env.local apunte a la base de datos local';
  RAISE NOTICE '   2. Que Supabase local esté corriendo: supabase start';
  RAISE NOTICE '   3. Que el academy_id sea correcto para tu base local';
  
END $$;

-- ========================================
-- VERIFICACIÓN EN LOCALHOST
-- ========================================

-- Obtener el ID de tu academia local (ejecutar primero)
-- SELECT id, nombre_publico FROM profiles_academy;

-- Verificar reservas insertadas (reemplaza NULL con tu academy_id local)
SELECT 
  ca.class_id,
  ca.user_id,
  pu.display_name as nombre_usuario,
  ca.role_baile,
  ca.zona_tag_id,
  ca.status,
  ca.created_at
FROM clase_asistencias ca
LEFT JOIN profiles_user pu ON pu.user_id = ca.user_id
WHERE ca.academy_id = (SELECT id FROM profiles_academy LIMIT 1) -- Ajustar según tu caso
  AND ca.status = 'tentative'
ORDER BY ca.created_at DESC;

