-- Test Teacher Insert - Probar insert directo para ver el error 500
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que el usuario existe en auth.users
SELECT 
    id,
    email,
    created_at
FROM auth.users
WHERE id = '39555d3a-68fa-4bbe-b35e-c12756477285'::UUID;

-- 2. Ver si ya existe un perfil de teacher
SELECT 
    id,
    user_id,
    nombre_publico,
    estado_aprobacion,
    created_at
FROM public.profiles_teacher
WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285'::UUID;

-- 3. Intentar INSERT/UPDATE con los datos exactos del frontend
DO $$
DECLARE
    test_user_id UUID := '39555d3a-68fa-4bbe-b35e-c12756477285'::UUID;
    result_id BIGINT;
BEGIN
    RAISE NOTICE '🚀 Iniciando test de insert/update...';
    
    -- Intentar insert con ON CONFLICT
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
        'El Teacher',
        'Dando clases por toda CDMX',
        ARRAY[7, 6, 8]::BIGINT[],
        '[]'::JSONB,
        '[]'::JSONB,
        '[]'::JSONB,
        '{"instagram": "", "facebook": "", "whatsapp": ""}'::JSONB,
        'aprobado',
        ARRAY['salsa_on1', 'moderna', 'salsa_on2', 'twerk', 'boogiewoogie']::TEXT[]
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
        ritmos_seleccionados = EXCLUDED.ritmos_seleccionados,
        updated_at = now()
    RETURNING id INTO result_id;
    
    RAISE NOTICE '✅ Insert/Update exitoso! ID: %', result_id;
    
    -- Mostrar el resultado
    RAISE NOTICE '📊 Verificando datos guardados...';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERROR: %', SQLERRM;
        RAISE NOTICE '🔍 SQLSTATE: %', SQLSTATE;
        RAISE NOTICE '📝 DETAIL: %', COALESCE(PG_EXCEPTION_DETAIL, 'No detail');
        RAISE NOTICE '💡 HINT: %', COALESCE(PG_EXCEPTION_HINT, 'No hint');
        RAISE NOTICE '🎯 CONTEXT: %', COALESCE(PG_EXCEPTION_CONTEXT, 'No context');
END $$;

-- 4. Verificar el resultado final
SELECT 
    id,
    user_id,
    nombre_publico,
    bio,
    zonas,
    array_length(ritmos_seleccionados, 1) as num_ritmos,
    ritmos_seleccionados,
    estado_aprobacion,
    created_at,
    updated_at
FROM public.profiles_teacher
WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285'::UUID;

-- 5. Verificar triggers activos
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles_teacher'
AND event_object_schema = 'public'
ORDER BY trigger_name;

-- 6. Verificar si hay funciones que puedan estar causando el error
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE proname LIKE '%teacher%'
OR proname LIKE '%profile%'
ORDER BY proname;

