-- ============================================================================
-- VERIFICACIÓN COMPLETA DE MIGRACIÓN EN PRODUCCIÓN
-- ============================================================================
-- Ejecuta este script para verificar que todo está correctamente migrado
-- ============================================================================

-- ============================================================================
-- 1. RESUMEN EJECUTIVO
-- ============================================================================

SELECT 
    'Superadmins' as sistema,
    (SELECT COUNT(*)::text FROM public.user_roles WHERE role_slug = 'superadmin') as count,
    'Debe ser >= 1' as esperado
UNION ALL
SELECT 'Vistas Públicas', 
    COUNT(*)::text, 
    '5 (academies, brands, organizers, teachers, user)' 
FROM information_schema.views 
WHERE table_schema = 'public' AND table_name LIKE '%public%'
UNION ALL
SELECT 'Challenges Tables', 
    COUNT(*)::text, 
    '3 (challenges, submissions, votes)' 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'challenge%'
UNION ALL
SELECT 'Trending Tables', 
    COUNT(*)::text, 
    '4 (trendings, candidates, ritmos, votes)' 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'trending%'
UNION ALL
SELECT 'RSVP Functions', 
    COUNT(*)::text, 
    '>= 6' 
FROM pg_proc WHERE proname LIKE '%rsvp%'
UNION ALL
SELECT 'Classes Tables', 
    COUNT(*)::text, 
    '2 (academy_classes, teacher_classes)' 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%classes%'
UNION ALL
SELECT 'Storage Buckets', 
    COUNT(*)::text, 
    '1-2 (media, event-flyers)' 
FROM storage.buckets
UNION ALL
SELECT 'Storage Policies', 
    COUNT(*)::text, 
    '>= 4' 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- ============================================================================
-- 2. VISTAS PÚBLICAS
-- ============================================================================

SELECT '=== VISTAS PÚBLICAS ===' as seccion;

SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE '%public%'
ORDER BY table_name;

-- ============================================================================
-- 3. FUNCIONES HELPER
-- ============================================================================

SELECT '=== FUNCIONES HELPER ===' as seccion;

SELECT proname, proargnames
FROM pg_proc 
WHERE proname IN ('is_superadmin', 'user_role_in')
ORDER BY proname;

-- ============================================================================
-- 4. CHALLENGES
-- ============================================================================

SELECT '=== SISTEMA CHALLENGES ===' as seccion;

-- Tablas
SELECT 'Tablas:' as tipo, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'challenge%'
ORDER BY table_name;

-- RPCs
SELECT 'RPCs:' as tipo, proname as table_name
FROM pg_proc 
WHERE proname LIKE 'challenge_%'
ORDER BY proname;

-- Columnas importantes
SELECT 'Columnas challenges:' as tipo, column_name as table_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'challenges'
  AND column_name IN ('cover_image_url', 'owner_video_url', 'requirements');

-- ============================================================================
-- 5. TRENDING
-- ============================================================================

SELECT '=== SISTEMA TRENDING ===' as seccion;

-- Tablas
SELECT 'Tablas:' as tipo, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'trending%'
ORDER BY table_name;

-- RPCs
SELECT 'RPCs:' as tipo, proname as table_name
FROM pg_proc 
WHERE proname LIKE 'rpc_trending_%'
ORDER BY proname;

-- ============================================================================
-- 6. RSVP
-- ============================================================================

SELECT '=== SISTEMA RSVP ===' as seccion;

-- Tabla
SELECT 'Tabla event_rsvp existe:' as tipo, 
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'event_rsvp'
    )::text as table_name;

-- Funciones
SELECT 'Funciones:' as tipo, proname as table_name
FROM pg_proc 
WHERE proname LIKE '%rsvp%'
ORDER BY proname;

-- Triggers
SELECT 'Triggers:' as tipo, trigger_name as table_name
FROM information_schema.triggers
WHERE trigger_name LIKE '%rsvp%';

-- ============================================================================
-- 7. CLASES
-- ============================================================================

SELECT '=== SISTEMA DE CLASES ===' as seccion;

-- Tablas
SELECT 'Tablas:' as tipo, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%classes%'
ORDER BY table_name;

-- Vistas
SELECT 'Vistas:' as tipo, table_name 
FROM information_schema.views 
WHERE table_schema = 'public' AND table_name LIKE '%classes%'
ORDER BY table_name;

-- ============================================================================
-- 8. STORAGE
-- ============================================================================

SELECT '=== STORAGE BUCKETS ===' as seccion;

-- Buckets
SELECT 
    id,
    name,
    public,
    file_size_limit / 1048576 as size_mb,
    array_length(allowed_mime_types, 1) as mime_types_count
FROM storage.buckets
ORDER BY name;

-- Políticas
SELECT 
    'Total Policies:' as bucket_name,
    COUNT(*)::text as policy_count
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
UNION ALL
SELECT 
    'SELECT Policies:' as bucket_name,
    COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects' AND cmd = 'SELECT'
UNION ALL
SELECT 
    'INSERT Policies:' as bucket_name,
    COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects' AND cmd = 'INSERT';

-- ============================================================================
-- 9. TIPOS DE DATOS
-- ============================================================================

SELECT '=== VERIFICACIÓN DE TIPOS DE DATOS ===' as seccion;

-- ritmos_seleccionados debe ser _text
SELECT 
    table_name,
    column_name,
    udt_name,
    CASE WHEN udt_name = '_text' THEN '✅' ELSE '❌' END as correcto
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'ritmos_seleccionados'
ORDER BY table_name;

-- zonas debe ser _int4
SELECT 
    table_name,
    column_name,
    udt_name,
    CASE WHEN udt_name = '_int4' THEN '✅' ELSE '❌' END as correcto
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'zonas'
ORDER BY table_name;

-- estilos debe ser _int4
SELECT 
    table_name,
    column_name,
    udt_name,
    CASE WHEN udt_name = '_int4' THEN '✅' ELSE '❌' END as correcto
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'estilos'
ORDER BY table_name;

-- ============================================================================
-- 10. CONTADORES
-- ============================================================================

SELECT '=== CONTADORES Y ESTADÍSTICAS ===' as seccion;

SELECT 
    'Usuarios' as tabla,
    COUNT(*) as total
FROM public.profiles_user
UNION ALL
SELECT 'Academias', COUNT(*) FROM public.profiles_academy
UNION ALL
SELECT 'Maestros', COUNT(*) FROM public.profiles_teacher
UNION ALL
SELECT 'Organizadores', COUNT(*) FROM public.profiles_organizer
UNION ALL
SELECT 'Marcas', COUNT(*) FROM public.profiles_brand
UNION ALL
SELECT 'Eventos Parent', COUNT(*) FROM public.events_parent
UNION ALL
SELECT 'Eventos Date', COUNT(*) FROM public.events_date
UNION ALL
SELECT 'Challenges', COUNT(*) FROM public.challenges
UNION ALL
SELECT 'Trendings', COUNT(*) FROM public.trendings
UNION ALL
SELECT 'RSVPs', COUNT(*) FROM public.event_rsvp
UNION ALL
SELECT 'Academy Classes', COUNT(*) FROM public.academy_classes
UNION ALL
SELECT 'Teacher Classes', COUNT(*) FROM public.teacher_classes;

-- ============================================================================
-- FIN DE VERIFICACIÓN
-- ============================================================================

SELECT '=== ✅ VERIFICACIÓN COMPLETA ===' as resultado;

