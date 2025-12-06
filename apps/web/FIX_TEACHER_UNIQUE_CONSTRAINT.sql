-- Fix Teacher Unique Constraint - Asegurar que existe constraint único en user_id
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar constraints existentes
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles_teacher'::regclass
ORDER BY conname;

-- 2. Eliminar constraint único antiguo si existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.profiles_teacher'::regclass
        AND conname = 'profiles_teacher_user_id_key'
    ) THEN
        ALTER TABLE public.profiles_teacher 
        DROP CONSTRAINT profiles_teacher_user_id_key;
        RAISE NOTICE '✅ Constraint antiguo eliminado';
    END IF;
END $$;

-- 3. Verificar y limpiar valores NULL duplicados antes de crear constraint
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Contar registros con user_id NULL
    SELECT COUNT(*) INTO duplicate_count
    FROM public.profiles_teacher
    WHERE user_id IS NULL;
    
    IF duplicate_count > 1 THEN
        RAISE NOTICE '⚠️  Encontrados % registros con user_id NULL. Eliminando duplicados...', duplicate_count;
        -- Mantener solo el más reciente de los registros con user_id NULL
        DELETE FROM public.profiles_teacher
        WHERE user_id IS NULL
        AND id NOT IN (
            SELECT id FROM public.profiles_teacher
            WHERE user_id IS NULL
            ORDER BY created_at DESC
            LIMIT 1
        );
        RAISE NOTICE '✅ Duplicados con user_id NULL eliminados';
    END IF;
END $$;

-- 4. Crear constraint único en user_id si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.profiles_teacher'::regclass
        AND (conname = 'profiles_teacher_user_id_unique' OR conname = 'profiles_teacher_user_id_key')
    ) THEN
        -- Verificar si hay valores NULL antes de crear el constraint
        IF EXISTS (SELECT 1 FROM public.profiles_teacher WHERE user_id IS NULL) THEN
            RAISE NOTICE '⚠️  Hay registros con user_id NULL. El constraint UNIQUE permitirá múltiples NULL.';
        END IF;
        
        ALTER TABLE public.profiles_teacher 
        ADD CONSTRAINT profiles_teacher_user_id_unique UNIQUE (user_id);
        RAISE NOTICE '✅ Constraint único creado';
    ELSE
        RAISE NOTICE '⏭️  Constraint único ya existe';
    END IF;
END $$;

-- 5. Verificar índices
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'profiles_teacher'
ORDER BY indexname;

-- 6. Crear índice en user_id si no existe
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_user_id 
ON public.profiles_teacher(user_id);

-- 7. Verificar constraints finales
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles_teacher'::regclass
ORDER BY conname;

