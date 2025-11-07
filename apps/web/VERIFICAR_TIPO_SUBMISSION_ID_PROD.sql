-- Ver el tipo de dato de la columna id en challenge_submissions
SELECT 
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'challenge_submissions'
  AND column_name = 'id';

