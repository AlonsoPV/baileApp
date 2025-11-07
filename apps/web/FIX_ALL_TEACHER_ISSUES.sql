-- Fix All Teacher Issues - Script completo para arreglar todos los problemas
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- PARTE 1: ARREGLAR USER_ROLES RLS
-- ============================================

-- 1.1 Eliminar políticas existentes
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_public" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_superadmin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_superadmin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_superadmin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_own" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_superadmin" ON public.user_roles;

-- 1.2 Crear política para que usuarios puedan ver sus propios roles
CREATE POLICY "user_roles_select_own"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- 1.3 Crear política para que superadmin pueda ver todos los roles
CREATE POLICY "user_roles_select_superadmin"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- ============================================
-- PARTE 2: ARREGLAR ROLE_REQUESTS
-- ============================================

-- 2.1 Verificar si la tabla existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_requests') THEN
        RAISE NOTICE '⚠️  Tabla role_requests no existe, creándola...';
        
        CREATE TABLE public.role_requests (
            id BIGSERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            role_slug TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            reviewed_by UUID REFERENCES auth.users(id),
            reviewed_at TIMESTAMPTZ,
            notes TEXT
        );
        
        -- Índices
        CREATE INDEX idx_role_requests_user_id ON public.role_requests(user_id);
        CREATE INDEX idx_role_requests_status ON public.role_requests(status);
        
        -- Habilitar RLS
        ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE '✅ Tabla role_requests creada';
    ELSE
        RAISE NOTICE '✅ Tabla role_requests ya existe';
    END IF;
END $$;

-- 2.2 Eliminar políticas existentes de role_requests
DROP POLICY IF EXISTS "role_requests_select_own" ON public.role_requests;
DROP POLICY IF EXISTS "role_requests_select_superadmin" ON public.role_requests;
DROP POLICY IF EXISTS "role_requests_insert_own" ON public.role_requests;
DROP POLICY IF EXISTS "role_requests_update_superadmin" ON public.role_requests;

-- 2.3 Crear políticas para role_requests
CREATE POLICY "role_requests_select_own"
ON public.role_requests
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "role_requests_select_superadmin"
ON public.role_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

CREATE POLICY "role_requests_insert_own"
ON public.role_requests
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "role_requests_update_superadmin"
ON public.role_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_slug = 'superadmin'
  )
);

-- ============================================
-- PARTE 3: ARREGLAR PROFILES_TEACHER RLS
-- ============================================

-- 3.1 Ver políticas actuales
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles_teacher';

-- 3.2 Eliminar políticas existentes
DROP POLICY IF EXISTS "teacher_select_public_or_owner" ON public.profiles_teacher;
DROP POLICY IF EXISTS "teacher_insert_owner" ON public.profiles_teacher;
DROP POLICY IF EXISTS "teacher_update_owner" ON public.profiles_teacher;
DROP POLICY IF EXISTS "teacher_delete_owner" ON public.profiles_teacher;

-- 3.3 Crear políticas permisivas para profiles_teacher
-- SELECT: Cualquiera puede ver perfiles aprobados, el dueño puede ver el suyo
CREATE POLICY "teacher_select_public_or_owner"
ON public.profiles_teacher
FOR SELECT
USING (
  estado_aprobacion = 'aprobado'
  OR user_id = auth.uid()
);

-- INSERT: Solo el dueño puede crear su perfil
CREATE POLICY "teacher_insert_owner"
ON public.profiles_teacher
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE: Solo el dueño puede actualizar su perfil
CREATE POLICY "teacher_update_owner"
ON public.profiles_teacher
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE: Solo el dueño puede eliminar su perfil
CREATE POLICY "teacher_delete_owner"
ON public.profiles_teacher
FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- PARTE 4: VERIFICAR TRIGGERS
-- ============================================

-- 4.1 Verificar trigger de updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE event_object_table = 'profiles_teacher'
        AND trigger_name = 'set_updated_at'
    ) THEN
        RAISE NOTICE '⚠️  Trigger set_updated_at no existe, creándolo...';
        
        -- Crear función si no existe
        CREATE OR REPLACE FUNCTION public.set_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
        
        -- Crear trigger
        CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.profiles_teacher
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();
        
        RAISE NOTICE '✅ Trigger set_updated_at creado';
    ELSE
        RAISE NOTICE '✅ Trigger set_updated_at ya existe';
    END IF;
END $$;

-- ============================================
-- PARTE 5: TEST DE INSERT
-- ============================================

-- 5.1 Intentar insert de prueba
DO $$
DECLARE
    test_user_id UUID := '39555d3a-68fa-4bbe-b35e-c12756477285'::UUID;
    result_id BIGINT;
BEGIN
    RAISE NOTICE '🚀 Iniciando test de insert/update...';
    
    INSERT INTO public.profiles_teacher (
        user_id,
        nombre_publico,
        bio,
        zonas,
        ubicaciones,
        cronograma,
        costos,
        redes_sociales,
        estado_aprobacion,
        ritmos_seleccionados
    ) VALUES (
        test_user_id,
        'El Teacher',
        'Dando clases por toda CDMX',
        ARRAY[7, 6, 8]::BIGINT[],
        '[]'::JSONB,
        '[]'::JSONB,
        '[]'::JSONB,
        '{"instagram": "", "facebook": "", "whatsapp": ""}'::JSONB,
        'aprobado',
        ARRAY['salsa_on1', 'moderna', 'salsa_on2', 'twerk', 'boogiewoogie']::TEXT[]
    )
    ON CONFLICT (user_id) DO UPDATE SET
        nombre_publico = EXCLUDED.nombre_publico,
        bio = EXCLUDED.bio,
        zonas = EXCLUDED.zonas,
        ubicaciones = EXCLUDED.ubicaciones,
        cronograma = EXCLUDED.cronograma,
        costos = EXCLUDED.costos,
        redes_sociales = EXCLUDED.redes_sociales,
        estado_aprobacion = EXCLUDED.estado_aprobacion,
        ritmos_seleccionados = EXCLUDED.ritmos_seleccionados,
        updated_at = now()
    RETURNING id INTO result_id;
    
    RAISE NOTICE '✅ Insert/Update exitoso! ID: %', result_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR: %', SQLERRM;
        RAISE NOTICE '🔍 SQLSTATE: %', SQLSTATE;
END $$;

-- ============================================
-- PARTE 6: VERIFICACIÓN FINAL
-- ============================================

-- 6.1 Ver políticas finales de user_roles
SELECT 
  '=== USER_ROLES POLICIES ===' as section,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'user_roles'
ORDER BY policyname;

-- 6.2 Ver políticas finales de role_requests
SELECT 
  '=== ROLE_REQUESTS POLICIES ===' as section,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'role_requests'
ORDER BY policyname;

-- 6.3 Ver políticas finales de profiles_teacher
SELECT 
  '=== PROFILES_TEACHER POLICIES ===' as section,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles_teacher'
ORDER BY policyname;

-- 6.4 Ver perfil de teacher creado
SELECT 
  '=== TEACHER PROFILE ===' as section,
  id,
  nombre_publico,
  bio,
  estado_aprobacion,
  array_length(ritmos_seleccionados, 1) as num_ritmos
FROM public.profiles_teacher
WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285'::UUID;

