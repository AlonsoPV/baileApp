-- Fix Teacher Columns - Agregar columnas faltantes a profiles_teacher
-- Ejecutar en Supabase SQL Editor

DO $$
BEGIN
    -- 1. Agregar ritmos_seleccionados si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_teacher'
        AND column_name = 'ritmos_seleccionados'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_teacher 
        ADD COLUMN ritmos_seleccionados TEXT[] DEFAULT '{}';
        RAISE NOTICE '✅ Columna ritmos_seleccionados agregada';
    ELSE
        RAISE NOTICE '⏭️  Columna ritmos_seleccionados ya existe';
    END IF;

    -- 2. Agregar cronograma si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_teacher'
        AND column_name = 'cronograma'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_teacher 
        ADD COLUMN cronograma JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE '✅ Columna cronograma agregada';
    ELSE
        RAISE NOTICE '⏭️  Columna cronograma ya existe';
    END IF;

    -- 3. Agregar costos si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_teacher'
        AND column_name = 'costos'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_teacher 
        ADD COLUMN costos JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE '✅ Columna costos agregada';
    ELSE
        RAISE NOTICE '⏭️  Columna costos ya existe';
    END IF;

    -- 4. Agregar ubicaciones si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_teacher'
        AND column_name = 'ubicaciones'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_teacher 
        ADD COLUMN ubicaciones JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE '✅ Columna ubicaciones agregada';
    ELSE
        RAISE NOTICE '⏭️  Columna ubicaciones ya existe';
    END IF;

    -- 5. Verificar que redes_sociales existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_teacher'
        AND column_name = 'redes_sociales'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_teacher 
        ADD COLUMN redes_sociales JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE '✅ Columna redes_sociales agregada';
    ELSE
        RAISE NOTICE '⏭️  Columna redes_sociales ya existe';
    END IF;

    -- 6. Verificar que zonas existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_teacher'
        AND column_name = 'zonas'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_teacher 
        ADD COLUMN zonas BIGINT[] DEFAULT '{}';
        RAISE NOTICE '✅ Columna zonas agregada';
    ELSE
        RAISE NOTICE '⏭️  Columna zonas ya existe';
    END IF;

END $$;

-- Verificar columnas finales
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles_teacher'
AND table_schema = 'public'
ORDER BY ordinal_position;

