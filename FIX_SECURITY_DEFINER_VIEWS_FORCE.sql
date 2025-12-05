-- ============================================================================
-- 🔒 FORZAR ELIMINACIÓN DE SECURITY DEFINER EN VISTAS
-- ============================================================================
-- Este script fuerza la recreación de todas las vistas sin SECURITY DEFINER
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 1: ELIMINAR TODAS LAS VISTAS PROBLEMÁTICAS
-- ============================================================================

DROP VIEW IF EXISTS public.events_live CASCADE;
DROP VIEW IF EXISTS public.v_academies_public CASCADE;
DROP VIEW IF EXISTS public.organizers_live CASCADE;
DROP VIEW IF EXISTS public.v_challenge_submissions_enriched CASCADE;
DROP VIEW IF EXISTS public.v_user_public CASCADE;
DROP VIEW IF EXISTS public.v_events_dates_public CASCADE;
DROP VIEW IF EXISTS public.v_organizers_public CASCADE;
DROP VIEW IF EXISTS public.v_challenge_leaderboard CASCADE;
DROP VIEW IF EXISTS public.v_user_roles CASCADE;
DROP VIEW IF EXISTS public.v_teacher_classes_public CASCADE;
DROP VIEW IF EXISTS public.v_academy_classes_public CASCADE;
DROP VIEW IF EXISTS public.profiles_user_light CASCADE;
DROP VIEW IF EXISTS public.v_events_parent_public CASCADE;
DROP VIEW IF EXISTS public.v_academy_accepted_teachers CASCADE;
DROP VIEW IF EXISTS public.v_brands_public CASCADE;
DROP VIEW IF EXISTS public.academies_live CASCADE;
DROP VIEW IF EXISTS public.v_teacher_academies CASCADE;
DROP VIEW IF EXISTS public.v_teachers_public CASCADE;

-- ============================================================================
-- PARTE 2: RECREAR VISTAS SIN SECURITY DEFINER (EXPLÍCITAMENTE)
-- ============================================================================

-- 2.1 events_live
CREATE VIEW public.events_live AS
SELECT 
    ed.id,
    ed.parent_id,
    ed.nombre,
    ed.biografia,
    ed.fecha,
    ed.hora_inicio,
    ed.hora_fin,
    ed.lugar,
    ed.direccion,
    ed.ciudad,
    ed.zona,
    ed.referencias,
    ed.requisitos,
    ed.cronograma,
    ed.costos,
    ed.media,
    ed.flyer_url,
    ed.created_at,
    ed.updated_at,
    ep.nombre AS evento_nombre,
    ep.descripcion AS evento_descripcion,
    ep.biografia AS evento_biografia,
    ep.estilos AS evento_estilos,
    ep.zonas AS evento_zonas,
    ep.sede_general,
    ep.faq,
    ep.media AS evento_media,
    po.id AS organizador_id,
    po.user_id AS organizador_user_id,
    po.nombre_publico AS organizador_nombre,
    po.bio AS organizador_bio,
    po.media AS organizador_media,
    po.ritmos AS organizador_ritmos,
    po.ritmos_seleccionados AS organizador_ritmos_seleccionados,
    po.zonas AS organizador_zonas
FROM public.events_date ed
JOIN public.events_parent ep ON ed.parent_id = ep.id
JOIN public.profiles_organizer po ON ep.organizer_id = po.id
WHERE po.estado_aprobacion = 'aprobado'
  AND ed.fecha >= CURRENT_DATE;

GRANT SELECT ON public.events_live TO anon, authenticated;

-- 2.2 v_academies_public
CREATE VIEW public.v_academies_public  AS
SELECT 
    id,
    user_id,
    nombre_publico,
    bio,
    media,
    avatar_url,
    portada_url,
    ritmos,
    ritmos_seleccionados,
    zonas,
    redes_sociales,
    ubicaciones,
    horarios,
    cronograma,
    costos,
    estado_aprobacion,
    created_at,
    updated_at
FROM public.profiles_academy
WHERE estado_aprobacion = 'aprobado';

GRANT SELECT ON public.v_academies_public TO anon, authenticated;

-- 2.3 organizers_live
CREATE VIEW public.organizers_live  AS
SELECT 
    po.id,
    po.user_id,
    po.nombre_publico,
    po.bio,
    po.media,
    po.ritmos,
    po.ritmos_seleccionados,
    po.zonas,
    po.redes_sociales,
    po.faq,
    po.created_at,
    po.updated_at,
    po.estado_aprobacion
FROM public.profiles_organizer po
WHERE po.estado_aprobacion = 'aprobado';

GRANT SELECT ON public.organizers_live TO anon, authenticated;

-- 2.4 v_challenge_submissions_enriched
CREATE VIEW public.v_challenge_submissions_enriched  AS
SELECT 
    cs.id,
    cs.challenge_id,
    cs.user_id,
    cs.video_url,
    cs.caption,
    cs.status,
    cs.created_at,
    cs.updated_at,
    pu.display_name,
    pu.avatar_url,
    COUNT(cv.user_id)::int AS votes
