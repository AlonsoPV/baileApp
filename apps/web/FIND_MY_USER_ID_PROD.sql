-- ============================================================================
-- ENCONTRAR TU USER_ID EN PRODUCCIÓN
-- ============================================================================

-- 1. Ver todos los usuarios en auth.users
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Buscar por email específico (reemplaza con tu email)
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE email ILIKE '%tu_email%'  -- Reemplaza 'tu_email' con parte de tu email
ORDER BY created_at DESC;

-- 3. Ver usuarios con roles asignados
SELECT 
    u.id,
    u.email,
    ur.role_slug,
    ur.granted_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at DESC;

-- 4. Contar usuarios
SELECT COUNT(*) as total_usuarios FROM auth.users;

