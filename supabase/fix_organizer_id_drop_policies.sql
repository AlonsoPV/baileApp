-- ========================================
-- 🔧 FIX: Eliminar políticas RLS antes de cambiar tipo
-- ========================================
-- Error: cannot alter type of a column used in a policy definition
-- Solución: Eliminar políticas, cambiar tipo, recrear políticas

-- ========================================
-- 1️⃣ ELIMINAR datos existentes
-- ========================================

DO $$
DECLARE
  event_count integer;
BEGIN
  SELECT COUNT(*) INTO event_count FROM public.events_parent;
  
  IF event_count > 0 THEN
    RAISE NOTICE '⚠️ Hay % eventos en events_parent', event_count;
    RAISE NOTICE '🗑️ Eliminando eventos existentes...';
    
    DELETE FROM public.events_date;
    RAISE NOTICE '   ✅ Fechas eliminadas';
    
    DELETE FROM public.events_parent;
    RAISE NOTICE '   ✅ Eventos eliminados';
  ELSE
    RAISE NOTICE 'ℹ️ No hay eventos existentes';
  END IF;
END $$;

-- ========================================
-- 2️⃣ ELIMINAR TODAS las políticas RLS de events_parent
-- ========================================

DROP POLICY IF EXISTS "Anyone can view events_parent" ON public.events_parent;
DROP POLICY IF EXISTS "Organizers can create events_parent" ON public.events_parent;
DROP POLICY IF EXISTS "Organizers can delete own events_parent" ON public.events_parent;
DROP POLICY IF EXISTS "Organizers can update own events_parent" ON public.events_parent;
DROP POLICY IF EXISTS "events_parent_delete_policy" ON public.events_parent;
DROP POLICY IF EXISTS "events_parent_insert_policy" ON public.events_parent;
DROP POLICY IF EXISTS "events_parent_select_policy" ON public.events_parent;
DROP POLICY IF EXISTS "events_parent_update_policy" ON public.events_parent;

-- Eliminar cualquier otra política que pueda existir
DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  FOR policy_rec IN 
    SELECT policyname 
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'events_parent'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.events_parent', policy_rec.policyname);
    RAISE NOTICE '✅ Política % eliminada', policy_rec.policyname;
  END LOOP;
END $$;

-- ========================================
-- 3️⃣ ELIMINAR TODAS las políticas RLS de events_date
-- ========================================

DROP POLICY IF EXISTS "Anyone can view events_date" ON public.events_date;
DROP POLICY IF EXISTS "Organizers can create events_date" ON public.events_date;
DROP POLICY IF EXISTS "Organizers can delete own events_date" ON public.events_date;
DROP POLICY IF EXISTS "Organizers can update own events_date" ON public.events_date;

DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  FOR policy_rec IN 
    SELECT policyname 
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'events_date'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.events_date', policy_rec.policyname);
    RAISE NOTICE '✅ Política % eliminada', policy_rec.policyname;
  END LOOP;
END $$;

-- ========================================
-- 4️⃣ ELIMINAR foreign key constraints
-- ========================================

DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  -- Constraints de events_parent
  FOR constraint_rec IN 
    SELECT constraint_name 
    FROM information_schema.table_constraints
    WHERE table_name = 'events_parent'
    AND constraint_type = 'FOREIGN KEY'
  LOOP
    EXECUTE format('ALTER TABLE public.events_parent DROP CONSTRAINT %I', constraint_rec.constraint_name);
    RAISE NOTICE '✅ Constraint % eliminada de events_parent', constraint_rec.constraint_name;
  END LOOP;
  
  -- Constraints de events_date
  FOR constraint_rec IN 
    SELECT constraint_name 
    FROM information_schema.table_constraints
    WHERE table_name = 'events_date'
    AND constraint_type = 'FOREIGN KEY'
  LOOP
    EXECUTE format('ALTER TABLE public.events_date DROP CONSTRAINT %I', constraint_rec.constraint_name);
    RAISE NOTICE '✅ Constraint % eliminada de events_date', constraint_rec.constraint_name;
  END LOOP;
END $$;

-- ========================================
-- 5️⃣ CAMBIAR tipos de columnas
-- ========================================

-- Cambiar events_parent.organizer_id
DO $$
BEGIN
  RAISE NOTICE '🔄 Cambiando events_parent.organizer_id de UUID a BIGINT...';
  
  ALTER TABLE public.events_parent 
  ALTER COLUMN organizer_id TYPE bigint 
  USING NULL;
  
  RAISE NOTICE '✅ events_parent.organizer_id cambiado a BIGINT';
END $$;

