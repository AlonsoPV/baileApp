-- FIX TRENDING RLS: Agregar políticas para INSERT, UPDATE, DELETE

-- ================================================
-- Políticas para TRENDINGS
-- ================================================

-- INSERT: Solo superadmin puede crear trendings
DROP POLICY IF EXISTS ins_trendings_admin ON public.trendings;
CREATE POLICY ins_trendings_admin ON public.trendings
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- UPDATE: Solo superadmin puede actualizar trendings
DROP POLICY IF EXISTS upd_trendings_admin ON public.trendings;
CREATE POLICY upd_trendings_admin ON public.trendings
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- DELETE: Solo superadmin puede eliminar trendings
DROP POLICY IF EXISTS del_trendings_admin ON public.trendings;
CREATE POLICY del_trendings_admin ON public.trendings
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- ================================================
-- Políticas para TRENDING_RITMOS
-- ================================================

-- INSERT: Solo superadmin
DROP POLICY IF EXISTS ins_tritmos_admin ON public.trending_ritmos;
CREATE POLICY ins_tritmos_admin ON public.trending_ritmos
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- UPDATE: Solo superadmin
DROP POLICY IF EXISTS upd_tritmos_admin ON public.trending_ritmos;
CREATE POLICY upd_tritmos_admin ON public.trending_ritmos
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- DELETE: Solo superadmin
DROP POLICY IF EXISTS del_tritmos_admin ON public.trending_ritmos;
CREATE POLICY del_tritmos_admin ON public.trending_ritmos
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- ================================================
-- Políticas para TRENDING_CANDIDATES
-- ================================================

-- INSERT: Solo superadmin
DROP POLICY IF EXISTS ins_candidates_admin ON public.trending_candidates;
CREATE POLICY ins_candidates_admin ON public.trending_candidates
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- UPDATE: Solo superadmin
DROP POLICY IF EXISTS upd_candidates_admin ON public.trending_candidates;
CREATE POLICY upd_candidates_admin ON public.trending_candidates
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- DELETE: Solo superadmin
DROP POLICY IF EXISTS del_candidates_admin ON public.trending_candidates;
CREATE POLICY del_candidates_admin ON public.trending_candidates
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- ================================================
-- Verificación
-- ================================================

-- Ver todas las políticas de trendings
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('trendings', 'trending_ritmos', 'trending_candidates', 'trending_votes')
ORDER BY tablename, policyname;

-- Ver si el usuario actual es superadmin
SELECT 
  auth.uid() as current_user_id,
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  ) as is_superadmin;