FROM public.challenge_submissions cs
LEFT JOIN public.profiles_user pu ON pu.user_id = cs.user_id
LEFT JOIN public.challenge_votes cv ON cv.submission_id = cs.id
WHERE cs.status = 'approved'
GROUP BY cs.id, cs.challenge_id, cs.user_id, cs.video_url, cs.caption, 
         cs.status, cs.created_at, cs.updated_at, pu.display_name, pu.avatar_url;

GRANT SELECT ON public.v_challenge_submissions_enriched TO anon, authenticated;

-- 2.5 v_user_public
CREATE VIEW public.v_user_public  AS
SELECT 
    user_id,
    display_name,
    avatar_url,
    ritmos,
    zonas,
    bio,
    redes_sociales,
    created_at
FROM public.profiles_user
WHERE display_name IS NOT NULL 
  AND display_name != '';

GRANT SELECT ON public.v_user_public TO anon, authenticated;

-- 2.6 v_events_dates_public
CREATE VIEW public.v_events_dates_public  AS
SELECT 
    ed.*,
    ep.nombre AS evento_nombre,
    ep.organizer_id
FROM public.events_date ed
JOIN public.events_parent ep ON ed.parent_id = ep.id
JOIN public.profiles_organizer po ON ep.organizer_id = po.id
WHERE po.estado_aprobacion = 'aprobado'
  AND ed.fecha >= CURRENT_DATE;

GRANT SELECT ON public.v_events_dates_public TO anon, authenticated;

-- 2.7 v_organizers_public
CREATE VIEW public.v_organizers_public  AS
SELECT *
FROM public.profiles_organizer
WHERE estado_aprobacion = 'aprobado';

GRANT SELECT ON public.v_organizers_public TO anon, authenticated;

-- 2.8 v_challenge_leaderboard
CREATE VIEW public.v_challenge_leaderboard  AS
SELECT 
    s.challenge_id,
    s.id AS submission_id,
    s.user_id,
    COUNT(v.user_id)::int AS votes
FROM public.challenge_submissions s
LEFT JOIN public.challenge_votes v ON v.submission_id = s.id
WHERE s.status = 'approved'
GROUP BY s.challenge_id, s.id, s.user_id;

GRANT SELECT ON public.v_challenge_leaderboard TO anon, authenticated;

-- 2.9 v_user_roles
CREATE VIEW public.v_user_roles  AS
SELECT 
    ur.user_id,
    ur.role_slug,
    ur.granted_at AS created_at
FROM public.user_roles ur;

GRANT SELECT ON public.v_user_roles TO authenticated;

-- 2.10 v_teacher_classes_public
CREATE VIEW public.v_teacher_classes_public  AS
SELECT
    tc.id,
    tc.teacher_id,
    tc.nombre,
    tc.descripcion,
    tc.nivel,
    tc.ritmos_seleccionados,
    tc.dia_semana,
    tc.hora_inicio,
    tc.hora_fin,
    tc.costo,
    tc.ubicacion,
    tc.cupo_maximo,
    tc.created_at,
    t.nombre_publico AS teacher_nombre,
    t.avatar_url AS teacher_avatar
FROM public.teacher_classes tc
JOIN public.profiles_teacher t ON t.id = tc.teacher_id
WHERE tc.estado = 'activo'
  AND t.estado_aprobacion = 'aprobado';

GRANT SELECT ON public.v_teacher_classes_public TO anon, authenticated;

-- 2.11 v_academy_classes_public
CREATE VIEW public.v_academy_classes_public  AS
SELECT
    ac.id,
    ac.academy_id,
    ac.nombre,
    ac.descripcion,
    ac.nivel,
    ac.ritmos_seleccionados,
    ac.dia_semana,
    ac.hora_inicio,
    ac.hora_fin,
    ac.costo,
    ac.ubicacion,
    ac.cupo_maximo,
    ac.created_at,
    a.nombre_publico AS academy_nombre,
    a.avatar_url AS academy_avatar
FROM public.academy_classes ac
JOIN public.profiles_academy a ON a.id = ac.academy_id
WHERE ac.estado = 'activo'
  AND a.estado_aprobacion = 'aprobado';

GRANT SELECT ON public.v_academy_classes_public TO anon, authenticated;

-- 2.12 profiles_user_light
CREATE VIEW public.profiles_user_light  AS
SELECT 
    user_id,
    display_name,
    avatar_url,
    ritmos,
    zonas,
    bio,
    created_at
FROM public.profiles_user
WHERE display_name IS NOT NULL 
  AND display_name != '';

GRANT SELECT ON public.profiles_user_light TO anon, authenticated;

-- 2.13 v_events_parent_public
CREATE VIEW public.v_events_parent_public  AS
SELECT 
    ep.*
FROM public.events_parent ep
JOIN public.profiles_organizer po ON ep.organizer_id = po.id
WHERE po.estado_aprobacion = 'aprobado';

