-- ================================================
-- 📊 ÍNDICES DE RENDIMIENTO
-- ================================================
-- Script para crear índices en columnas frecuentemente usadas en filtros y joins
-- Optimiza consultas en Supabase mejorando el rendimiento de búsquedas y filtros
-- ================================================
-- Ejecutar en Supabase SQL Editor o como migración
-- ================================================
-- 
-- NOTA: Este script verifica la existencia de columnas antes de crear índices
-- para evitar errores si alguna columna no existe en el esquema
-- ================================================


-- ================================================
-- 1. ÍNDICES PARA TABLA: clase_asistencias
-- ================================================
-- Optimiza búsquedas por usuario, academia y ordenamiento por fecha

-- Índice para created_at (ordenamiento y filtros por fecha)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clase_asistencias' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_clase_asistencias_created_at 
    ON public.clase_asistencias(created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_clase_asistencias_created_at: %', SQLERRM;
END $$;

-- Nota: Ya existen índices para user_id, academy_id, class_id, status
-- Verificar si existen antes de crear nuevos:
-- idx_clase_asistencias_user (user_id)
-- idx_clase_asistencias_academy (academy_id)
-- idx_clase_asistencias_class (class_id)
-- idx_clase_asistencias_status (status)

-- ================================================
-- 2. ÍNDICES PARA TABLA: event_rsvp
-- ================================================
-- Optimiza búsquedas por usuario, evento y ordenamiento por fecha

-- Índice para created_at (ordenamiento y filtros por fecha)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'event_rsvp' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_event_rsvp_created_at 
    ON public.event_rsvp(created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_event_rsvp_created_at: %', SQLERRM;
END $$;

-- Nota: Ya existen índices para event_date_id y user_id
-- Verificar si existen antes de crear nuevos:
-- idx_event_rsvp_event_date (event_date_id)
-- idx_event_rsvp_user (user_id)

-- ================================================
-- 3. ÍNDICES PARA TABLA: events_date
-- ================================================
-- Optimiza búsquedas por evento padre, zona, ritmo y ordenamiento por fecha

-- Índice para parent_id (joins con events_parent)
CREATE INDEX IF NOT EXISTS idx_events_date_parent_id 
ON public.events_date(parent_id);

-- Índice para created_at (ordenamiento y filtros por fecha)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events_date' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_events_date_created_at 
    ON public.events_date(created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_events_date_created_at: %', SQLERRM;
END $$;

-- Índice para zona (filtros por zona geográfica)
-- Nota: Ajustar nombre de columna según esquema real (puede ser 'zona', 'zona_id', etc.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events_date' 
    AND column_name = 'zona'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_events_date_zona 
    ON public.events_date(zona) 
    WHERE zona IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_events_date_zona: %', SQLERRM;
END $$;

-- Índice compuesto para búsquedas frecuentes: parent_id + created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events_date' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_events_date_parent_created 
    ON public.events_date(parent_id, created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_events_date_parent_created: %', SQLERRM;
END $$;

-- ================================================
-- 4. ÍNDICES PARA TABLA: events_parent
-- ================================================
-- Optimiza búsquedas por organizador y ordenamiento por fecha

-- Índice para organizer_id (filtros por organizador)
CREATE INDEX IF NOT EXISTS idx_events_parent_organizer_id 
ON public.events_parent(organizer_id) 
WHERE organizer_id IS NOT NULL;

-- Índice para created_at (ordenamiento y filtros por fecha)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events_parent' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_events_parent_created_at 
    ON public.events_parent(created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_events_parent_created_at: %', SQLERRM;
END $$;

-- Índice compuesto para búsquedas frecuentes: organizer_id + created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events_parent' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_events_parent_organizer_created 
    ON public.events_parent(organizer_id, created_at DESC) 
    WHERE organizer_id IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_events_parent_organizer_created: %', SQLERRM;
END $$;

-- ================================================
-- 5. ÍNDICES PARA TABLA: profiles_academy
-- ================================================
-- Optimiza búsquedas por usuario y ordenamiento por fecha

-- Índice para user_id (joins con auth.users)
CREATE INDEX IF NOT EXISTS idx_profiles_academy_user_id 
ON public.profiles_academy(user_id) 
WHERE user_id IS NOT NULL;

-- Índice para created_at (ordenamiento y filtros por fecha)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_academy' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_academy_created_at 
    ON public.profiles_academy(created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_profiles_academy_created_at: %', SQLERRM;
END $$;

-- Índice compuesto para búsquedas frecuentes: user_id + created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_academy' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_academy_user_created 
    ON public.profiles_academy(user_id, created_at DESC) 
    WHERE user_id IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_profiles_academy_user_created: %', SQLERRM;
END $$;

-- ================================================
-- 6. ÍNDICES PARA TABLA: profiles_teacher
-- ================================================
-- Optimiza búsquedas por usuario y ordenamiento por fecha

-- Índice para user_id (joins con auth.users)
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_user_id 
ON public.profiles_teacher(user_id) 
WHERE user_id IS NOT NULL;

-- Índice para created_at (ordenamiento y filtros por fecha)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_teacher' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_teacher_created_at 
    ON public.profiles_teacher(created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_profiles_teacher_created_at: %', SQLERRM;
END $$;

-- Índice compuesto para búsquedas frecuentes: user_id + created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_teacher' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_teacher_user_created 
    ON public.profiles_teacher(user_id, created_at DESC) 
    WHERE user_id IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_profiles_teacher_user_created: %', SQLERRM;
END $$;

-- ================================================
-- 7. ÍNDICES PARA TABLA: profiles_organizer
-- ================================================
-- Optimiza búsquedas por usuario y ordenamiento por fecha

-- Índice para user_id (joins con auth.users)
CREATE INDEX IF NOT EXISTS idx_profiles_organizer_user_id 
ON public.profiles_organizer(user_id) 
WHERE user_id IS NOT NULL;

-- Índice para created_at (ordenamiento y filtros por fecha)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_organizer' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_organizer_created_at 
    ON public.profiles_organizer(created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_profiles_organizer_created_at: %', SQLERRM;
END $$;

-- Índice compuesto para búsquedas frecuentes: user_id + created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_organizer' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_organizer_user_created 
    ON public.profiles_organizer(user_id, created_at DESC) 
    WHERE user_id IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_profiles_organizer_user_created: %', SQLERRM;
END $$;

-- ================================================
-- 8. ÍNDICES PARA TABLA: profiles_user
-- ================================================
-- Optimiza búsquedas por usuario y ordenamiento por fecha

-- Índice para user_id (primary key, pero útil para joins)
-- Nota: Si user_id es PRIMARY KEY, este índice puede ser redundante, pero lo dejamos por seguridad
CREATE INDEX IF NOT EXISTS idx_profiles_user_user_id 
ON public.profiles_user(user_id);

-- Índice para created_at (ordenamiento y filtros por fecha)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_user' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_user_created_at 
    ON public.profiles_user(created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_profiles_user_created_at: %', SQLERRM;
END $$;

-- Índice para updated_at (útil para sincronización y ordenamiento)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles_user' 
    AND column_name = 'updated_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_user_updated_at 
    ON public.profiles_user(updated_at DESC) 
    WHERE updated_at IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_profiles_user_updated_at: %', SQLERRM;
END $$;

-- ================================================
-- 9. ÍNDICES PARA TABLA: user_roles
-- ================================================
-- Optimiza búsquedas por usuario y rol

-- Índice para user_id (filtros por usuario)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON public.user_roles(user_id);

-- Índice para role_slug (filtros por rol)
CREATE INDEX IF NOT EXISTS idx_user_roles_role_slug 
ON public.user_roles(role_slug) 
WHERE role_slug IS NOT NULL;

-- Índice compuesto para búsquedas frecuentes: user_id + role_slug
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
ON public.user_roles(user_id, role_slug);

-- Índice para created_at (ordenamiento y filtros por fecha)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_user_roles_created_at 
    ON public.user_roles(created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_user_roles_created_at: %', SQLERRM;
END $$;

-- ================================================
-- 10. ÍNDICES PARA TABLA: challenges
-- ================================================
-- Optimiza búsquedas por creador y ordenamiento por fecha

-- Índice para owner_id (filtros por creador)
-- Nota: La tabla challenges usa owner_id, no user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'challenges' 
    AND column_name = 'owner_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_challenges_owner_id 
    ON public.challenges(owner_id) 
    WHERE owner_id IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_challenges_owner_id: %', SQLERRM;
END $$;

-- Índice para created_at (ordenamiento y filtros por fecha)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'challenges' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_challenges_created_at 
    ON public.challenges(created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_challenges_created_at: %', SQLERRM;
END $$;

-- Índice compuesto para búsquedas frecuentes: user_id/owner_id + created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'challenges' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_challenges_owner_created 
    ON public.challenges(owner_id, created_at DESC) 
    WHERE owner_id IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_challenges_owner_created: %', SQLERRM;
END $$;

-- ================================================
-- 11. ÍNDICES PARA TABLA: challenge_submissions
-- ================================================
-- Optimiza búsquedas por usuario, challenge y ordenamiento por fecha

-- Índice para user_id (filtros por usuario)
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_user_id 
ON public.challenge_submissions(user_id);

-- Índice para challenge_id (filtros por challenge)
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_challenge_id 
ON public.challenge_submissions(challenge_id);

-- Índice para created_at (ordenamiento y filtros por fecha)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'challenge_submissions' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_challenge_submissions_created_at 
    ON public.challenge_submissions(created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_challenge_submissions_created_at: %', SQLERRM;
END $$;

-- Índice compuesto para búsquedas frecuentes: challenge_id + created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'challenge_submissions' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_challenge_submissions_challenge_created 
    ON public.challenge_submissions(challenge_id, created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_challenge_submissions_challenge_created: %', SQLERRM;
END $$;

-- Índice compuesto para búsquedas frecuentes: user_id + challenge_id
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_user_challenge 
ON public.challenge_submissions(user_id, challenge_id);

-- ================================================
-- 12. ÍNDICES PARA TABLA: competition_groups
-- ================================================
-- Optimiza búsquedas por propietario, academia y ordenamiento por fecha

-- Índice para created_at (ordenamiento y filtros por fecha)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'competition_groups' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_competition_groups_created_at 
    ON public.competition_groups(created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_competition_groups_created_at: %', SQLERRM;
END $$;

-- Índice compuesto para búsquedas frecuentes: owner_id + created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'competition_groups' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_competition_groups_owner_created 
    ON public.competition_groups(owner_id, created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_competition_groups_owner_created: %', SQLERRM;
END $$;

-- Índice compuesto para búsquedas frecuentes: academy_id + created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'competition_groups' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_competition_groups_academy_created 
    ON public.competition_groups(academy_id, created_at DESC) 
    WHERE academy_id IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_competition_groups_academy_created: %', SQLERRM;
END $$;

-- Nota: Ya existen índices para owner_id, academy_id, is_active
-- Verificar si existen antes de crear nuevos:
-- idx_competition_groups_owner (owner_id)
-- idx_competition_groups_academy (academy_id)
-- idx_competition_groups_active (is_active)

-- ================================================
-- 13. ÍNDICES PARA TABLA: competition_group_members
-- ================================================
-- Optimiza búsquedas por grupo, usuario y ordenamiento por fecha

-- Índice para created_at o joined_at (ordenamiento y filtros por fecha)
CREATE INDEX IF NOT EXISTS idx_competition_group_members_joined_at 
ON public.competition_group_members(joined_at DESC);

-- Nota: Ya existen índices para group_id, user_id, is_active
-- Verificar si existen antes de crear nuevos:
-- idx_competition_group_members_group (group_id)
-- idx_competition_group_members_user (user_id)
-- idx_competition_group_members_active (is_active)

-- ================================================
-- 14. ÍNDICES PARA TABLA: academy_ratings
-- ================================================
-- Optimiza búsquedas por academia, usuario y ordenamiento por fecha

-- Índice para created_at (ordenamiento y filtros por fecha)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'academy_ratings' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_academy_ratings_created_at 
    ON public.academy_ratings(created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_academy_ratings_created_at: %', SQLERRM;
END $$;

-- Índice compuesto para búsquedas frecuentes: academy_id + created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'academy_ratings' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_academy_ratings_academy_created 
    ON public.academy_ratings(academy_id, created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_academy_ratings_academy_created: %', SQLERRM;
END $$;

-- Índice compuesto para búsquedas frecuentes: user_id + created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'academy_ratings' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_academy_ratings_user_created 
    ON public.academy_ratings(user_id, created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_academy_ratings_user_created: %', SQLERRM;
END $$;

-- Nota: Ya existe UNIQUE constraint en (academy_id, user_id) que actúa como índice

-- ================================================
-- 15. ÍNDICES PARA TABLA: follows (si existe)
-- ================================================
-- Optimiza búsquedas por seguidor, seguido y ordenamiento por fecha

-- Índice para follower_id (filtros por seguidor)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'follows' 
    AND column_name = 'follower_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_follows_follower_id 
    ON public.follows(follower_id) 
    WHERE follower_id IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_follows_follower_id: %', SQLERRM;
END $$;

-- Índice para following_id (filtros por seguido)
-- Nota: La tabla follows usa following_id, no followee_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'follows' 
    AND column_name = 'following_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_follows_following_id 
    ON public.follows(following_id) 
    WHERE following_id IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_follows_following_id: %', SQLERRM;
END $$;

-- Índice para created_at (ordenamiento y filtros por fecha)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'follows' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_follows_created_at 
    ON public.follows(created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_follows_created_at: %', SQLERRM;
END $$;

-- Índice compuesto para búsquedas frecuentes: follower_id + created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'follows' 
    AND column_name = 'created_at'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'follows' 
    AND column_name = 'follower_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_follows_follower_created 
    ON public.follows(follower_id, created_at DESC) 
    WHERE follower_id IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_follows_follower_created: %', SQLERRM;
END $$;

-- ================================================
-- 16. ÍNDICES PARA TABLA: notifications (si existe)
-- ================================================
-- Optimiza búsquedas por usuario y ordenamiento por fecha

-- Índice para user_id (filtros por usuario)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON public.notifications(user_id);

-- Índice para created_at (ordenamiento y filtros por fecha)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
    ON public.notifications(created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_notifications_created_at: %', SQLERRM;
END $$;

-- Índice compuesto para búsquedas frecuentes: user_id + created_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
    ON public.notifications(user_id, created_at DESC);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo crear índice idx_notifications_user_created: %', SQLERRM;
END $$;

-- Índice para is_read (filtros por estado de lectura)
CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
ON public.notifications(is_read) 
WHERE is_read IS NOT NULL;

-- ================================================
-- COMENTARIOS FINALES
-- ================================================
-- 
-- Este script crea índices en las columnas más frecuentemente usadas en:
-- - Filtros WHERE (user_id, academy_id, organizer_id, etc.)
-- - Joins entre tablas (parent_id, user_id, etc.)
-- - Ordenamiento ORDER BY (created_at DESC)
-- - Búsquedas compuestas (índices compuestos)
--
-- IMPORTANTE:
-- - Los índices mejoran el rendimiento de SELECT pero pueden ralentizar INSERT/UPDATE
-- - Usar CREATE INDEX CONCURRENTLY en producción para evitar bloqueos largos
-- - Monitorear el uso de índices con EXPLAIN ANALYZE
-- - Eliminar índices no utilizados para mejorar el rendimiento de escritura
--
-- Para ejecutar en producción con CONCURRENTLY (evita bloqueos):
-- CREATE INDEX CONCURRENTLY idx_nombre ON tabla(columna);
--
-- ================================================

