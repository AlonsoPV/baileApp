-- ============================================================================
-- CREAR TABLA user_roles EN PRODUCCIÓN
-- ============================================================================
-- Sistema de roles para usuarios (superadmin, organizador, academia, etc.)
-- ============================================================================

BEGIN;

-- 1. Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_name text NOT NULL CHECK (role_name IN (
        'superadmin',
        'usuario',
        'organizador',
        'academia',
        'maestro',
        'marca'
    )),
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, role_name)
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON public.user_roles(role_name);

-- 3. Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Crear función helper is_superadmin (si no existe)
CREATE OR REPLACE FUNCTION public.is_superadmin(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id AND role_name = 'superadmin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Políticas RLS para user_roles
DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own ON public.user_roles
    FOR SELECT USING (
        auth.uid() = user_id OR public.is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS user_roles_insert_superadmin ON public.user_roles;
CREATE POLICY user_roles_insert_superadmin ON public.user_roles
    FOR INSERT WITH CHECK (
        public.is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS user_roles_update_superadmin ON public.user_roles;
CREATE POLICY user_roles_update_superadmin ON public.user_roles
    FOR UPDATE USING (
        public.is_superadmin(auth.uid())
    );

DROP POLICY IF EXISTS user_roles_delete_superadmin ON public.user_roles;
CREATE POLICY user_roles_delete_superadmin ON public.user_roles
    FOR DELETE USING (
        public.is_superadmin(auth.uid())
    );

-- 6. Crear función helper user_role_in
CREATE OR REPLACE FUNCTION public.user_role_in(p_user_id uuid, p_roles text[])
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id 
          AND role_name = ANY(p_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- Ver políticas RLS
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Ver funciones helper
SELECT proname, proargnames
FROM pg_proc
WHERE proname IN ('is_superadmin', 'user_role_in')
ORDER BY proname;

