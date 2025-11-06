-- ========================================
-- 🎓 COMPLETAR DATOS DE CLASES Y EVENTOS
-- ========================================
-- Este script agrega cronogramas, costos, ubicaciones a:
-- - Academia de prueba
-- - Maestro de prueba (a crear)
-- - Eventos (fechas con horarios y costos completos)

-- ========================================
-- 1. VERIFICAR Y CREAR COLUMNAS NECESARIAS
-- ========================================

DO $$
BEGIN
  -- Columnas para profiles_academy
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles_academy' AND column_name = 'cronograma'
  ) THEN
    ALTER TABLE public.profiles_academy ADD COLUMN cronograma jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Columna cronograma creada en profiles_academy';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles_academy' AND column_name = 'costos'
  ) THEN
    ALTER TABLE public.profiles_academy ADD COLUMN costos jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Columna costos creada en profiles_academy';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles_academy' AND column_name = 'ubicaciones'
  ) THEN
    ALTER TABLE public.profiles_academy ADD COLUMN ubicaciones jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Columna ubicaciones creada en profiles_academy';
  END IF;

  -- Columnas para profiles_teacher
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles_teacher' AND column_name = 'cronograma'
  ) THEN
    ALTER TABLE public.profiles_teacher ADD COLUMN cronograma jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Columna cronograma creada en profiles_teacher';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles_teacher' AND column_name = 'costos'
  ) THEN
    ALTER TABLE public.profiles_teacher ADD COLUMN costos jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Columna costos creada en profiles_teacher';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles_teacher' AND column_name = 'ubicaciones'
  ) THEN
    ALTER TABLE public.profiles_teacher ADD COLUMN ubicaciones jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Columna ubicaciones creada en profiles_teacher';
  END IF;

  -- Columnas para events_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'events_date' AND column_name = 'cronograma'
  ) THEN
    ALTER TABLE public.events_date ADD COLUMN cronograma jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Columna cronograma creada en events_date';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'events_date' AND column_name = 'costos'
  ) THEN
    ALTER TABLE public.events_date ADD COLUMN costos jsonb DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ Columna costos creada en events_date';
  END IF;
END $$;

-- ========================================
-- 2. CREAR MAESTRO DE PRUEBA
-- ========================================

DO $$
BEGIN
  -- Usuario Maestro
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000005'
  ) THEN
    INSERT INTO auth.users (
      id, email, email_confirmed_at, encrypted_password,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role
    ) VALUES (
      '00000000-0000-0000-0000-000000000005',
      'maestro@staging.baileapp.com',
      now(),
      crypt('Maestro123!', gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      'authenticated',
      'authenticated'
    );
    RAISE NOTICE '✅ Usuario Maestro creado';
  END IF;

  -- Perfil de usuario
  IF NOT EXISTS (SELECT 1 FROM public.profiles_user WHERE user_id = '00000000-0000-0000-0000-000000000005') THEN
    INSERT INTO public.profiles_user (user_id, email, display_name, onboarding_complete, bio, ritmos, zonas)
    VALUES (
      '00000000-0000-0000-0000-000000000005',
      'maestro@staging.baileapp.com',
      'Maestro de Prueba',
      true,
      'Profesor de salsa y bachata con 10 años de experiencia',
      ARRAY[1, 11, 13]::integer[], -- Salsa On1, Bachata Tradicional, Bachata Sensual
      ARRAY[6, 7]::integer[] -- CDMX Norte, CDMX Sur
    );
    RAISE NOTICE '✅ Perfil Maestro creado';
  END IF;

  -- Rol de maestro
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = '00000000-0000-0000-0000-000000000005' AND role_slug = 'maestro'
  ) THEN
    INSERT INTO public.user_roles (user_id, role_slug)
    VALUES ('00000000-0000-0000-0000-000000000005', 'maestro');
    RAISE NOTICE '✅ Rol Maestro asignado';
  END IF;

  -- Perfil específico de maestro
  IF NOT EXISTS (SELECT 1 FROM public.profiles_teacher WHERE user_id = '00000000-0000-0000-0000-000000000005') THEN
    INSERT INTO public.profiles_teacher (
      user_id, nombre_publico, bio, estado_aprobacion, ritmos, zonas
    ) VALUES (
      '00000000-0000-0000-0000-000000000005',
      'Maestro Salsa Staging',
      'Profesor especializado en salsa y bachata',
      'aprobado',
      ARRAY[1, 11, 13]::integer[],
      ARRAY[6, 7]::integer[]
    );
    RAISE NOTICE '✅ Perfil específico Maestro creado';
  END IF;
