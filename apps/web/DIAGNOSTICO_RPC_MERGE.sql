-- =====================================================
-- DIAGNÓSTICO: RPC merge_profiles_user
-- =====================================================
-- Use este script para verificar si la función RPC existe
-- y diagnosticar problemas relacionados
-- =====================================================

-- 1) Verificar si la función existe
SELECT 
  routine_name AS "Nombre de la función",
  routine_type AS "Tipo",
  security_type AS "Seguridad",
  specific_name AS "Nombre específico"
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'merge_profiles_user';

-- Resultado esperado:
-- Si la función existe:
--   Nombre de la función: merge_profiles_user
--   Tipo: FUNCTION
--   Seguridad: DEFINER
--   Nombre específico: merge_profiles_user_<números>

-- Si NO existe:
--   (No rows) <- Necesitas ejecutar SCRIPT_15_MERGE_PROFILES_USER_RPC.sql

-- =====================================================
-- 2) Ver parámetros de la función
-- =====================================================

SELECT 
  p.proname AS "Función",
  pg_get_function_arguments(p.oid) AS "Parámetros",
  pg_get_function_result(p.oid) AS "Retorno"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'merge_profiles_user';

-- Resultado esperado:
-- Función: merge_profiles_user
-- Parámetros: p_user_id uuid, p_patch jsonb
-- Retorno: void

-- =====================================================
-- 3) Ver permisos de ejecución
-- =====================================================

SELECT 
  grantee AS "Usuario/Rol",
  privilege_type AS "Privilegio"
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'merge_profiles_user';

-- Resultado esperado:
-- Usuario/Rol: authenticated
-- Privilegio: EXECUTE

-- =====================================================
-- 4) Probar la función (OPCIONAL - usar tu user_id real)
-- =====================================================

-- REEMPLAZA 'tu-user-id-aqui' con tu UUID real de auth.users
-- SELECT merge_profiles_user(
--   'tu-user-id-aqui'::UUID,
--   '{"display_name": "Test Usuario"}'::JSONB
-- );

-- Si funciona, no debería retornar nada (VOID)
-- Si falla, verás un error con detalles

-- =====================================================
-- 5) Ver definición completa de la función
-- =====================================================

SELECT pg_get_functiondef(oid) AS "Definición completa"
FROM pg_proc
WHERE proname = 'merge_profiles_user'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Esto muestra el código completo de la función
-- Útil para verificar que está bien creada

-- =====================================================
-- SOLUCIONES A PROBLEMAS COMUNES
-- =====================================================

-- PROBLEMA 1: "Could not find the function merge_profiles_user"
-- SOLUCIÓN: Ejecutar SCRIPT_15_MERGE_PROFILES_USER_RPC.sql

-- PROBLEMA 2: Función existe pero da error de permisos
-- SOLUCIÓN: Verificar que authenticated tenga EXECUTE:
-- GRANT EXECUTE ON FUNCTION public.merge_profiles_user(UUID, JSONB) TO authenticated;

-- PROBLEMA 3: Función existe pero con parámetros incorrectos
-- SOLUCIÓN: Eliminar y recrear:
-- DROP FUNCTION IF EXISTS public.merge_profiles_user(UUID, JSONB);
-- Luego ejecutar SCRIPT_15_MERGE_PROFILES_USER_RPC.sql

-- PROBLEMA 4: Error "Profile not found"
-- SOLUCIÓN: Asegúrate de que el user_id existe en profiles_user:
-- SELECT * FROM profiles_user WHERE user_id = 'tu-user-id';

-- =====================================================
-- FIN DEL DIAGNÓSTICO
-- =====================================================

