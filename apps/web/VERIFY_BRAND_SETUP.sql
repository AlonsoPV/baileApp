-- Verificar y corregir configuración completa de Brand
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que todas las columnas existen
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles_brand' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar vista pública
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'v_brands_public' 
        AND table_schema = 'public'
    ) THEN '✅ Vista existe' ELSE '❌ Vista no existe' END as vista_status;

-- 3. Recrear vista pública si es necesario
DROP VIEW IF EXISTS public.v_brands_public;
CREATE OR REPLACE VIEW public.v_brands_public AS
SELECT 
    id,
    user_id,
    nombre_publico,
    bio,
    avatar_url,
    portada_url,
    ritmos,
    zonas,
    redes_sociales,
    media,
    productos,
    estado_aprobacion,
    created_at,
    updated_at
FROM public.profiles_brand
WHERE estado_aprobacion = 'aprobado';

-- 4. Verificar políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles_brand' 
AND schemaname = 'public';

-- 5. Verificar que RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles_brand' 
AND schemaname = 'public';

-- 6. Crear un registro de prueba (solo si no existe)
DO $$
DECLARE
    test_user_id UUID;
    brand_count INTEGER;
BEGIN
    -- Obtener un usuario de prueba
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Contar marcas existentes para este usuario
        SELECT COUNT(*) INTO brand_count 
        FROM public.profiles_brand 
        WHERE user_id = test_user_id;
        
        -- Crear marca de prueba si no existe
        IF brand_count = 0 THEN
            INSERT INTO public.profiles_brand (
                user_id,
                nombre_publico,
                bio,
                ritmos,
                zonas,
                redes_sociales,
                media,
                productos,
                estado_aprobacion
            ) VALUES (
                test_user_id,
                'Marca de Prueba',
                'Esta es una marca de prueba para verificar el funcionamiento',
                ARRAY[1, 2, 3],
                ARRAY[1, 2],
                '{"instagram": "https://instagram.com/test", "web": "https://test.com"}'::jsonb,
                '[{"type": "image", "url": "https://via.placeholder.com/300x200"}]'::jsonb,
                '[{"titulo": "Producto de Prueba", "precio": 100, "moneda": "MXN"}]'::jsonb,
                'aprobado'
            );
            RAISE NOTICE '✅ Marca de prueba creada para usuario %', test_user_id;
        ELSE
            RAISE NOTICE '⚠️ Ya existe una marca para el usuario de prueba';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ No se encontró usuario para crear marca de prueba';
    END IF;
END $$;

-- 7. Verificar que la vista funciona
SELECT 
    COUNT(*) as total_brands_public,
    COUNT(CASE WHEN estado_aprobacion = 'aprobado' THEN 1 END) as approved_brands
FROM public.v_brands_public;

-- 8. Mostrar marcas públicas disponibles
SELECT 
    id,
    nombre_publico,
    bio,
    estado_aprobacion,
    created_at
FROM public.v_brands_public
ORDER BY created_at DESC
LIMIT 5;

-- 9. Verificar permisos de la vista
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name = 'v_brands_public' 
AND table_schema = 'public';

-- 10. Dar permisos a la vista si es necesario
GRANT SELECT ON public.v_brands_public TO public;
GRANT SELECT ON public.v_brands_public TO authenticated;

-- 11. Verificación final
DO $$
BEGIN
    RAISE NOTICE '🎉 Verificación completada!';
    RAISE NOTICE 'La tabla profiles_brand está configurada correctamente.';
    RAISE NOTICE 'La vista v_brands_public está funcionando.';
    RAISE NOTICE 'Puedes probar el módulo de Marca ahora.';
END $$;
