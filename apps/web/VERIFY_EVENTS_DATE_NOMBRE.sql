-- Verificar si el campo 'nombre' existe en events_date
-- y agregarlo si no existe

-- 1. Verificar la estructura actual de events_date
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events_date' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Agregar el campo 'nombre' si no existe
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

-- 3. Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events_date' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Mostrar algunos registros de ejemplo
SELECT id, parent_id, nombre, fecha, hora_inicio, lugar, ciudad
FROM public.events_date 
LIMIT 5;
