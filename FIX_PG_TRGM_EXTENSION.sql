-- ============================================================================
-- 🔒 CORREGIR EXTENSIÓN pg_trgm EN SCHEMA PUBLIC
-- ============================================================================
-- El linter de Supabase detecta que pg_trgm está en el schema 'public'
-- Debe moverse a otro schema (típicamente 'extensions' o un schema dedicado)
-- ============================================================================
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 1: VERIFICAR ESTADO ACTUAL
-- ============================================================================

-- Verificar si la extensión existe y en qué schema está
SELECT 
    extname AS extension_name,
    n.nspname AS schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname = 'pg_trgm';

-- ============================================================================
-- PARTE 2: CREAR SCHEMA PARA EXTENSIONES (si no existe)
-- ============================================================================

-- Crear schema 'extensions' si no existe
CREATE SCHEMA IF NOT EXISTS extensions;

-- Otorgar permisos necesarios
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- PARTE 3: MOVER EXTENSIÓN pg_trgm
-- ============================================================================

DO $$
BEGIN
    -- Verificar si la extensión está en public
    IF EXISTS (
        SELECT 1 
        FROM pg_extension e
        JOIN pg_namespace n ON e.extnamespace = n.oid
        WHERE e.extname = 'pg_trgm' 
        AND n.nspname = 'public'
    ) THEN
        RAISE NOTICE '🔄 Moviendo extensión pg_trgm de public a extensions...';
        
        -- Mover la extensión al schema extensions
        ALTER EXTENSION pg_trgm SET SCHEMA extensions;
        
        RAISE NOTICE '✅ Extensión pg_trgm movida a schema extensions';
    ELSE
        -- Verificar si ya está en otro schema
        IF EXISTS (
            SELECT 1 
            FROM pg_extension e
            JOIN pg_namespace n ON e.extnamespace = n.oid
            WHERE e.extname = 'pg_trgm'
        ) THEN
            RAISE NOTICE 'ℹ️ Extensión pg_trgm ya está en otro schema (no en public)';
        ELSE
            RAISE NOTICE 'ℹ️ Extensión pg_trgm no existe. Creándola en schema extensions...';
            
            -- Crear la extensión en el schema extensions
            CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
            
            RAISE NOTICE '✅ Extensión pg_trgm creada en schema extensions';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- PARTE 4: VERIFICAR RESULTADO
-- ============================================================================

-- Verificar que la extensión está en el schema correcto
SELECT 
    extname AS extension_name,
    n.nspname AS schema_name,
    CASE 
        WHEN n.nspname = 'public' THEN '❌ ERROR: Todavía en public'
        WHEN n.nspname = 'extensions' THEN '✅ OK: En schema extensions'
        ELSE '⚠️ WARNING: En schema ' || n.nspname
    END AS status
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname = 'pg_trgm';

-- ============================================================================
-- PARTE 5: VERIFICAR FUNCIONES Y OPERADORES
-- ============================================================================

-- Verificar que las funciones de pg_trgm están disponibles
-- (deberían estar disponibles globalmente aunque la extensión esté en otro schema)
SELECT 
    proname AS function_name,
    n.nspname AS schema_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE proname LIKE '%trgm%'
ORDER BY n.nspname, proname
LIMIT 10;

COMMIT;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. Después de mover la extensión, las funciones y operadores de pg_trgm
--    siguen siendo accesibles globalmente (no necesitas cambiar queries)
-- 2. Si tienes índices GIN usando pg_trgm, estos seguirán funcionando
-- 3. Si tienes funciones personalizadas que usan pg_trgm, verifica que
--    sigan funcionando después del cambio
-- ============================================================================

