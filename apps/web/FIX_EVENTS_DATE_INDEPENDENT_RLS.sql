-- ========================================
-- 🔧 FIX: Permitir fechas independientes (parent_id = NULL)
-- ========================================
-- Actualizar políticas RLS para permitir que los organizadores
-- creen fechas sin necesidad de un events_parent (parent_id = NULL)

-- ========================================
-- 1️⃣ ELIMINAR política antigua de INSERT
-- ========================================

DROP POLICY IF EXISTS "events_date_insert_organizer" ON public.events_date;

-- ========================================
-- 2️⃣ CREAR nueva política que permite parent_id NULL
-- ========================================

CREATE POLICY "events_date_insert_organizer"
ON public.events_date
FOR INSERT
WITH CHECK (
  -- Permitir si parent_id es NULL y el usuario es organizador
  (
    parent_id IS NULL 
    AND EXISTS (
      SELECT 1 
      FROM public.profiles_organizer 
      WHERE user_id = auth.uid()
    )
  )
  OR
  -- O si parent_id pertenece a un events_parent del organizador
  (
    parent_id IS NOT NULL
    AND parent_id IN (
      SELECT ep.id 
      FROM public.events_parent ep
      INNER JOIN public.profiles_organizer po ON ep.organizer_id = po.id
      WHERE po.user_id = auth.uid()
    )
  )
);

-- ========================================
-- 3️⃣ ACTUALIZAR política de UPDATE para permitir NULL
-- ========================================

DROP POLICY IF EXISTS "events_date_update_organizer" ON public.events_date;

CREATE POLICY "events_date_update_organizer"
ON public.events_date
FOR UPDATE
USING (
  -- Permitir si parent_id es NULL y el usuario es organizador
  (
    parent_id IS NULL 
    AND EXISTS (
      SELECT 1 
      FROM public.profiles_organizer 
      WHERE user_id = auth.uid()
    )
  )
  OR
  -- O si parent_id pertenece a un events_parent del organizador
  (
    parent_id IS NOT NULL
    AND parent_id IN (
      SELECT ep.id 
      FROM public.events_parent ep
      INNER JOIN public.profiles_organizer po ON ep.organizer_id = po.id
      WHERE po.user_id = auth.uid()
    )
  )
);

-- ========================================
-- 4️⃣ ACTUALIZAR política de DELETE para permitir NULL
-- ========================================

DROP POLICY IF EXISTS "events_date_delete_organizer" ON public.events_date;

CREATE POLICY "events_date_delete_organizer"
ON public.events_date
FOR DELETE
USING (
  -- Permitir si parent_id es NULL y el usuario es organizador
  (
    parent_id IS NULL 
    AND EXISTS (
      SELECT 1 
      FROM public.profiles_organizer 
      WHERE user_id = auth.uid()
    )
  )
  OR
  -- O si parent_id pertenece a un events_parent del organizador
  (
    parent_id IS NOT NULL
    AND parent_id IN (
      SELECT ep.id 
      FROM public.events_parent ep
      INNER JOIN public.profiles_organizer po ON ep.organizer_id = po.id
      WHERE po.user_id = auth.uid()
    )
  )
);

-- ========================================
-- 5️⃣ VERIFICACIÓN
-- ========================================

SELECT 
  '✅ Políticas RLS actualizadas' as verificacion,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'events_date'
ORDER BY policyname;

-- ========================================
-- ✅ MENSAJE FINAL
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Políticas RLS actualizadas para events_date';
  RAISE NOTICE '✅ Ahora los organizadores pueden crear fechas independientes (parent_id = NULL)';
  RAISE NOTICE '========================================';
END $$;