END $$;

-- ========================================
-- 3. AGREGAR CLASES A ACADEMIA
-- ========================================

UPDATE public.profiles_academy
SET 
  cronograma = '[
    {
      "titulo": "Salsa On1 Principiantes",
      "diasSemana": ["Lunes", "Miércoles"],
      "inicio": "19:00",
      "fin": "20:30",
      "nivel": "Principiante",
      "ritmo": 1
    },
    {
      "titulo": "Bachata Sensual Intermedio",
      "diasSemana": ["Martes", "Jueves"],
      "inicio": "20:00",
      "fin": "21:30",
      "nivel": "Intermedio",
      "ritmo": 13
    },
    {
      "titulo": "Salsa On2 Avanzado",
      "diasSemana": ["Viernes"],
      "inicio": "19:30",
      "fin": "21:00",
      "nivel": "Avanzado",
      "ritmo": 26
    },
    {
      "titulo": "Bachata Tradicional",
      "diasSemana": ["Sábado"],
      "inicio": "11:00",
      "fin": "13:00",
      "nivel": "Todos los niveles",
      "ritmo": 11
    }
  ]'::jsonb,
  costos = '[
    {
      "tipo": "Mensual",
      "precio": 800,
      "descripcion": "Acceso ilimitado a todas las clases"
    },
    {
      "tipo": "Por clase",
      "precio": 100,
      "descripcion": "Pago individual por clase"
    },
    {
      "tipo": "Paquete 10 clases",
      "precio": 850,
      "descripcion": "10 clases para usar cuando quieras (válido 3 meses)"
    },
    {
      "tipo": "Prueba gratis",
      "precio": 0,
      "descripcion": "Primera clase sin costo"
    }
  ]'::jsonb,
  ubicaciones = '[
    {
      "nombre": "Sede Centro",
      "direccion": "Av. Insurgentes Sur 123, Col. Hipódromo",
      "ciudad": "Ciudad de México",
      "codigoPostal": "06700",
      "latitud": 19.4326,
      "longitud": -99.1332,
      "referencias": "Cerca del metro Insurgentes, entre Sonora y Orizaba"
    }
  ]'::jsonb
WHERE user_id = '00000000-0000-0000-0000-000000000003';

-- ========================================
-- 4. AGREGAR CLASES A MAESTRO
-- ========================================

UPDATE public.profiles_teacher
SET 
  cronograma = '[
    {
      "titulo": "Clases Privadas de Salsa",
      "diasSemana": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
      "inicio": "flexible",
      "fin": "flexible",
      "nivel": "Todos los niveles",
      "ritmo": 1,
      "modalidad": "Privada"
    },
    {
      "titulo": "Bachata Sensual Parejas",
      "diasSemana": ["Sábado"],
      "inicio": "17:00",
      "fin": "19:00",
      "nivel": "Intermedio/Avanzado",
      "ritmo": 13,
      "modalidad": "Grupal"
    },
    {
      "titulo": "Taller de Footwork Salsa",
      "diasSemana": ["Domingo"],
      "inicio": "12:00",
      "fin": "14:00",
      "nivel": "Avanzado",
      "ritmo": 1,
      "modalidad": "Taller"
    }
  ]'::jsonb,
  costos = '[
    {
      "tipo": "Clase privada individual",
      "precio": 500,
      "descripcion": "1 hora de clase personalizada"
    },
    {
      "tipo": "Clase privada parejas",
      "precio": 800,
      "descripcion": "1 hora para pareja"
    },
    {
      "tipo": "Clase grupal",
      "precio": 150,
      "descripcion": "Por clase en grupo (sábado)"
    },
    {
      "tipo": "Taller especial",
      "precio": 300,
      "descripcion": "Taller dominical de 2 horas"
    }
  ]'::jsonb,
  ubicaciones = '[
    {
      "nombre": "Estudio Personal",
      "direccion": "Calle Ámsterdam 45, Col. Condesa",
      "ciudad": "Ciudad de México",
      "codigoPostal": "06140",
      "latitud": 19.4112,
      "longitud": -99.1726,
      "referencias": "A dos cuadras del Parque México"
    }
  ]'::jsonb
WHERE user_id = '00000000-0000-0000-0000-000000000005';

-- ========================================
-- 5. COMPLETAR DATOS DEL EVENTO (Fecha)
-- ========================================

