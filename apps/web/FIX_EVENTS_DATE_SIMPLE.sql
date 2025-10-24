-- FIX_EVENTS_DATE_SIMPLE.sql
-- Script simplificado para verificar y corregir la tabla events_date

-- 1. Verificar estructura actual
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'events_date'
ORDER BY ordinal_position;

-- 2. Agregar columnas faltantes de forma segura
DO $$
BEGIN
    -- Verificar y agregar columna 'nombre' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_date' 
        AND column_name = 'nombre'
    ) THEN
        ALTER TABLE public.events_date ADD COLUMN nombre TEXT;
        RAISE NOTICE 'Columna "nombre" agregada a events_date.';
    END IF;

    -- Verificar y agregar columna 'biografia' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_date' 
        AND column_name = 'biografia'
    ) THEN
        ALTER TABLE public.events_date ADD COLUMN biografia TEXT;
        RAISE NOTICE 'Columna "biografia" agregada a events_date.';
    END IF;

    -- Verificar y agregar columna 'zonas' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_date' 
        AND column_name = 'zonas'
    ) THEN
        ALTER TABLE public.events_date ADD COLUMN zonas INTEGER[] DEFAULT '{}';
        RAISE NOTICE 'Columna "zonas" agregada a events_date.';
    END IF;

    -- Verificar y agregar columna 'referencias' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_date' 
        AND column_name = 'referencias'
    ) THEN
        ALTER TABLE public.events_date ADD COLUMN referencias TEXT;
        RAISE NOTICE 'Columna "referencias" agregada a events_date.';
    END IF;

    -- Verificar y agregar columna 'requisitos' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_date' 
        AND column_name = 'requisitos'
    ) THEN
        ALTER TABLE public.events_date ADD COLUMN requisitos TEXT;
        RAISE NOTICE 'Columna "requisitos" agregada a events_date.';
    END IF;

    -- Verificar y agregar columna 'cronograma' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_date' 
        AND column_name = 'cronograma'
    ) THEN
        ALTER TABLE public.events_date ADD COLUMN cronograma JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Columna "cronograma" agregada a events_date.';
    END IF;

    -- Verificar y agregar columna 'costos' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_date' 
        AND column_name = 'costos'
    ) THEN
        ALTER TABLE public.events_date ADD COLUMN costos JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Columna "costos" agregada a events_date.';
    END IF;

    -- Verificar y agregar columna 'media' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_date' 
        AND column_name = 'media'
    ) THEN
        ALTER TABLE public.events_date ADD COLUMN media JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Columna "media" agregada a events_date.';
    END IF;

    -- Verificar y agregar columna 'estado_publicacion' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_date' 
        AND column_name = 'estado_publicacion'
    ) THEN
        ALTER TABLE public.events_date ADD COLUMN estado_publicacion TEXT DEFAULT 'borrador';
        RAISE NOTICE 'Columna "estado_publicacion" agregada a events_date.';
    END IF;

    -- Verificar y agregar columna 'updated_at' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_date' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.events_date ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna "updated_at" agregada a events_date.';
    END IF;
END $$;

-- 3. Verificar RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'events_date';

-- 4. Habilitar RLS si no está habilitado
ALTER TABLE public.events_date ENABLE ROW LEVEL SECURITY;

-- 5. Verificar la estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'events_date'
ORDER BY ordinal_position;

-- 6. Mostrar algunos registros
SELECT 
    id,
    parent_id,
    nombre,
    fecha,
    hora_inicio,
    lugar,
    ciudad,
    estado_publicacion,
    created_at
FROM public.events_date
ORDER BY id DESC
LIMIT 5;
