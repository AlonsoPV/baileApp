-- Agregar columnas faltantes específicas a profiles_brand
-- Basado en el diagnóstico: productos y redes_sociales faltan, media existe

-- 1. Verificar estado actual
DO $$
BEGIN
    RAISE NOTICE 'Iniciando migración de columnas faltantes...';
    RAISE NOTICE 'Columnas a agregar: productos, redes_sociales';
END $$;

-- 2. Agregar columna productos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'productos' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_brand ADD COLUMN productos JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE '✅ Columna productos agregada exitosamente';
    ELSE
        RAISE NOTICE '⚠️ Columna productos ya existe';
    END IF;
END $$;

-- 3. Agregar columna redes_sociales
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'redes_sociales' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_brand ADD COLUMN redes_sociales JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE '✅ Columna redes_sociales agregada exitosamente';
    ELSE
        RAISE NOTICE '⚠️ Columna redes_sociales ya existe';
    END IF;
END $$;

-- 4. Verificar que todas las columnas necesarias existen
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'productos' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as productos_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'media' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as media_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'redes_sociales' 
        AND table_schema = 'public'
    ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as redes_sociales_status;

-- 5. Mostrar estructura completa de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles_brand' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar que la vista pública funciona
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'v_brands_public' 
        AND table_schema = 'public'
    ) THEN '✅ Vista existe' ELSE '❌ Vista no existe' END as vista_status;

-- 7. Crear vista si no existe
CREATE OR REPLACE VIEW public.v_brands_public AS
SELECT *
FROM public.profiles_brand
WHERE estado_aprobacion = 'aprobado';

-- 8. Verificar políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles_brand' 
AND schemaname = 'public';

-- 9. Crear políticas si no existen
DO $$
BEGIN
    -- Política de SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles_brand' 
        AND policyname = 'brand_select_public_or_owner'
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "brand_select_public_or_owner"
        ON public.profiles_brand
        FOR SELECT
        USING (estado_aprobacion = 'aprobado' OR user_id = auth.uid());
        RAISE NOTICE '✅ Política SELECT creada';
    END IF;
    
    -- Política de INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles_brand' 
        AND policyname = 'brand_insert_owner'
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "brand_insert_owner"
        ON public.profiles_brand
        FOR INSERT
        WITH CHECK (user_id = auth.uid());
        RAISE NOTICE '✅ Política INSERT creada';
    END IF;
    
    -- Política de UPDATE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles_brand' 
        AND policyname = 'brand_update_owner'
        AND schemaname = 'public'
    ) THEN
        CREATE POLICY "brand_update_owner"
        ON public.profiles_brand
        FOR UPDATE
        USING (user_id = auth.uid());
        RAISE NOTICE '✅ Política UPDATE creada';
    END IF;
END $$;

-- 10. Verificación final
DO $$
BEGIN
    RAISE NOTICE '🎉 Migración completada exitosamente!';
    RAISE NOTICE 'La tabla profiles_brand ahora tiene todas las columnas necesarias.';
    RAISE NOTICE 'Puedes proceder a probar el módulo de Marca.';
END $$;
