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

-- 3. Crear constraint único en user_id si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.profiles_teacher'::regclass
        AND conname = 'profiles_teacher_user_id_unique'
    ) THEN
        ALTER TABLE public.profiles_teacher 
        ADD CONSTRAINT profiles_teacher_user_id_unique UNIQUE (user_id);
        RAISE NOTICE '✅ Constraint único creado';
    ELSE
        RAISE NOTICE '⏭️  Constraint único ya existe';
    END IF;
END $$;

-- 4. Verificar índices
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'profiles_teacher'
ORDER BY indexname;

-- 5. Crear índice en user_id si no existe
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_user_id 
ON public.profiles_teacher(user_id);

-- 6. Verificar constraints finales
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles_teacher'::regclass
ORDER BY conname;

