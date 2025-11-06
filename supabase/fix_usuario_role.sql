-- ========================================
-- FIX: Asignar rol 'usuario' al Usuario Regular
-- ========================================

-- Verificar si el rol 'usuario' existe en la tabla roles
INSERT INTO public.roles (slug, name, description) 
VALUES ('usuario', 'Usuario', 'Usuario regular de la plataforma')
ON CONFLICT (slug) DO NOTHING;

-- Asignar rol al Usuario Regular
INSERT INTO public.user_roles (user_id, role_slug)
VALUES ('00000000-0000-0000-0000-000000000004', 'usuario')
ON CONFLICT (user_id, role_slug) DO NOTHING;

-- Verificar
SELECT 
  u.email,
  p.display_name,
  ur.role_slug
FROM auth.users u
LEFT JOIN public.profiles_user p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'usuario@staging.baileapp.com';

