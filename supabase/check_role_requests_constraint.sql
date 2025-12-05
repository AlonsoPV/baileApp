-- ============================================
-- VERIFICAR CONSTRAINT DE STATUS EN role_requests
-- ============================================

-- Consultar el constraint actual
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.role_requests'::regclass
  AND conname LIKE '%status%';

-- También verificar los valores únicos de status en la tabla
SELECT DISTINCT status, COUNT(*) as count
FROM public.role_requests
GROUP BY status
ORDER BY status;

