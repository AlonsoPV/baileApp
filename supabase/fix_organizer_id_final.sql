-- ========================================
-- 🔧 FIX FINAL: Cambiar organizer_id de UUID a BIGINT
-- ========================================
-- Error: cannot alter type of a column used by a view or rule
-- Solución: Eliminar vistas, políticas, constraints, cambiar tipo, recrear todo

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
-- 2️⃣ ELIMINAR VISTAS que dependen de events_parent
-- ========================================

DROP VIEW IF EXISTS public.events_live CASCADE;
DROP VIEW IF EXISTS public.v_events_dates_public CASCADE;
DROP VIEW IF EXISTS public.v_events_public CASCADE;

-- Buscar y eliminar cualquier otra vista que dependa
DO $$
DECLARE
  view_rec RECORD;
BEGIN
  FOR view_rec IN 
    SELECT table_name 
    FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name LIKE '%event%'
  LOOP
    EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_rec.table_name);
    RAISE NOTICE '✅ Vista % eliminada', view_rec.table_name;
  END LOOP;
END $$;

-- ========================================
-- 3️⃣ ELIMINAR políticas RLS de events_parent
-- ========================================

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
    RAISE NOTICE '✅ Política % eliminada de events_parent', policy_rec.policyname;
  END LOOP;
END $$;

-- ========================================
-- 4️⃣ ELIMINAR políticas RLS de events_date
-- ========================================

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
    RAISE NOTICE '✅ Política % eliminada de events_date', policy_rec.policyname;
  END LOOP;
END $$;

-- ========================================
-- 5️⃣ ELIMINAR foreign key constraints
-- ========================================

DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  -- Constraints de events_date
  FOR constraint_rec IN 
    SELECT constraint_name 
    FROM information_schema.table_constraints
    WHERE table_name = 'events_date'
    AND constraint_type = 'FOREIGN KEY'
  LOOP
    EXECUTE format('ALTER TABLE public.events_date DROP CONSTRAINT IF EXISTS %I', constraint_rec.constraint_name);
    RAISE NOTICE '✅ Constraint % eliminada de events_date', constraint_rec.constraint_name;
  END LOOP;
  
  -- Constraints de events_parent
  FOR constraint_rec IN 
    SELECT constraint_name 
    FROM information_schema.table_constraints
    WHERE table_name = 'events_parent'
    AND constraint_type = 'FOREIGN KEY'
  LOOP
    EXECUTE format('ALTER TABLE public.events_parent DROP CONSTRAINT IF EXISTS %I', constraint_rec.constraint_name);
    RAISE NOTICE '✅ Constraint % eliminada de events_parent', constraint_rec.constraint_name;
  END LOOP;
END $$;

-- ========================================
-- 6️⃣ CAMBIAR tipo de events_date.parent_id PRIMERO
-- ========================================

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
-- 7️⃣ CAMBIAR tipo de events_parent.organizer_id
-- ========================================

DO $$
DECLARE
  organizer_id_type text;
BEGIN
  SELECT data_type INTO organizer_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'events_parent'
  AND column_name = 'organizer_id';
  
  IF organizer_id_type = 'uuid' THEN
    RAISE NOTICE '🔄 Cambiando events_parent.organizer_id de UUID a BIGINT...';
    
    ALTER TABLE public.events_parent 
    ALTER COLUMN organizer_id TYPE bigint 
    USING NULL;
    
    RAISE NOTICE '✅ events_parent.organizer_id cambiado a BIGINT';
  ELSE
    RAISE NOTICE 'ℹ️ events_parent.organizer_id ya es: %', organizer_id_type;
  END IF;
END $$;

-- ========================================
-- 8️⃣ RECREAR foreign keys
-- ========================================

DO $$
BEGIN
  ALTER TABLE public.events_parent
  ADD CONSTRAINT events_parent_organizer_id_fkey
  FOREIGN KEY (organizer_id)
  REFERENCES public.profiles_organizer(id)
  ON DELETE CASCADE;

  RAISE NOTICE '✅ Foreign key events_parent → profiles_organizer recreada';

  ALTER TABLE public.events_date
  ADD CONSTRAINT events_date_parent_id_fkey
  FOREIGN KEY (parent_id)
  REFERENCES public.events_parent(id)
  ON DELETE CASCADE;

  RAISE NOTICE '✅ Foreign key events_date → events_parent recreada';
END $$;

-- ========================================
-- 9️⃣ RECREAR políticas RLS para events_parent
-- ========================================

DO $$
BEGIN
  CREATE POLICY "events_parent_select_all"
  ON public.events_parent
  FOR SELECT
  USING (true);

  CREATE POLICY "events_parent_insert_organizer"
  ON public.events_parent
  FOR INSERT
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM public.profiles_organizer WHERE user_id = auth.uid()
    )
  );

  CREATE POLICY "events_parent_update_own"
  ON public.events_parent
  FOR UPDATE
  USING (
    organizer_id IN (
      SELECT id FROM public.profiles_organizer WHERE user_id = auth.uid()
    )
  );

  CREATE POLICY "events_parent_delete_own"
  ON public.events_parent
  FOR DELETE
  USING (
    organizer_id IN (
      SELECT id FROM public.profiles_organizer WHERE user_id = auth.uid()
    )
  );

  RAISE NOTICE '✅ Políticas RLS de events_parent recreadas';
END $$;

-- ========================================
-- 🔟 RECREAR políticas RLS para events_date
-- ========================================

DO $$
BEGIN
  CREATE POLICY "events_date_select_all"
  ON public.events_date
  FOR SELECT
  USING (true);

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

  RAISE NOTICE '✅ Políticas RLS de events_date recreadas';
END $$;

-- ========================================
-- 1️⃣1️⃣ VERIFICACIÓN FINAL
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
  RAISE NOTICE '   ✅ Vistas eliminadas (events_live, etc.)';
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
  RAISE NOTICE '   3. El auto-seed funcionará';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ NOTAS:';
  RAISE NOTICE '   - Eventos anteriores fueron eliminados';
  RAISE NOTICE '   - Vistas events_live eliminadas (recrear si es necesario)';
  RAISE NOTICE '';
END $$;

