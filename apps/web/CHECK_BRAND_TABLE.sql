-- Verificar estructura actual de la tabla profiles_brand
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si la tabla existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'profiles_brand' 
AND table_schema = 'public';

-- 2. Verificar columnas existentes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles_brand' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar si las columnas problemáticas existen
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'productos' 
        AND table_schema = 'public'
    ) THEN 'EXISTS' ELSE 'MISSING' END as productos_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'media' 
        AND table_schema = 'public'
    ) THEN 'EXISTS' ELSE 'MISSING' END as media_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'redes_sociales' 
        AND table_schema = 'public'
    ) THEN 'EXISTS' ELSE 'MISSING' END as redes_sociales_status;
