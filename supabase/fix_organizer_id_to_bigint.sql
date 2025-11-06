-- ========================================
-- 🔧 FIX: Cambiar organizer_id de UUID a BIGINT
-- ========================================
-- Problema confirmado:
--   profiles_organizer.id = BIGINT
--   events_parent.organizer_id = UUID
-- Solución: Cambiar organizer_id a BIGINT

-- ========================================
-- 1️⃣ ELIMINAR datos existentes (si los hay)
-- ========================================
-- ADVERTENCIA: Esto eliminará todos los eventos existentes
-- Si tienes eventos importantes, haz un backup primero

DO $$
DECLARE
  event_count integer;
BEGIN
  SELECT COUNT(*) INTO event_count FROM public.events_parent;
  
  IF event_count > 0 THEN
    RAISE NOTICE '⚠️ Hay % eventos en events_parent', event_count;
    RAISE NOTICE '🗑️ Eliminando eventos existentes para permitir cambio de tipo...';
    
    -- Eliminar fechas primero (foreign key)
    DELETE FROM public.events_date;
    RAISE NOTICE '   ✅ Fechas eliminadas';
    
    -- Eliminar eventos padre
    DELETE FROM public.events_parent;
    RAISE NOTICE '   ✅ Eventos eliminados';
  ELSE
    RAISE NOTICE 'ℹ️ No hay eventos existentes, procediendo...';
  END IF;
END $$;

-- ========================================
-- 2️⃣ ELIMINAR foreign key constraint
-- ========================================

DO $$
BEGIN
  -- Eliminar constraint de events_parent
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'events_parent_organizer_id_fkey'
    AND table_name = 'events_parent'
  ) THEN
    ALTER TABLE public.events_parent DROP CONSTRAINT events_parent_organizer_id_fkey;
    RAISE NOTICE '✅ Foreign key events_parent_organizer_id_fkey eliminada';
  END IF;
  
  -- Buscar y eliminar cualquier otra constraint con nombre similar
  DECLARE
    constraint_rec RECORD;
  BEGIN
    FOR constraint_rec IN 
      SELECT constraint_name 
      FROM information_schema.table_constraints
      WHERE table_name = 'events_parent'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%organizer%'
    LOOP
      EXECUTE format('ALTER TABLE public.events_parent DROP CONSTRAINT %I', constraint_rec.constraint_name);
      RAISE NOTICE '✅ Constraint % eliminada', constraint_rec.constraint_name;
    END LOOP;
  END;
END $$;

-- ========================================
-- 3️⃣ CAMBIAR tipo de columna
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '🔄 Cambiando organizer_id de UUID a BIGINT...';
  
  ALTER TABLE public.events_parent 
  ALTER COLUMN organizer_id TYPE bigint 
  USING NULL; -- Convertir todos a NULL (ya eliminamos los datos)
  
  RAISE NOTICE '✅ organizer_id cambiado a BIGINT';
END $$;

-- ========================================
-- 4️⃣ RECREAR foreign key
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '🔗 Recreando foreign key...';
  
  ALTER TABLE public.events_parent
  ADD CONSTRAINT events_parent_organizer_id_fkey
  FOREIGN KEY (organizer_id)
  REFERENCES public.profiles_organizer(id)
  ON DELETE CASCADE;
  
  RAISE NOTICE '✅ Foreign key recreada con CASCADE';
END $$;

-- ========================================
-- 5️⃣ VERIFICAR cambio en events_date también
-- ========================================
-- events_date puede tener parent_id que también necesita ser ajustado

SELECT 
  '5️⃣ Verificar events_date.parent_id' as check_tipo,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'events_date'
AND column_name = 'parent_id';

-- Si parent_id es UUID, también necesita cambio
DO $$
DECLARE
  parent_id_type text;
BEGIN
  SELECT data_type INTO parent_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'events_date'
  AND column_name = 'parent_id';
  
  IF parent_id_type = 'uuid' THEN
    RAISE NOTICE '🔄 Cambiando events_date.parent_id de UUID a BIGINT...';
    
    -- Eliminar constraint primero
    DECLARE
      constraint_rec RECORD;
    BEGIN
      FOR constraint_rec IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints
        WHERE table_name = 'events_date'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%parent%'
      LOOP
        EXECUTE format('ALTER TABLE public.events_date DROP CONSTRAINT %I', constraint_rec.constraint_name);
        RAISE NOTICE '   ✅ Constraint % eliminada', constraint_rec.constraint_name;
      END LOOP;
    END;
    
    -- Cambiar tipo
    ALTER TABLE public.events_date 
    ALTER COLUMN parent_id TYPE bigint 
    USING NULL;
    
    RAISE NOTICE '✅ events_date.parent_id cambiado a BIGINT';
    
    -- Recrear foreign key
    ALTER TABLE public.events_date
    ADD CONSTRAINT events_date_parent_id_fkey
    FOREIGN KEY (parent_id)
    REFERENCES public.events_parent(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Foreign key events_date → events_parent recreada';
  ELSE
    RAISE NOTICE 'ℹ️ events_date.parent_id ya es de tipo: %', parent_id_type;
  END IF;
END $$;

-- ========================================
-- 6️⃣ VERIFICACIÓN FINAL
-- ========================================

SELECT 
  '✅ Verificación Final' as resultado,
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
  (table_name = 'profiles_organizer' AND column_name = 'id')
  OR (table_name = 'events_parent' AND column_name = 'organizer_id')
  OR (table_name = 'events_date' AND column_name = 'parent_id')
)
ORDER BY table_name, column_name;

-- Ver foreign keys recreadas
SELECT 
  '✅ Foreign Keys' as resultado,
  constraint_name,
  table_name
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name IN ('events_parent', 'events_date')
AND constraint_type = 'FOREIGN KEY'
ORDER BY table_name;

-- ========================================
-- ✅ MENSAJE FINAL
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SCRIPT COMPLETADO EXITOSAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Cambios realizados:';
  RAISE NOTICE '   ✅ events_parent.organizer_id: UUID → BIGINT';
  RAISE NOTICE '   ✅ events_date.parent_id: UUID → BIGINT (si aplicaba)';
  RAISE NOTICE '   ✅ Foreign keys recreadas con CASCADE';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Próximos pasos:';
  RAISE NOTICE '   1. Refresca el frontend (Ctrl + F5)';
  RAISE NOTICE '   2. Intenta crear un evento';
  RAISE NOTICE '   3. Debería funcionar sin error de UUID';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ NOTA: Los eventos anteriores fueron eliminados';
  RAISE NOTICE '   Esto era necesario para cambiar el tipo de dato';
  RAISE NOTICE '';
END $$;

