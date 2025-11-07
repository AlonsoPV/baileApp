-- Ver todas las columnas de profiles_user en producción
SELECT column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_user'
ORDER BY ordinal_position;

