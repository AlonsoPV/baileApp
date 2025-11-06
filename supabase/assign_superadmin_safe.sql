-- ============================================
-- ASIGNAR SUPERADMIN DE FORMA SEGURA
-- ============================================
-- Este script verifica primero que el usuario existe
-- y luego asigna los roles
-- ============================================

-- 1. DIAGNÓSTICO: Verificar si el usuario existe en auth.users
DO $$
DECLARE
  v_user_id uuid := '0c20805f-519c-4e8e-9081-341ab64e504d';
  v_user_exists boolean;
  v_actual_user_id uuid;
BEGIN
  -- Verificar en auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = v_user_id
  ) INTO v_user_exists;
  
  IF v_user_exists THEN
    RAISE NOTICE '✅ Usuario encontrado en auth.users: %', v_user_id;
  ELSE
    RAISE NOTICE '❌ Usuario NO encontrado en auth.users: %', v_user_id;
    RAISE NOTICE 'ℹ️ Buscando usuario actual en profiles_user...';
    
    -- Intentar encontrar el usuario actual en profiles_user
    SELECT user_id INTO v_actual_user_id
    FROM profiles_user
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_actual_user_id IS NOT NULL THEN
      RAISE NOTICE '✅ Usuario encontrado en profiles_user: %', v_actual_user_id;
      RAISE NOTICE 'ℹ️ Usa este ID en lugar del anterior';
    END IF;
  END IF;
END $$;

-- 2. Listar todos los usuarios en auth.users (para encontrar el correcto)
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 3. Listar usuarios en profiles_user
SELECT 
  user_id,
  email,
  display_name,
  created_at
FROM profiles_user
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- INSTRUCCIONES:
-- ============================================
-- 1. Ejecuta este script primero
-- 2. Identifica tu user_id correcto de las tablas anteriores
-- 3. Copia el user_id que aparece en auth.users
-- 4. Ejecuta el siguiente bloque reemplazando el user_id:
-- ============================================

-- 4. ASIGNAR ROLES (Reemplaza el user_id con el correcto)
-- Descomenta y ejecuta después de verificar el user_id correcto:

/*
DO $$
DECLARE
  v_user_id uuid := 'TU_USER_ID_AQUI';  -- ⚠️ REEMPLAZA ESTO
  v_role_slug text;
  v_roles text[] := ARRAY['superadmin', 'usuario', 'organizador', 'academia', 'maestro', 'marca'];
BEGIN
  -- Verificar que existen los roles
  INSERT INTO public.roles (slug, name, description)
  VALUES 
    ('superadmin', 'Super Admin', 'Administrador con acceso total al sistema'),
    ('usuario', 'Usuario', 'Usuario regular de la plataforma'),
    ('organizador', 'Organizador', 'Organiza eventos sociales'),
    ('academia', 'Academia', 'Academia de baile'),
    ('maestro', 'Maestro', 'Maestro de baile'),
    ('marca', 'Marca', 'Marca comercial')
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;
  
  RAISE NOTICE '✅ Roles verificados/creados';
  
  -- Asignar roles
  FOREACH v_role_slug IN ARRAY v_roles
  LOOP
    INSERT INTO public.user_roles (user_id, role_slug)
    VALUES (v_user_id, v_role_slug)
    ON CONFLICT (user_id, role_slug) DO NOTHING;
    
    RAISE NOTICE '✅ Rol % asignado', v_role_slug;
  END LOOP;
  
  RAISE NOTICE '🎉 Todos los roles asignados correctamente';
END $$;

-- Verificar roles asignados
SELECT 
  ur.user_id,
  ur.role_slug,
  r.name as role_name,
  ur.created_at
FROM public.user_roles ur
LEFT JOIN public.roles r ON r.slug = ur.role_slug
WHERE ur.user_id = 'TU_USER_ID_AQUI'  -- ⚠️ REEMPLAZA ESTO
ORDER BY ur.created_at DESC;
*/

