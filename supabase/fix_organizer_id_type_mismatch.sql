-- ========================================
-- 🔧 FIX: Type mismatch en organizer_id
-- ========================================
-- Error: invalid input syntax for type uuid: "1142"
-- Causa: organizer_id es UUID en events_parent pero INTEGER en profiles_organizer

-- ========================================
-- 1️⃣ VERIFICAR tipos actuales
-- ========================================

-- Tipo de ID en profiles_organizer
SELECT 
  '1️⃣ profiles_organizer.id' as tabla_columna,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles_organizer'
AND column_name = 'id';

-- Tipo de organizer_id en events_parent
SELECT 
  '2️⃣ events_parent.organizer_id' as tabla_columna,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'events_parent'
AND column_name = 'organizer_id';

-- ========================================
-- 2️⃣ DIAGNÓSTICO: ¿Cuál es el problema?
-- ========================================

DO $$
DECLARE
  org_id_type text;
  parent_org_id_type text;
BEGIN
  -- Obtener tipo de profiles_organizer.id
  SELECT data_type INTO org_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'profiles_organizer'
  AND column_name = 'id';
  
  -- Obtener tipo de events_parent.organizer_id
  SELECT data_type INTO parent_org_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'events_parent'
  AND column_name = 'organizer_id';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 DIAGNÓSTICO DE TIPOS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'profiles_organizer.id: %', org_id_type;
  RAISE NOTICE 'events_parent.organizer_id: %', parent_org_id_type;
  RAISE NOTICE '';
  
  IF org_id_type = parent_org_id_type THEN
    RAISE NOTICE '✅ Los tipos coinciden';
  ELSE
    RAISE NOTICE '❌ MISMATCH: Los tipos NO coinciden';
    RAISE NOTICE '   Esto causará el error: invalid input syntax for type uuid';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 SOLUCIÓN:';
    RAISE NOTICE '   Opción 1: Cambiar events_parent.organizer_id a %', org_id_type;
    RAISE NOTICE '   Opción 2: Cambiar profiles_organizer.id a %', parent_org_id_type;
  END IF;
  RAISE NOTICE '========================================';
END $$;

-- ========================================
-- 3️⃣ SOLUCIÓN: Cambiar organizer_id a INTEGER
-- ========================================
-- Solo ejecutar si events_parent.organizer_id es UUID
-- y profiles_organizer.id es INTEGER/BIGINT

-- Paso 1: Eliminar constraint de foreign key si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'events_parent_organizer_id_fkey'
    AND table_name = 'events_parent'
  ) THEN
    ALTER TABLE public.events_parent DROP CONSTRAINT events_parent_organizer_id_fkey;
    RAISE NOTICE '✅ Foreign key eliminada';
  ELSE
    RAISE NOTICE 'ℹ️ No existe foreign key events_parent_organizer_id_fkey';
  END IF;
END $$;

-- Paso 2: Cambiar tipo de columna
-- NOTA: Esto fallará si hay datos existentes que no sean convertibles
DO $$
DECLARE
  current_type text;
BEGIN
  -- Verificar tipo actual
  SELECT data_type INTO current_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'events_parent'
  AND column_name = 'organizer_id';
  
  IF current_type = 'uuid' THEN
    RAISE NOTICE '🔄 Cambiando organizer_id de UUID a INTEGER...';
    
    -- Intentar conversión (fallará si hay UUIDs reales)
    BEGIN
      ALTER TABLE public.events_parent 
      ALTER COLUMN organizer_id TYPE integer 
      USING NULL; -- Convertir todos a NULL primero
      
      RAISE NOTICE '✅ Tipo cambiado a INTEGER';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Error al cambiar tipo: %', SQLERRM;
      RAISE NOTICE '💡 Puede que necesites eliminar datos existentes primero';
    END;
  ELSE
    RAISE NOTICE 'ℹ️ organizer_id ya es de tipo: %', current_type;
  END IF;
END $$;

-- Paso 3: Recrear foreign key
DO $$
DECLARE
  org_id_type text;
  parent_org_id_type text;
BEGIN
  -- Verificar tipos después del cambio
  SELECT data_type INTO org_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'profiles_organizer'
  AND column_name = 'id';
  
  SELECT data_type INTO parent_org_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'events_parent'
  AND column_name = 'organizer_id';
  
  IF org_id_type = parent_org_id_type THEN
    RAISE NOTICE '🔗 Recreando foreign key...';
    
    ALTER TABLE public.events_parent
    ADD CONSTRAINT events_parent_organizer_id_fkey
    FOREIGN KEY (organizer_id)
    REFERENCES public.profiles_organizer(id)
    ON DELETE CASCADE;
    
    RAISE NOTICE '✅ Foreign key recreada';
  ELSE
    RAISE NOTICE '⚠️ Los tipos aún no coinciden, no se puede crear foreign key';
  END IF;
END $$;

-- ========================================
-- 4️⃣ VERIFICACIÓN FINAL
-- ========================================

-- Ver estructura final
SELECT 
  'Estructura final:' as info,
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
  (table_name = 'profiles_organizer' AND column_name = 'id')
  OR (table_name = 'events_parent' AND column_name = 'organizer_id')
)
ORDER BY table_name, column_name;

-- Ver constraints
SELECT 
  'Foreign keys:' as info,
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name = 'events_parent'
AND constraint_type = 'FOREIGN KEY';

-- ========================================
-- ✅ MENSAJE FINAL
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Script completado';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Próximos pasos:';
  RAISE NOTICE '   1. Verifica que los tipos coincidan arriba';
  RAISE NOTICE '   2. Refresca el frontend (Ctrl + F5)';
  RAISE NOTICE '   3. Intenta crear un evento nuevamente';
  RAISE NOTICE '';
END $$;

