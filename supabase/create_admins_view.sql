-- ========================================
-- 🔧 CREAR VISTA 'admins' (Alias de user_roles)
-- ========================================
-- Algunos componentes buscan tabla 'admins' que no existe.
-- Esta vista mapea 'admins' a user_roles con role_slug = 'superadmin'

-- 1. Crear vista admins
DROP VIEW IF EXISTS public.admins CASCADE;

CREATE OR REPLACE VIEW public.admins AS
SELECT 
  user_id,
  created_at
FROM public.user_roles
WHERE role_slug = 'superadmin';

-- 2. Permitir SELECT público (para que hooks puedan verificar si es admin)
-- La vista hereda las políticas de user_roles, pero por si acaso:
COMMENT ON VIEW public.admins IS 'Vista que muestra usuarios con rol superadmin';

-- 3. Verificar
SELECT 
  'ADMINS' as tipo,
  COUNT(*) as total
FROM public.admins;

-- Deberías ver al menos 1 (admin@staging.baileapp.com)

-- 4. Ver lista de admins
SELECT * FROM public.admins;

