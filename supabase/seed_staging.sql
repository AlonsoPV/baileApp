-- /supabase/seed_staging.sql
-- ========================================
-- 🧪 SEED DATA FOR STAGING ENVIRONMENT (Supabase/PostgreSQL)
-- ========================================
-- Requisitos:
-- 1) Habilitar pgcrypto para usar crypt()/gen_salt()
-- 2) Este script asume que puedes escribir en auth.users desde el SQL editor (service role).
--    Si tu proyecto lo bloquea, crea usuarios vía API Admin (GoTrue) en lugar de SQL.

-- 0) EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- <- evita "function gen_salt(unknown) does not exist"

-- 0.1) (Opcional) Verificar esquema mínimo de auth.users para evitar columnas faltantes.
-- Si tu instancia no tiene alguna columna (p.ej. role/aud), comenta esas columnas en los INSERTs.
DO $$
DECLARE
  has_encrypted_password boolean;
  has_updated_at boolean;
  has_role boolean;
  has_aud boolean;
BEGIN
  SELECT TRUE INTO has_encrypted_password
  FROM information_schema.columns
  WHERE table_schema='auth' AND table_name='users' AND column_name='encrypted_password'
  LIMIT 1;

  SELECT TRUE INTO has_updated_at
  FROM information_schema.columns
  WHERE table_schema='auth' AND table_name='users' AND column_name='updated_at'
  LIMIT 1;

  SELECT TRUE INTO has_role
  FROM information_schema.columns
  WHERE table_schema='auth' AND table_name='users' AND column_name='role'
  LIMIT 1;

  SELECT TRUE INTO has_aud
  FROM information_schema.columns
  WHERE table_schema='auth' AND table_name='users' AND column_name='aud'
  LIMIT 1;

  IF NOT has_encrypted_password THEN
    RAISE EXCEPTION 'La columna auth.users.encrypted_password no existe en esta instancia. Usa API Admin para crear usuarios.';
  END IF;

  IF NOT has_updated_at THEN
    RAISE NOTICE 'auth.users.updated_at no existe: se omitirá en inserts.';
  END IF;

  IF NOT has_role THEN
    RAISE NOTICE 'auth.users.role no existe: se omitirá en inserts.';
  END IF;

  IF NOT has_aud THEN
    RAISE NOTICE 'auth.users.aud no existe: se omitirá en inserts.';
  END IF;
END
$$;

-- ========================================
-- 1. CREAR USUARIOS DE PRUEBA
-- ========================================

-- Helper: INSERT a auth.users tolerante a columnas opcionales
-- NOTA: Solo comentamos/activamos columnas si existen (ver DO previo).
-- Si tu instancia marca error por role/aud/updated_at, quítalas del INSERT.

-- Usuario 1: Super Admin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001'
  ) THEN
    INSERT INTO auth.users (
      id,
      email,
      email_confirmed_at,
      encrypted_password,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    )
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'admin@staging.baileapp.com',
      now(),
      crypt('Admin123!', gen_salt('bf')),  -- requiere pgcrypto
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      'authenticated',
      'authenticated'
    );
    RAISE NOTICE 'Usuario Super Admin creado';
  ELSE
    RAISE NOTICE 'Usuario Super Admin ya existe';
  END IF;

  -- Perfil de Super Admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles_user WHERE user_id = '00000000-0000-0000-0000-000000000001') THEN
    INSERT INTO public.profiles_user (
      user_id, email, display_name, onboarding_complete, bio, ritmos, zonas
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      'admin@staging.baileapp.com',
      'Admin de Prueba',
      true,
      'Usuario administrador para staging',
      ARRAY[1, 4]::integer[],
      ARRAY[1, 2]::integer[]
    );
    RAISE NOTICE 'Perfil Super Admin creado';
  END IF;

  -- Rol de Super Admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = '00000000-0000-0000-0000-000000000001' AND role_slug = 'superadmin'
  ) THEN
    INSERT INTO public.user_roles (user_id, role_slug)
    VALUES ('00000000-0000-0000-0000-000000000001', 'superadmin');
    RAISE NOTICE 'Rol Super Admin asignado';
  END IF;
END $$;

