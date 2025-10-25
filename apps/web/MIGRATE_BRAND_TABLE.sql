-- Migración para agregar columnas faltantes a profiles_brand
-- Ejecutar en Supabase SQL Editor DESPUÉS de verificar con CHECK_BRAND_TABLE.sql

-- 1. Verificar que la tabla existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles_brand' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'La tabla profiles_brand no existe. Ejecuta primero CREATE_BRAND_MODULE_FIXED.sql';
    END IF;
    RAISE NOTICE 'Tabla profiles_brand encontrada. Iniciando migración...';
END $$;

-- 2. Agregar columna productos si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'productos' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_brand ADD COLUMN productos JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Columna productos agregada';
    ELSE
        RAISE NOTICE 'Columna productos ya existe';
    END IF;
END $$;

-- 3. Agregar columna media si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'media' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_brand ADD COLUMN media JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Columna media agregada';
    ELSE
        RAISE NOTICE 'Columna media ya existe';
    END IF;
END $$;

-- 4. Agregar columna redes_sociales si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'redes_sociales' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_brand ADD COLUMN redes_sociales JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Columna redes_sociales agregada';
    ELSE
        RAISE NOTICE 'Columna redes_sociales ya existe';
    END IF;
END $$;

-- 5. Agregar columna ritmos si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'ritmos' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_brand ADD COLUMN ritmos BIGINT[] DEFAULT '{}';
        RAISE NOTICE 'Columna ritmos agregada';
    ELSE
        RAISE NOTICE 'Columna ritmos ya existe';
    END IF;
END $$;

-- 6. Agregar columna zonas si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'zonas' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_brand ADD COLUMN zonas BIGINT[] DEFAULT '{}';
        RAISE NOTICE 'Columna zonas agregada';
    ELSE
        RAISE NOTICE 'Columna zonas ya existe';
    END IF;
END $$;

-- 7. Agregar columna avatar_url si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'avatar_url' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_brand ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Columna avatar_url agregada';
    ELSE
        RAISE NOTICE 'Columna avatar_url ya existe';
    END IF;
END $$;

-- 8. Agregar columna portada_url si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'portada_url' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_brand ADD COLUMN portada_url TEXT;
        RAISE NOTICE 'Columna portada_url agregada';
    ELSE
        RAISE NOTICE 'Columna portada_url ya existe';
    END IF;
END $$;

-- 9. Verificar estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles_brand' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. Crear índices GIN para arrays
CREATE INDEX IF NOT EXISTS idx_profiles_brand_ritmos ON public.profiles_brand USING GIN(ritmos);
CREATE INDEX IF NOT EXISTS idx_profiles_brand_zonas ON public.profiles_brand USING GIN(zonas);

-- 11. Verificar índices creados
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'profiles_brand' 
AND schemaname = 'public'
ORDER BY indexname;
