-- ============================================================================
-- 🔧 CORREGIR SECUENCIA DE clase_asistencias
-- ============================================================================
-- Este script corrige la secuencia de la columna id de clase_asistencias
-- cuando está desincronizada con los valores existentes en la tabla.
-- ============================================================================

BEGIN;

-- Verificar el estado actual
DO $$
DECLARE
  max_id bigint;
  current_seq_value bigint;
  sequence_name text := 'clase_asistencias_id_seq';
BEGIN
  -- Obtener el máximo ID actual en la tabla
  SELECT COALESCE(MAX(id), 0) INTO max_id
  FROM public.clase_asistencias;
  
  -- Obtener el valor actual de la secuencia
  SELECT COALESCE(last_value, 0) INTO current_seq_value
  FROM pg_sequences
  WHERE schemaname = 'public' 
    AND sequencename = sequence_name;
  
  RAISE NOTICE '📊 Estado actual:';
  RAISE NOTICE '   - Máximo ID en tabla: %', max_id;
  RAISE NOTICE '   - Valor actual de secuencia: %', current_seq_value;
  
  -- Si la secuencia está desincronizada, corregirla
  IF current_seq_value <= max_id THEN
    RAISE NOTICE '⚠️  La secuencia está desincronizada. Corrigiendo...';
    
    -- Resetear la secuencia al siguiente valor disponible
    PERFORM setval(
      'public.clase_asistencias_id_seq',
      max_id + 1,
      false  -- false = el próximo nextval() devolverá max_id + 1
    );
    
    RAISE NOTICE '✅ Secuencia corregida. Próximo ID será: %', max_id + 1;
  ELSE
    RAISE NOTICE '✅ La secuencia está correctamente sincronizada.';
  END IF;
END $$;

-- Verificar que la corrección funcionó
DO $$
DECLARE
  max_id bigint;
  next_seq_value bigint;
BEGIN
  SELECT COALESCE(MAX(id), 0) INTO max_id
  FROM public.clase_asistencias;
  
  SELECT last_value INTO next_seq_value
  FROM pg_sequences
  WHERE schemaname = 'public' 
    AND sequencename = 'clase_asistencias_id_seq';
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Verificación final:';
  RAISE NOTICE '   - Máximo ID en tabla: %', max_id;
  RAISE NOTICE '   - Próximo valor de secuencia: %', next_seq_value;
  
  IF next_seq_value > max_id THEN
    RAISE NOTICE '✅ La secuencia está correctamente configurada.';
  ELSE
    RAISE WARNING '⚠️  La secuencia aún puede estar desincronizada.';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- ✅ Este script corrige la secuencia clase_asistencias_id_seq
-- ✅ La secuencia se resetea al siguiente valor disponible después del máximo ID
-- ✅ Esto evita errores de "duplicate key value violates unique constraint"
-- ✅ Ejecutar este script antes de insertar nuevos registros si hay errores de PK
-- ============================================================================