GRANT SELECT ON public.v_events_parent_public TO anon, authenticated;

-- 2.14 v_academy_accepted_teachers
CREATE VIEW public.v_academy_accepted_teachers  AS
SELECT 
    ati.academy_id,
    ati.teacher_id,
    ati.status,
    ati.created_at,
    ati.invited_at,
    ati.responded_at,
    pt.nombre_publico AS teacher_nombre,
    pt.avatar_url AS teacher_avatar
FROM public.academy_teacher_invitations ati
JOIN public.profiles_teacher pt ON pt.id = ati.teacher_id
WHERE ati.status = 'accepted';

GRANT SELECT ON public.v_academy_accepted_teachers TO anon, authenticated;

-- 2.15 v_brands_public
CREATE VIEW public.v_brands_public  AS
SELECT *
FROM public.profiles_brand
WHERE estado_aprobacion = 'aprobado';

GRANT SELECT ON public.v_brands_public TO anon, authenticated;

-- 2.16 academies_live (alias de v_academies_public)
CREATE VIEW public.academies_live  AS
SELECT * FROM public.v_academies_public;

GRANT SELECT ON public.academies_live TO anon, authenticated;

-- 2.17 v_teacher_academies
CREATE VIEW public.v_teacher_academies  AS
SELECT 
    ati.teacher_id,
    ati.academy_id,
    ati.status,
    ati.created_at,
    ati.invited_at,
    ati.responded_at,
    pa.nombre_publico AS academy_nombre,
    pa.avatar_url AS academy_avatar
FROM public.academy_teacher_invitations ati
JOIN public.profiles_academy pa ON pa.id = ati.academy_id
WHERE ati.status = 'accepted';

GRANT SELECT ON public.v_teacher_academies TO anon, authenticated;

-- 2.18 v_teachers_public
CREATE VIEW public.v_teachers_public  AS
SELECT *
FROM public.profiles_teacher
WHERE estado_aprobacion = 'aprobado';

GRANT SELECT ON public.v_teachers_public TO anon, authenticated;

-- ============================================================================
-- PARTE 3: CORREGIR VISTA 'admins' (NO ES TABLA, ES VISTA)
-- ============================================================================

-- 3.1 Verificar si admins es una vista o tabla
DO $$
BEGIN
    -- Si es una vista, no necesita RLS (las vistas no tienen RLS)
    -- Si es una tabla, necesita RLS
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'admins'
    ) THEN
        RAISE NOTICE 'ℹ️ admins es una vista, no necesita RLS';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'admins'
    ) THEN
        -- Es una tabla, habilitar RLS
        ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
        
        -- Política: solo superadmins pueden ver
        DROP POLICY IF EXISTS admins_select_superadmin ON public.admins;
        CREATE POLICY admins_select_superadmin ON public.admins
            FOR SELECT
            USING (public.is_superadmin(auth.uid()));
        
        RAISE NOTICE '✅ RLS habilitado en tabla admins';
    ELSE
        RAISE NOTICE 'ℹ️ admins no existe como vista ni tabla';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Verificar que las vistas NO tienen SECURITY DEFINER
-- Nota: En PostgreSQL, las vistas por defecto son SECURITY INVOKER
-- Si no se especifica SECURITY DEFINER explícitamente, son INVOKER
SELECT 
    v.viewname,
    CASE 
        WHEN v.definition LIKE '%SECURITY DEFINER%' THEN '❌ TIENE SECURITY DEFINER'
        ELSE '✅ SECURITY INVOKER (por defecto)'
    END AS security_status,
    -- Verificar si realmente tiene la propiedad en los metadatos
    CASE 
        WHEN c.reloptions IS NULL THEN 'Sin opciones (INVOKER por defecto)'
        WHEN array_to_string(c.reloptions, ', ') LIKE '%security_definer%' THEN '❌ TIENE security_definer'
        ELSE '✅ Sin security_definer'
    END AS metadata_status
FROM pg_views v
LEFT JOIN pg_class c ON c.relname = v.viewname AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
WHERE v.schemaname = 'public'
  AND v.viewname IN (
    'events_live',
    'v_academies_public',
    'organizers_live',
    'v_challenge_submissions_enriched',
    'v_user_public',
    'v_events_dates_public',
    'v_organizers_public',
    'v_challenge_leaderboard',
    'v_user_roles',
    'v_teacher_classes_public',
    'v_academy_classes_public',
    'profiles_user_light',
    'v_events_parent_public',
    'v_academy_accepted_teachers',
    'v_brands_public',
    'academies_live',
    'v_teacher_academies',
    'v_teachers_public'
  )
ORDER BY v.viewname;

-- Verificación adicional: buscar cualquier vista con SECURITY DEFINER
SELECT 
    'VISTAS CON SECURITY DEFINER (deben estar vacías):' AS info,
    viewname
FROM pg_views
WHERE schemaname = 'public'
  AND definition LIKE '%SECURITY DEFINER%';

