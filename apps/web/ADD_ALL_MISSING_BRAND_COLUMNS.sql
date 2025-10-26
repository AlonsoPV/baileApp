-- Agregar TODAS las columnas faltantes a profiles_brand
-- Basado en errores reportados: avatar_url, portada_url, etc.

-- 1. Verificar estado actual
DO $$
BEGIN
    RAISE NOTICE 'Iniciando migración completa de columnas faltantes...';
    RAISE NOTICE 'Agregando: avatar_url, portada_url, ritmos, zonas, productos, redes_sociales';
END $$;

-- 2. Agregar columna avatar_url
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'avatar_url' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_brand ADD COLUMN avatar_url TEXT;
        RAISE NOTICE '✅ Columna avatar_url agregada';
    ELSE
        RAISE NOTICE '⚠️ Columna avatar_url ya existe';
    END IF;
END $$;

-- 3. Agregar columna portada_url
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'portada_url' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_brand ADD COLUMN portada_url TEXT;
        RAISE NOTICE '✅ Columna portada_url agregada';
    ELSE
        RAISE NOTICE '⚠️ Columna portada_url ya existe';
    END IF;
END $$;

-- 4. Agregar columna ritmos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'ritmos' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_brand ADD COLUMN ritmos BIGINT[] DEFAULT '{}';
        RAISE NOTICE '✅ Columna ritmos agregada';
    ELSE
        RAISE NOTICE '⚠️ Columna ritmos ya existe';
    END IF;
END $$;

-- 5. Agregar columna zonas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'zonas' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_brand ADD COLUMN zonas BIGINT[] DEFAULT '{}';
        RAISE NOTICE '✅ Columna zonas agregada';
    ELSE
        RAISE NOTICE '⚠️ Columna zonas ya existe';
    END IF;
END $$;

-- 6. Agregar columna productos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'productos' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_brand ADD COLUMN productos JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE '✅ Columna productos agregada';
    ELSE
        RAISE NOTICE '⚠️ Columna productos ya existe';
    END IF;
END $$;

-- 7. Agregar columna redes_sociales
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'redes_sociales' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_brand ADD COLUMN redes_sociales JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE '✅ Columna redes_sociales agregada';
    ELSE
        RAISE NOTICE '⚠️ Columna redes_sociales ya existe';
    END IF;
END $$;

-- 8. Verificar estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles_brand' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Recrear vista pública con todas las columnas
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

-- 10. Crear índices GIN para arrays
CREATE INDEX IF NOT EXISTS idx_profiles_brand_ritmos ON public.profiles_brand USING GIN(ritmos);
CREATE INDEX IF NOT EXISTS idx_profiles_brand_zonas ON public.profiles_brand USING GIN(zonas);

-- 11. Otorgar permisos a la vista
GRANT SELECT ON public.v_brands_public TO public;
GRANT SELECT ON public.v_brands_public TO authenticated;

-- 12. Verificar que la vista funciona
SELECT 
    COUNT(*) as total_brands_public
FROM public.v_brands_public;

-- 13. Crear marca de prueba si no existe
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
                avatar_url,
                portada_url,
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
                'https://via.placeholder.com/150x150',
                'https://via.placeholder.com/800x400',
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

-- 14. Verificación final
DO $$
BEGIN
    RAISE NOTICE '🎉 Migración completa exitosa!';
    RAISE NOTICE 'Todas las columnas necesarias han sido agregadas.';
    RAISE NOTICE 'La vista v_brands_public ha sido recreada.';
    RAISE NOTICE 'El módulo de Marca está listo para usar.';
END $$;
