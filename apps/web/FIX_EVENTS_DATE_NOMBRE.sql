-- Script para verificar y corregir el campo 'nombre' en events_date

-- 1. Verificar si la tabla events_date existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'events_date'
) as table_exists;

-- 2. Verificar la estructura actual de events_date
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events_date' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Agregar el campo 'nombre' si no existe
DO $$
BEGIN
    -- Verificar si la columna 'nombre' existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events_date' 
        AND column_name = 'nombre'
        AND table_schema = 'public'
    ) THEN
        -- Agregar la columna 'nombre'
        ALTER TABLE public.events_date 
        ADD COLUMN nombre VARCHAR(255);
        
        RAISE NOTICE 'Campo "nombre" agregado a events_date';
    ELSE
        RAISE NOTICE 'Campo "nombre" ya existe en events_date';
    END IF;
END $$;

-- 4. Agregar el campo 'biografia' si no existe
DO $$
BEGIN
    -- Verificar si la columna 'biografia' existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events_date' 
        AND column_name = 'biografia'
        AND table_schema = 'public'
    ) THEN
        -- Agregar la columna 'biografia'
        ALTER TABLE public.events_date 
        ADD COLUMN biografia TEXT;
        
        RAISE NOTICE 'Campo "biografia" agregado a events_date';
    ELSE
        RAISE NOTICE 'Campo "biografia" ya existe en events_date';
    END IF;
END $$;

-- 5. Agregar el campo 'referencias' si no existe
DO $$
BEGIN
    -- Verificar si la columna 'referencias' existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events_date' 
        AND column_name = 'referencias'
        AND table_schema = 'public'
    ) THEN
        -- Agregar la columna 'referencias'
        ALTER TABLE public.events_date 
        ADD COLUMN referencias TEXT;
        
        RAISE NOTICE 'Campo "referencias" agregado a events_date';
    ELSE
        RAISE NOTICE 'Campo "referencias" ya existe en events_date';
    END IF;
END $$;

-- 6. Agregar el campo 'cronograma' si no existe
DO $$
BEGIN
    -- Verificar si la columna 'cronograma' existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events_date' 
        AND column_name = 'cronograma'
        AND table_schema = 'public'
    ) THEN
        -- Agregar la columna 'cronograma'
        ALTER TABLE public.events_date 
        ADD COLUMN cronograma JSONB DEFAULT '[]'::jsonb;
        
        RAISE NOTICE 'Campo "cronograma" agregado a events_date';
    ELSE
        RAISE NOTICE 'Campo "cronograma" ya existe en events_date';
    END IF;
END $$;

-- 7. Agregar el campo 'costos' si no existe
DO $$
BEGIN
    -- Verificar si la columna 'costos' existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events_date' 
        AND column_name = 'costos'
        AND table_schema = 'public'
    ) THEN
        -- Agregar la columna 'costos'
        ALTER TABLE public.events_date 
        ADD COLUMN costos JSONB DEFAULT '[]'::jsonb;
        
        RAISE NOTICE 'Campo "costos" agregado a events_date';
    ELSE
        RAISE NOTICE 'Campo "costos" ya existe en events_date';
    END IF;
END $$;

-- 8. Verificar la estructura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events_date' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Mostrar algunos registros de ejemplo
SELECT id, parent_id, nombre, biografia, fecha, hora_inicio, lugar, ciudad
FROM public.events_date 
LIMIT 5;

-- 10. Contar registros con y sin nombre
SELECT 
    COUNT(*) as total_fechas,
    COUNT(nombre) as fechas_con_nombre,
    COUNT(*) - COUNT(nombre) as fechas_sin_nombre
FROM public.events_date;
