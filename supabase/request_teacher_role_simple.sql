-- ============================================
-- SOLICITAR ROL DE MAESTRO PARA USUARIO (VERSION SIMPLE)
-- ============================================
-- Usuario: de0ef151-cc92-43e5-95d9-f8fe9a59e670
-- Rol: maestro
-- ============================================

INSERT INTO public.roles (slug, name)
VALUES ('maestro', 'Maestro')
ON CONFLICT (slug) DO NOTHING;

-- 2. Obtener datos del usuario
WITH user_data AS (
  SELECT 
    COALESCE(
      (SELECT display_name FROM public.profiles_user WHERE user_id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'),
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'),
      (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'),
      'Usuario'
    ) as full_name,
    COALESCE(
      (SELECT email FROM public.profiles_user WHERE user_id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'),
      (SELECT email FROM auth.users WHERE id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'),
      ''
    ) as email,
    COALESCE(
      (SELECT respuestas->'redes'->>'whatsapp' FROM public.profiles_user WHERE user_id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'),
      (SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'),
      '0000000000'
    ) as phone
)
-- 3. Eliminar solicitud existente si está rechazada
DELETE FROM public.role_requests
WHERE user_id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'
  AND role_slug = 'maestro'
  AND status IN ('rechazado', 'rejected');

-- 4. Crear nueva solicitud (o actualizar si existe)
INSERT INTO public.role_requests (
  user_id,
  role_slug,
  role,
  full_name,
  email,
  phone,
  socials,
  status,
  created_at,
  updated_at
)
SELECT 
  'de0ef151-cc92-43e5-95d9-f8fe9a59e670'::uuid,
  'maestro',
  'maestro',
  COALESCE(
    (SELECT display_name FROM public.profiles_user WHERE user_id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'),
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'),
    'Usuario'
  ),
  COALESCE(
    (SELECT email FROM public.profiles_user WHERE user_id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'),
    (SELECT email FROM auth.users WHERE id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'),
    ''
  ),
  COALESCE(
    (SELECT respuestas->'redes'->>'whatsapp' FROM public.profiles_user WHERE user_id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'),
    (SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'),
    '0000000000'
  ),
  '{}'::jsonb,
  'pendiente',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.role_requests rr
  WHERE rr.user_id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'::uuid
    AND rr.role_slug = 'maestro'
);

-- 5. Verificar la solicitud creada
SELECT 
  id,
  user_id,
  role_slug,
  full_name,
  email,
  phone,
  status,
  created_at,
  updated_at
FROM public.role_requests
WHERE user_id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'
  AND role_slug = 'maestro'
ORDER BY created_at DESC
LIMIT 1;

