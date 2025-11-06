-- ========================================
-- 🔧 FIX: RLS INSERT para profiles_organizer
-- ========================================
-- Error: new row violates row-level security policy for table "profiles_organizer"
-- Solución: Permitir INSERT a usuarios con rol aprobado

-- ========================================
-- 1️⃣ Política INSERT para profiles_organizer
-- ========================================

-- Permitir que usuarios con rol 'organizador' aprobado puedan crear su perfil
DROP POLICY IF EXISTS ins_profiles_organizer_own ON public.profiles_organizer;

CREATE POLICY ins_profiles_organizer_own ON public.profiles_organizer
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      -- Tiene el rol en user_roles
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_slug = 'organizador'
      )
      OR
      -- Tiene solicitud aprobada
      EXISTS (
        SELECT 1 FROM public.role_requests
        WHERE role_requests.user_id = auth.uid()
        AND role_requests.role_slug = 'organizador'
        AND (role_requests.status = 'aprobado' OR role_requests.status = 'approved')
      )
      OR
      -- Es superadmin
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_slug = 'superadmin'
      )
    )
  );

-- ========================================
-- 2️⃣ Lo mismo para Academy, Teacher, Brand
-- ========================================

-- ACADEMY
DROP POLICY IF EXISTS ins_profiles_academy_own ON public.profiles_academy;

CREATE POLICY ins_profiles_academy_own ON public.profiles_academy
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_slug = 'academia'
      )
      OR
      EXISTS (
        SELECT 1 FROM public.role_requests
        WHERE role_requests.user_id = auth.uid()
        AND role_requests.role_slug = 'academia'
        AND (role_requests.status = 'aprobado' OR role_requests.status = 'approved')
      )
      OR
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_slug = 'superadmin'
      )
    )
  );

-- TEACHER
DROP POLICY IF EXISTS ins_profiles_teacher_own ON public.profiles_teacher;

CREATE POLICY ins_profiles_teacher_own ON public.profiles_teacher
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_slug = 'maestro'
      )
      OR
      EXISTS (
        SELECT 1 FROM public.role_requests
        WHERE role_requests.user_id = auth.uid()
        AND role_requests.role_slug = 'maestro'
        AND (role_requests.status = 'aprobado' OR role_requests.status = 'approved')
      )
      OR
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_slug = 'superadmin'
      )
    )
  );

-- BRAND
DROP POLICY IF EXISTS ins_profiles_brand_own ON public.profiles_brand;

CREATE POLICY ins_profiles_brand_own ON public.profiles_brand
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_slug = 'marca'
      )
      OR
      EXISTS (
        SELECT 1 FROM public.role_requests
        WHERE role_requests.user_id = auth.uid()
        AND role_requests.role_slug = 'marca'
        AND (role_requests.status = 'aprobado' OR role_requests.status = 'approved')
      )
      OR
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_slug = 'superadmin'
      )
    )
  );

-- ========================================
-- 3️⃣ VERIFICAR políticas creadas
-- ========================================

SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles_organizer', 'profiles_academy', 'profiles_teacher', 'profiles_brand')
AND policyname LIKE 'ins_%'
ORDER BY tablename;

-- ========================================
-- ✅ POLÍTICAS CREADAS
-- ========================================
-- Ahora los usuarios con roles aprobados pueden:
-- 1. Crear su perfil de organizador/academia/teacher/brand
-- 2. Solo si tienen el rol en user_roles O solicitud aprobada
-- 3. Superadmins pueden crear cualquier perfil

