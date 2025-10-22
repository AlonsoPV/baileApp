-- ============================================
-- SCRIPT 10: Fix Requisitos Column
-- ============================================
-- Agrega la columna 'requisitos' faltante en events_date

-- Verificar si la columna existe
DO $$
BEGIN
    -- Intentar agregar la columna si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events_date' 
        AND column_name = 'requisitos'
    ) THEN
        ALTER TABLE public.events_date 
        ADD COLUMN requisitos TEXT;
        
        RAISE NOTICE 'Columna requisitos agregada a events_date';
    ELSE
        RAISE NOTICE 'Columna requisitos ya existe en events_date';
    END IF;
END $$;

-- Verificar que la columna existe ahora
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'events_date' 
ORDER BY ordinal_position;
