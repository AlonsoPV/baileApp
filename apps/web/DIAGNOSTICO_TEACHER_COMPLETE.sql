-- Diagnóstico Completo de Profiles Teacher
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1. VERIFICAR ESTRUCTURA DE LA TABLA
-- ============================================
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles_teacher'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- 2. VERIFICAR CONSTRAINTS
-- ============================================
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles_teacher'::regclass
ORDER BY conname;

-- ============================================
-- 3. VERIFICAR TRIGGERS
-- ============================================
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles_teacher'
AND event_object_schema = 'public'
ORDER BY trigger_name;

-- ============================================
-- 4. VERIFICAR POLÍTICAS RLS
-- ============================================
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles_teacher'
ORDER BY policyname;

-- ============================================
-- 5. VERIFICAR DATOS EXISTENTES
-- ============================================
SELECT 
    id,
    user_id,
    nombre_publico,
    CASE 
        WHEN cronograma IS NOT NULL THEN jsonb_array_length(cronograma)
        ELSE 0
    END as num_clases,
    CASE 
        WHEN costos IS NOT NULL THEN jsonb_array_length(costos)
        ELSE 0
    END as num_costos,
    estado_aprobacion,
    created_at
FROM public.profiles_teacher
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 6. INTENTAR INSERT DE PRUEBA (comentado)
-- ============================================
-- Descomenta para probar insert
/*
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Obtener tu user_id
    test_user_id := '39555d3a-68fa-4bbe-b35e-c12756477285'::UUID;
    
    -- Intentar insert
    INSERT INTO public.profiles_teacher (
        user_id,
        nombre_publico,
        bio,
        zonas,
        ubicaciones,
        cronograma,
        costos,
        redes_sociales,
        estado_aprobacion,
        ritmos_seleccionados
    ) VALUES (
        test_user_id,
        'Test Teacher',
        'Test bio',
        ARRAY[7, 6, 8]::BIGINT[],
        '[]'::JSONB,
        '[]'::JSONB,
        '[]'::JSONB,
        '{"instagram": "", "facebook": "", "whatsapp": ""}'::JSONB,
        'aprobado',
        ARRAY['salsa_on1', 'bachata_tradicional']::TEXT[]
    )
    ON CONFLICT (user_id) DO UPDATE SET
        nombre_publico = EXCLUDED.nombre_publico,
        bio = EXCLUDED.bio,
        zonas = EXCLUDED.zonas,
        ubicaciones = EXCLUDED.ubicaciones,
        cronograma = EXCLUDED.cronograma,
        costos = EXCLUDED.costos,
        redes_sociales = EXCLUDED.redes_sociales,
        estado_aprobacion = EXCLUDED.estado_aprobacion,
        ritmos_seleccionados = EXCLUDED.ritmos_seleccionados;
    
    RAISE NOTICE '✅ Insert/Update exitoso';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;
*/

-- ============================================
-- 7. VERIFICAR USER_ROLES
-- ============================================
SELECT 
    role_slug,
    created_at
FROM public.user_roles
WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285'::UUID
ORDER BY created_at;

-- ============================================
-- 8. VERIFICAR ROLE_REQUESTS
-- ============================================
SELECT 
    role_slug,
    status,
    created_at
FROM public.role_requests
WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285'::UUID
ORDER BY created_at DESC;