-- Usuario 2: Organizador
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000002'
  ) THEN
    INSERT INTO auth.users (
      id, email, email_confirmed_at, encrypted_password,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role
    )
    VALUES (
      '00000000-0000-0000-0000-000000000002',
      'organizador@staging.baileapp.com',
      now(),
      crypt('Orga123!', gen_salt('bf')),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      'authenticated',
      'authenticated'
    );
    RAISE NOTICE 'Usuario Organizador creado';
  ELSE
    RAISE NOTICE 'Usuario Organizador ya existe';
  END IF;

  -- Perfil de Organizador
  IF NOT EXISTS (SELECT 1 FROM public.profiles_user WHERE user_id = '00000000-0000-0000-0000-000000000002') THEN
    INSERT INTO public.profiles_user (user_id, email, display_name, onboarding_complete)
    VALUES (
      '00000000-0000-0000-0000-000000000002',
      'organizador@staging.baileapp.com',
      'Organizador de Prueba',
      true
    );
    RAISE NOTICE 'Perfil Organizador creado';
  END IF;

  -- Rol de Organizador
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = '00000000-0000-0000-0000-000000000002' AND role_slug = 'organizador'
  ) THEN
    INSERT INTO public.user_roles (user_id, role_slug)
    VALUES ('00000000-0000-0000-0000-000000000002', 'organizador');
    RAISE NOTICE 'Rol Organizador asignado';
  END IF;

  -- Perfil específico de Organizador
  IF NOT EXISTS (SELECT 1 FROM public.profiles_organizer WHERE user_id = '00000000-0000-0000-0000-000000000002') THEN
    INSERT INTO public.profiles_organizer (
      user_id, nombre_publico, bio, estado_aprobacion, ritmos, zonas
    ) VALUES (
      '00000000-0000-0000-0000-000000000002',
      'Sociales de Prueba',
      'Organizador de eventos de salsa y bachata',
      'aprobado',
      ARRAY[1, 4]::integer[],
      ARRAY[6]::integer[]
    );
    RAISE NOTICE 'Perfil específico Organizador creado';
  END IF;
END $$;

-- Usuario 3: Academia
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000003'
  ) THEN
    INSERT INTO auth.users (
      id, email, email_confirmed_at, encrypted_password,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role
    )
    VALUES (
      '00000000-0000-0000-0000-000000000003',
      'academia@staging.baileapp.com',
      now(),
      crypt('Acad123!', gen_salt('bf')),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      'authenticated',
      'authenticated'
    );
    RAISE NOTICE 'Usuario Academia creado';
  ELSE
    RAISE NOTICE 'Usuario Academia ya existe';
  END IF;

  -- Perfil de Academia
  IF NOT EXISTS (SELECT 1 FROM public.profiles_user WHERE user_id = '00000000-0000-0000-0000-000000000003') THEN
    INSERT INTO public.profiles_user (user_id, email, display_name, onboarding_complete)
    VALUES (
      '00000000-0000-0000-0000-000000000003',
      'academia@staging.baileapp.com',
      'Academia de Prueba',
      true
    );
    RAISE NOTICE 'Perfil Academia creado';
  END IF;

  -- Rol de Academia
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = '00000000-0000-0000-0000-000000000003' AND role_slug = 'academia'
  ) THEN
    INSERT INTO public.user_roles (user_id, role_slug)
    VALUES ('00000000-0000-0000-0000-000000000003', 'academia');
    RAISE NOTICE 'Rol Academia asignado';
  END IF;

  -- Perfil específico de Academia
  IF NOT EXISTS (SELECT 1 FROM public.profiles_academy WHERE user_id = '00000000-0000-0000-0000-000000000003') THEN
    INSERT INTO public.profiles_academy (
      user_id, nombre_publico, bio, estado_aprobacion, ritmos, zonas
    ) VALUES (
      '00000000-0000-0000-0000-000000000003',
      'Academia Dance Staging',
      'Academia de baile para staging',
      'aprobado',
      ARRAY[1, 4]::integer[],
      ARRAY[6, 7]::integer[]
    );
    RAISE NOTICE 'Perfil específico Academia creado';
  END IF;

  -- Actualizar cronograma y costos si las columnas existen
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles_academy' 
      AND column_name = 'cronograma'
  ) THEN
    UPDATE public.profiles_academy
    SET cronograma = '[{"titulo":"Salsa On1 Principiantes","diasSemana":["Lunes","Miércoles"],"inicio":"19:00","fin":"20:30"}]'::jsonb
    WHERE user_id = '00000000-0000-0000-0000-000000000003';
    RAISE NOTICE 'Cronograma actualizado';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles_academy' 
      AND column_name = 'costos'
  ) THEN
    UPDATE public.profiles_academy
    SET costos = '[{"tipo":"Mensual","precio":800}]'::jsonb
    WHERE user_id = '00000000-0000-0000-0000-000000000003';
    RAISE NOTICE 'Costos actualizados';
  END IF;
END $$;

