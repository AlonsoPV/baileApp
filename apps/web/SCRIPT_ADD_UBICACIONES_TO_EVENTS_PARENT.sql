-- Add ubicaciones column to events_parent table
-- This column stores location information for event parents

-- First, check if the column already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'events_parent' 
        AND column_name = 'ubicaciones'
    ) THEN
        -- Add the ubicaciones column as JSONB
        ALTER TABLE events_parent 
        ADD COLUMN ubicaciones JSONB DEFAULT '[]'::jsonb;
        
        RAISE NOTICE 'Column ubicaciones added to events_parent';
    ELSE
        RAISE NOTICE 'Column ubicaciones already exists in events_parent';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'events_parent' 
AND column_name = 'ubicaciones';

-- Add a comment to document the column
COMMENT ON COLUMN events_parent.ubicaciones IS 'Array of location objects with name, address, city, zone, and notes';