-- Cambiar events_date.parent_id
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
    
    ALTER TABLE public.events_date 
    ALTER COLUMN parent_id TYPE bigint 
    USING NULL;
    
    RAISE NOTICE '✅ events_date.parent_id cambiado a BIGINT';
  ELSE
    RAISE NOTICE 'ℹ️ events_date.parent_id ya es: %', parent_id_type;
  END IF;
END $$;

-- ========================================
-- 6️⃣ RECREAR foreign keys
-- ========================================

ALTER TABLE public.events_parent
ADD CONSTRAINT events_parent_organizer_id_fkey
FOREIGN KEY (organizer_id)
REFERENCES public.profiles_organizer(id)
ON DELETE CASCADE;

ALTER TABLE public.events_date
ADD CONSTRAINT events_date_parent_id_fkey
FOREIGN KEY (parent_id)
REFERENCES public.events_parent(id)
ON DELETE CASCADE;

-- ========================================
-- 7️⃣ RECREAR políticas RLS para events_parent
-- ========================================

-- SELECT: Todos pueden ver
CREATE POLICY "events_parent_select_all"
ON public.events_parent
FOR SELECT
USING (true);

-- INSERT: Solo organizadores pueden crear
CREATE POLICY "events_parent_insert_organizer"
ON public.events_parent
FOR INSERT
WITH CHECK (
  organizer_id IN (
    SELECT id FROM public.profiles_organizer WHERE user_id = auth.uid()
  )
);

-- UPDATE: Solo el dueño puede actualizar
CREATE POLICY "events_parent_update_own"
ON public.events_parent
FOR UPDATE
USING (
  organizer_id IN (
    SELECT id FROM public.profiles_organizer WHERE user_id = auth.uid()
  )
);

-- DELETE: Solo el dueño puede eliminar
CREATE POLICY "events_parent_delete_own"
ON public.events_parent
FOR DELETE
USING (
  organizer_id IN (
    SELECT id FROM public.profiles_organizer WHERE user_id = auth.uid()
  )
);

-- ========================================
-- 8️⃣ RECREAR políticas RLS para events_date
-- ========================================

-- SELECT: Todos pueden ver
CREATE POLICY "events_date_select_all"
ON public.events_date
FOR SELECT
USING (true);

-- INSERT: Solo el dueño del parent puede crear
CREATE POLICY "events_date_insert_organizer"
ON public.events_date
FOR INSERT
WITH CHECK (
  parent_id IN (
    SELECT ep.id 
    FROM public.events_parent ep
    INNER JOIN public.profiles_organizer po ON ep.organizer_id = po.id
    WHERE po.user_id = auth.uid()
  )
);

-- UPDATE: Solo el dueño del parent puede actualizar
CREATE POLICY "events_date_update_organizer"
ON public.events_date
FOR UPDATE
USING (
  parent_id IN (
    SELECT ep.id 
    FROM public.events_parent ep
    INNER JOIN public.profiles_organizer po ON ep.organizer_id = po.id
    WHERE po.user_id = auth.uid()
  )
);

-- DELETE: Solo el dueño del parent puede eliminar
CREATE POLICY "events_date_delete_organizer"
ON public.events_date
FOR DELETE
USING (
  parent_id IN (
    SELECT ep.id 
    FROM public.events_parent ep
    INNER JOIN public.profiles_organizer po ON ep.organizer_id = po.id
    WHERE po.user_id = auth.uid()
  )
);

-- ========================================
-- 9️⃣ VERIFICACIÓN FINAL
-- ========================================

SELECT 
  '✅ Tipos de datos' as verificacion,
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
ORDER BY table_name;

SELECT 
  '✅ Foreign Keys' as verificacion,
  constraint_name,
  table_name
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name IN ('events_parent', 'events_date')
AND constraint_type = 'FOREIGN KEY';

SELECT 
  '✅ Políticas RLS' as verificacion,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('events_parent', 'events_date')
ORDER BY tablename, policyname;

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
  RAISE NOTICE '   ✅ Políticas RLS eliminadas';
  RAISE NOTICE '   ✅ Foreign keys eliminadas';
  RAISE NOTICE '   ✅ organizer_id: UUID → BIGINT';
  RAISE NOTICE '   ✅ parent_id: UUID → BIGINT';
  RAISE NOTICE '   ✅ Foreign keys recreadas';
  RAISE NOTICE '   ✅ Políticas RLS recreadas';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ahora puedes:';
  RAISE NOTICE '   1. Refrescar frontend (Ctrl + F5)';
  RAISE NOTICE '   2. Crear eventos sin error de UUID';
  RAISE NOTICE '   3. El auto-seed funcionará para nuevos perfiles';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ NOTA: Eventos anteriores fueron eliminados';
  RAISE NOTICE '';
END $$;