-- Usuario 4: Usuario Regular (para testing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000004'
  ) THEN
    INSERT INTO auth.users (
      id, email, email_confirmed_at, encrypted_password,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role
    )
    VALUES (
      '00000000-0000-0000-0000-000000000004',
      'usuario@staging.baileapp.com',
      now(),
      crypt('User123!', gen_salt('bf')),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      'authenticated',
      'authenticated'
    );
    RAISE NOTICE 'Usuario Regular creado';
  ELSE
    RAISE NOTICE 'Usuario Regular ya existe';
  END IF;

  -- Perfil de Usuario Regular
  IF NOT EXISTS (SELECT 1 FROM public.profiles_user WHERE user_id = '00000000-0000-0000-0000-000000000004') THEN
    INSERT INTO public.profiles_user (
      user_id, email, display_name, onboarding_complete, bio, ritmos, zonas
    ) VALUES (
      '00000000-0000-0000-0000-000000000004',
      'usuario@staging.baileapp.com',
      'Usuario Regular',
      true,
      'Bailarín de salsa y bachata',
      ARRAY[1, 4, 5]::integer[],
      ARRAY[1, 2]::integer[]
    );
    RAISE NOTICE 'Perfil Usuario Regular creado';
  END IF;

  -- Rol de Usuario Regular
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = '00000000-0000-0000-0000-000000000004' AND role_slug = 'usuario'
  ) THEN
    INSERT INTO public.user_roles (user_id, role_slug)
    VALUES ('00000000-0000-0000-0000-000000000004', 'usuario');
    RAISE NOTICE 'Rol Usuario asignado';
  END IF;
END $$;

-- ========================================
-- 2. CREAR EVENTO DE PRUEBA
-- ========================================

DO $$
BEGIN
  -- Evento Padre (Social)
  IF NOT EXISTS (
    SELECT 1 FROM public.events_parent 
    WHERE organizer_id = '00000000-0000-0000-0000-000000000002'
      AND nombre = 'Social de Salsa Staging'
  ) THEN
    INSERT INTO public.events_parent (nombre, descripcion, organizer_id, estilos, zonas)
    VALUES (
      'Social de Salsa Staging',
      'Social de prueba para ambiente de staging',
      '00000000-0000-0000-0000-000000000002',
      ARRAY[1, 4]::integer[],
      ARRAY[6]::integer[]
    );
    RAISE NOTICE 'Evento padre creado';
  ELSE
    RAISE NOTICE 'Evento padre ya existe';
  END IF;

  -- Fecha de Evento
  -- La fecha del evento es la de inicio (viernes), pero puede terminar en la madrugada del día siguiente (sábado)
  IF NOT EXISTS (
    SELECT 1 FROM public.events_date ed
    JOIN public.events_parent ep ON ed.parent_id = ep.id
    WHERE ep.nombre = 'Social de Salsa Staging'
      AND ed.nombre = 'Social de Salsa - Viernes'
  ) THEN
    INSERT INTO public.events_date (
      parent_id, nombre, fecha, hora_inicio, hora_fin,
      lugar, direccion, ciudad, zona, estilos
    )
    SELECT 
      ep.id,
      'Social de Salsa - Viernes',
      (CURRENT_DATE + INTERVAL '7 days')::date, -- Fecha = día de inicio (viernes)
      '20:00:00'::time, -- Inicia viernes 8:00 PM
      '02:00:00'::time, -- Termina sábado 2:00 AM (día siguiente)
      'Salón de Baile Staging',
      'Av. Insurgentes Sur 123',
      'Ciudad de México',
      6,
      ARRAY[1]::integer[]
    FROM public.events_parent ep
    WHERE ep.nombre = 'Social de Salsa Staging'
    LIMIT 1;
    RAISE NOTICE 'Fecha de evento creada';
  ELSE
    RAISE NOTICE 'Fecha de evento ya existe';
  END IF;
END $$;

-- ========================================
-- 3. RESUMEN DE CREDENCIALES
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ USUARIOS DE PRUEBA CREADOS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Super Admin: admin@staging.baileapp.com / Admin123!';
  RAISE NOTICE '👤 Organizador: organizador@staging.baileapp.com / Orga123!';
  RAISE NOTICE '👤 Academia:    academia@staging.baileapp.com / Acad123!';
  RAISE NOTICE '👤 Usuario:     usuario@staging.baileapp.com / User123!';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

SELECT 
  u.email,
  p.display_name,
  ur.role_slug,
  CASE WHEN po.user_id IS NOT NULL THEN 'Sí' ELSE 'No' END AS tiene_perfil_organizador,
  CASE WHEN pa.user_id IS NOT NULL THEN 'Sí' ELSE 'No' END AS tiene_perfil_academia
FROM auth.users u
LEFT JOIN public.profiles_user p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.profiles_organizer po ON u.id = po.user_id
LEFT JOIN public.profiles_academy pa ON u.id = pa.user_id
WHERE u.email LIKE '%@staging.baileapp.com'
ORDER BY u.email;
