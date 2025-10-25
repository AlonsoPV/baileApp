-- Agregar índices GIN para arrays después de crear la tabla
-- Ejecutar DESPUÉS de CREATE_BRAND_MODULE_FIXED.sql

-- Verificar que la tabla existe y tiene las columnas
DO $$
BEGIN
    -- Verificar que la tabla profiles_brand existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles_brand' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'La tabla profiles_brand no existe. Ejecuta primero CREATE_BRAND_MODULE_FIXED.sql';
    END IF;
    
    -- Verificar que las columnas ritmos y zonas existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles_brand' AND column_name = 'ritmos' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'La columna ritmos no existe en profiles_brand';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles_brand' AND column_name = 'zonas' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'La columna zonas no existe en profiles_brand';
    END IF;
    
    RAISE NOTICE 'Tabla profiles_brand verificada correctamente. Creando índices GIN...';
END $$;

-- Crear índices GIN para arrays
CREATE INDEX IF NOT EXISTS idx_profiles_brand_ritmos ON public.profiles_brand USING GIN(ritmos);
CREATE INDEX IF NOT EXISTS idx_profiles_brand_zonas ON public.profiles_brand USING GIN(zonas);

-- Verificar que los índices se crearon
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'profiles_brand' 
AND schemaname = 'public'
ORDER BY indexname;
