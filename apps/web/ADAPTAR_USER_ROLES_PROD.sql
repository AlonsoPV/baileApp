-- ============================================================================
-- ADAPTAR SISTEMA DE ROLES A LA ESTRUCTURA EXISTENTE EN PRODUCCIÓN
-- ============================================================================
-- Producción usa: id, user_id, role_slug, granted_at
-- Staging usa: user_id, role_name, created_at
-- Adaptamos las funciones helper para usar la estructura de producción
-- ============================================================================

BEGIN;

-- 1. Eliminar funciones existentes primero (CASCADE elimina políticas dependientes)
DROP FUNCTION IF EXISTS public.is_superadmin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_role_in(uuid, text[]) CASCADE;

-- 2. Crear función helper is_superadmin (adaptada a role_slug)
CREATE OR REPLACE FUNCTION public.is_superadmin(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id AND role_slug = 'superadmin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear función helper user_role_in (adaptada a role_slug)
CREATE OR REPLACE FUNCTION public.user_role_in(p_user_id uuid, p_roles text[])
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id 
          AND role_slug = ANY(p_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Habilitar RLS si no está habilitado
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

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

-- 6. Recrear políticas de otras tablas que dependen de is_superadmin

-- Políticas para challenge_submissions
DROP POLICY IF EXISTS cs_select ON public.challenge_submissions;
CREATE POLICY cs_select ON public.challenge_submissions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        public.is_superadmin(auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.challenges c 
            WHERE c.id = challenge_submissions.challenge_id 
              AND c.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS cs_update_moderation ON public.challenge_submissions;
CREATE POLICY cs_update_moderation ON public.challenge_submissions
    FOR UPDATE USING (
        public.is_superadmin(auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.challenges c 
            WHERE c.id = challenge_submissions.challenge_id 
              AND c.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS cs_delete ON public.challenge_submissions;
CREATE POLICY cs_delete ON public.challenge_submissions
    FOR DELETE USING (
        auth.uid() = user_id OR public.is_superadmin(auth.uid())
    );

-- Políticas para challenge_votes
DROP POLICY IF EXISTS votes_delete ON public.challenge_votes;
CREATE POLICY votes_delete ON public.challenge_votes
    FOR DELETE USING (
        auth.uid() = user_id OR public.is_superadmin(auth.uid())
    );

-- Políticas para trendings (ya las recreamos arriba en el paso 5)
-- Políticas para trending_ritmos (ya las recreamos arriba en el paso 5)
-- Políticas para trending_candidates (ya las recreamos arriba en el paso 5)

COMMIT;

-- ============================================================================
-- ASIGNAR SUPERADMIN
-- ============================================================================

-- IMPORTANTE: Reemplaza el UUID con tu user_id correcto de producción
-- Para encontrar tu user_id, ejecuta primero: FIND_MY_USER_ID_PROD.sql

-- Asignar rol superadmin a tu usuario
-- DESCOMENTA Y REEMPLAZA EL UUID CON TU USER_ID CORRECTO:
/*
INSERT INTO public.user_roles (id, user_id, role_slug, granted_at)
VALUES (
    gen_random_uuid(),
    'TU_USER_ID_AQUI',  -- REEMPLAZA ESTO
    'superadmin',
    now()
)
ON CONFLICT (user_id, role_slug) DO NOTHING;
*/

-- Ejemplo de cómo asignar (descomenta y usa tu UUID):
-- INSERT INTO public.user_roles (id, user_id, role_slug, granted_at)
-- VALUES (gen_random_uuid(), '12345678-1234-1234-1234-123456789abc', 'superadmin', now())
-- ON CONFLICT (user_id, role_slug) DO NOTHING;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- Ver todos los roles asignados
SELECT id, user_id, role_slug, granted_at
FROM public.user_roles
ORDER BY granted_at DESC;

-- Ver tus roles (reemplaza con tu user_id)
-- SELECT id, user_id, role_slug, granted_at
-- FROM public.user_roles
-- WHERE user_id = 'TU_USER_ID_AQUI';

-- Verificar función is_superadmin (reemplaza con tu user_id)
-- SELECT public.is_superadmin('TU_USER_ID_AQUI') as es_superadmin;

-- Ver políticas RLS
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Ver funciones helper
SELECT proname, proargnames
FROM pg_proc
WHERE proname IN ('is_superadmin', 'user_role_in')
ORDER BY proname;

