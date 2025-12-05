-- ============================================
-- SOLICITAR ROL DE MAESTRO PARA USUARIO
-- ============================================
-- Usuario: de0ef151-cc92-43e5-95d9-f8fe9a59e670
-- Rol: maestro
-- ============================================

DO $request_teacher_role$
DECLARE
  v_user_id uuid := 'de0ef151-cc92-43e5-95d9-f8fe9a59e670';
  v_full_name text;
  v_email text;
  v_phone text;
  v_user_exists boolean;
  v_profile_exists boolean;
  v_request_exists boolean;
  v_current_status text;
BEGIN
  -- 1. Verificar que el usuario existe en auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = v_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RAISE EXCEPTION 'Usuario no encontrado en auth.users: %', v_user_id;
  END IF;
  
  RAISE NOTICE 'Usuario encontrado en auth.users';
  
  -- 2. Obtener datos del usuario desde profiles_user
  SELECT 
    EXISTS(SELECT 1 FROM public.profiles_user WHERE user_id = v_user_id),
    COALESCE(
      (SELECT display_name FROM public.profiles_user WHERE user_id = v_user_id),
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = v_user_id),
      (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = v_user_id),
      'Usuario'
    ),
    COALESCE(
      (SELECT email FROM public.profiles_user WHERE user_id = v_user_id),
      (SELECT email FROM auth.users WHERE id = v_user_id),
      ''
    ),
    COALESCE(
      (SELECT respuestas->'redes'->>'whatsapp' FROM public.profiles_user WHERE user_id = v_user_id),
      (SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = v_user_id),
      ''
    )
  INTO v_profile_exists, v_full_name, v_email, v_phone;
  
  -- Si no hay perfil, usar datos básicos de auth.users
  IF NOT v_profile_exists THEN
    SELECT 
      COALESCE(
        raw_user_meta_data->>'full_name',
        raw_user_meta_data->>'name',
        email,
        'Usuario'
      ),
      COALESCE(email, ''),
      COALESCE(raw_user_meta_data->>'phone', '')
    INTO v_full_name, v_email, v_phone
    FROM auth.users
    WHERE id = v_user_id;
  END IF;
  
  -- Validar que tenemos datos mínimos
  IF v_full_name IS NULL OR v_full_name = '' THEN
    v_full_name := 'Usuario';
  END IF;
  
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'No se pudo obtener el email del usuario';
  END IF;
  
  IF v_phone IS NULL OR v_phone = '' THEN
    v_phone := '0000000000';
    RAISE NOTICE 'No se encontro telefono, usando valor por defecto';
  END IF;
  
  RAISE NOTICE 'Datos del usuario:';
  RAISE NOTICE '  Nombre: %', v_full_name;
  RAISE NOTICE '  Email: %', v_email;
  RAISE NOTICE '  Telefono: %', v_phone;
  
  -- 3. Verificar que el rol maestro existe en la tabla roles
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE slug = 'maestro') THEN
    INSERT INTO public.roles (slug, name)
    VALUES ('maestro', 'Maestro')
    ON CONFLICT (slug) DO NOTHING;
    RAISE NOTICE 'Rol maestro creado en tabla roles';
  ELSE
    RAISE NOTICE 'Rol maestro ya existe en tabla roles';
  END IF;
  
  -- 4. Verificar si ya existe una solicitud para este usuario y rol
  SELECT EXISTS(
    SELECT 1 FROM public.role_requests 
    WHERE user_id = v_user_id 
    AND role_slug = 'maestro'
  ) INTO v_request_exists;
  
  IF v_request_exists THEN
    -- Obtener el estado actual
    SELECT status INTO v_current_status
    FROM public.role_requests
    WHERE user_id = v_user_id AND role_slug = 'maestro';
    
    -- Si está rechazada, actualizar a pendiente
    IF v_current_status IN ('rechazado', 'rejected') THEN
      UPDATE public.role_requests
      SET 
        status = 'pendiente',
        role = 'maestro',
        full_name = v_full_name,
        email = v_email,
        phone = v_phone,
        updated_at = now()
      WHERE user_id = v_user_id 
        AND role_slug = 'maestro';
      
      RAISE NOTICE 'Solicitud existente actualizada a pendiente';
    ELSE
      RAISE NOTICE 'Ya existe una solicitud con estado: %', v_current_status;
      RAISE NOTICE 'No se modifico la solicitud existente';
    END IF;
  ELSE
    -- 5. Crear nueva solicitud
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
    VALUES (
      v_user_id,
      'maestro',
      'maestro',
      v_full_name,
      v_email,
      v_phone,
      '{}'::jsonb,
      'pendiente'::text,
      now(),
      now()
    );
    
    RAISE NOTICE 'Nueva solicitud de rol maestro creada exitosamente';
  END IF;
  
  RAISE NOTICE 'Proceso completado';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al crear solicitud: %', SQLERRM;
END $request_teacher_role$;

-- 6. Verificar la solicitud creada
SELECT 
  id,
  user_id,
  role_slug,
  full_name,
  email,
  phone,
  status,
  created_at,
  updated_at,
  '✅ Solicitud encontrada' as estado
FROM public.role_requests
WHERE user_id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'
  AND role_slug = 'maestro'
ORDER BY created_at DESC
LIMIT 1;

-- 7. Verificar datos del usuario
SELECT 
  'auth.users' as fuente,
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'phone' as phone
FROM auth.users
WHERE id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670'
UNION ALL
SELECT 
  'profiles_user' as fuente,
  user_id::text as id,
  email,
  display_name as full_name,
  respuestas->'redes'->>'whatsapp' as phone
FROM public.profiles_user
WHERE user_id = 'de0ef151-cc92-43e5-95d9-f8fe9a59e670';

-- ============================================
-- ✅ SCRIPT COMPLETADO
-- ============================================
-- El usuario ahora tiene una solicitud de rol "maestro"
-- con estado "pending" que puede ser aprobada por un admin
-- ============================================