UPDATE public.events_date
SET 
  cronograma = '[
    {
      "hora": "20:00",
      "actividad": "Apertura de puertas",
      "descripcion": "Recepción y registro"
    },
    {
      "hora": "20:30",
      "actividad": "Clase de Salsa On1",
      "descripcion": "Clase grupal para todos los niveles (30 min)"
    },
    {
      "hora": "21:00",
      "actividad": "Social abierto",
      "descripcion": "Baile libre con DJ"
    },
    {
      "hora": "23:00",
      "actividad": "Performance especial",
      "descripcion": "Show de bailarines profesionales"
    },
    {
      "hora": "23:30",
      "actividad": "Continuación del social",
      "descripcion": "Baile hasta el cierre"
    },
    {
      "hora": "02:00",
      "actividad": "Cierre",
      "descripcion": "Fin del evento"
    }
  ]'::jsonb,
  costos = '[
    {
      "tipo": "Entrada general",
      "precio": 150,
      "descripcion": "Incluye clase y social completo"
    },
    {
      "tipo": "VIP",
      "precio": 250,
      "descripcion": "Acceso prioritario + bebida de cortesía"
    },
    {
      "tipo": "Mesa reservada (4 personas)",
      "precio": 1200,
      "descripcion": "Mesa privada con servicio de botella"
    },
    {
      "tipo": "Preventa",
      "precio": 120,
      "descripcion": "Precio especial comprando con anticipación"
    }
  ]'::jsonb,
  requisitos = 'Mayores de 18 años. Cambio de calzado obligatorio.'
WHERE nombre = 'Social de Salsa - Viernes';

-- ========================================
-- 6. VERIFICACIÓN FINAL
-- ========================================

-- Academia
SELECT 
  '🏫 ACADEMIA' as tipo,
  nombre_publico,
  jsonb_array_length(cronograma) as num_clases,
  jsonb_array_length(costos) as num_costos,
  jsonb_array_length(ubicaciones) as num_ubicaciones
FROM public.profiles_academy
WHERE user_id = '00000000-0000-0000-0000-000000000003';

-- Maestro
SELECT 
  '🎓 MAESTRO' as tipo,
  nombre_publico,
  jsonb_array_length(cronograma) as num_clases,
  jsonb_array_length(costos) as num_costos,
  jsonb_array_length(ubicaciones) as num_ubicaciones
FROM public.profiles_teacher
WHERE user_id = '00000000-0000-0000-0000-000000000005';

-- Evento
SELECT 
  '📅 EVENTO' as tipo,
  nombre,
  fecha,
  hora_inicio,
  hora_fin,
  jsonb_array_length(cronograma) as num_actividades,
  jsonb_array_length(costos) as num_opciones_precio
FROM public.events_date
WHERE nombre = 'Social de Salsa - Viernes';

-- ========================================
-- 7. MOSTRAR DATOS COMPLETOS
-- ========================================

-- Ver clases de Academia
SELECT 
  '📚 CLASES DE ACADEMIA' as seccion,
  cronograma
FROM public.profiles_academy
WHERE user_id = '00000000-0000-0000-0000-000000000003';

-- Ver clases de Maestro
SELECT 
  '📚 CLASES DE MAESTRO' as seccion,
  cronograma
FROM public.profiles_teacher
WHERE user_id = '00000000-0000-0000-0000-000000000005';

-- Ver cronograma del evento
SELECT 
  '🎉 CRONOGRAMA DEL EVENTO' as seccion,
  cronograma
FROM public.events_date
WHERE nombre = 'Social de Salsa - Viernes';

-- ========================================
-- 8. RESUMEN DE CREDENCIALES ACTUALIZADAS
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ USUARIOS DE PRUEBA - COMPLETO';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Super Admin: admin@staging.baileapp.com / Admin123!';
  RAISE NOTICE '   Rol: superadmin';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Organizador: organizador@staging.baileapp.com / Orga123!';
  RAISE NOTICE '   Rol: organizador';
  RAISE NOTICE '   Evento: Social de Salsa - Viernes (próxima semana)';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Academia: academia@staging.baileapp.com / Acad123!';
  RAISE NOTICE '   Rol: academia';
  RAISE NOTICE '   Clases: 4 (Salsa On1, Bachata Sensual, Salsa On2, Bachata Tradicional)';
  RAISE NOTICE '   Ubicaciones: 1 (Sede Centro)';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Maestro: maestro@staging.baileapp.com / Maestro123!';
  RAISE NOTICE '   Rol: maestro';
  RAISE NOTICE '   Clases: 3 (Privadas, Bachata Parejas, Taller Footwork)';
  RAISE NOTICE '   Ubicaciones: 1 (Estudio Personal)';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Usuario: usuario@staging.baileapp.com / User123!';
  RAISE NOTICE '   Rol: usuario';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

