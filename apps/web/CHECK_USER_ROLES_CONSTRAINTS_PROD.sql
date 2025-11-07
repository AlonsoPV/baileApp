-- ============================================================================
-- VERIFICAR CONSTRAINTS DE user_roles EN PRODUCCIÓN
-- ============================================================================

-- Ver todas las constraints
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.user_roles'::regclass
ORDER BY contype, conname;

-- Ver índices
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'user_roles'
  AND schemaname = 'public'
ORDER BY indexname;

-- Ver primary key
SELECT
    a.attname as column_name
FROM pg_index i
JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
WHERE i.indrelid = 'public.user_roles'::regclass
  AND i.indisprimary
ORDER BY a.attnum;

