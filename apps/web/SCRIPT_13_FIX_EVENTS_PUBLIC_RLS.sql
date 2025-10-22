-- SCRIPT_13_FIX_EVENTS_PUBLIC_RLS.sql
-- Asegura que los eventos publicados sean visibles para todos los usuarios autenticados

-- 1. Verificar políticas existentes en events_date
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'events_date';

-- 2. Drop políticas antiguas si existen
DROP POLICY IF EXISTS "Public can view published dates" ON public.events_date;
DROP POLICY IF EXISTS "Anyone can view published dates" ON public.events_date;
DROP POLICY IF EXISTS "Authenticated users can view published dates" ON public.events_date;

-- 3. Crear política para que TODOS los usuarios autenticados vean eventos publicados
CREATE POLICY "Authenticated users can view published dates"
ON public.events_date
FOR SELECT
TO authenticated
USING (estado_publicacion = 'publicado');

-- 4. Mantener política para que organizadores vean sus propios eventos (publicados o borradores)
DROP POLICY IF EXISTS "Organizers can view own dates" ON public.events_date;

CREATE POLICY "Organizers can view own dates"
ON public.events_date
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events_parent ep
    JOIN public.profiles_organizer po ON po.id = ep.organizer_id
    WHERE ep.id = parent_id AND po.user_id = auth.uid()
  )
);

-- 5. Verificar que las nuevas políticas se crearon
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'events_date'
ORDER BY policyname;

-- 6. Probar que funciona - Ver eventos publicados (como cualquier usuario)
SELECT 
  ed.id,
  ed.fecha,
  ed.lugar,
  ed.ciudad,
  ed.estado_publicacion,
  ep.nombre as evento_nombre,
  po.nombre_publico as organizador
FROM events_date ed
JOIN events_parent ep ON ep.id = ed.parent_id
JOIN profiles_organizer po ON po.id = ep.organizer_id
WHERE ed.estado_publicacion = 'publicado'
ORDER BY ed.fecha ASC
LIMIT 10;

-- 7. Comentarios
COMMENT ON POLICY "Authenticated users can view published dates" ON public.events_date IS 
'Permite que todos los usuarios autenticados vean eventos publicados';

COMMENT ON POLICY "Organizers can view own dates" ON public.events_date IS 
'Permite que los organizadores vean todos sus eventos (publicados y borradores)';

-- 8. Verificación final
DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✅ Políticas RLS actualizadas para events_date';
  RAISE NOTICE 'Ahora todos los usuarios pueden ver eventos publicados';
  RAISE NOTICE '==========================================';
END $$;

