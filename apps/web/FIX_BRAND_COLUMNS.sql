-- Fix Brand Columns - Agregar columnas faltantes a profiles_brand
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1. VERIFICAR COLUMNAS ACTUALES
-- ============================================
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles_brand'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- 2. AGREGAR COLUMNAS FALTANTES
-- ============================================

-- 2.1 Agregar productos (catálogo)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_brand'
        AND column_name = 'productos'
    ) THEN
        ALTER TABLE public.profiles_brand 
        ADD COLUMN productos JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE '✅ Columna productos agregada';
    ELSE
        RAISE NOTICE '⏭️  Columna productos ya existe';
    END IF;
END $$;

-- 2.2 Agregar size_guide (guía de tallas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_brand'
        AND column_name = 'size_guide'
    ) THEN
        ALTER TABLE public.profiles_brand 
        ADD COLUMN size_guide JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE '✅ Columna size_guide agregada';
    ELSE
        RAISE NOTICE '⏭️  Columna size_guide ya existe';
    END IF;
END $$;

-- 2.3 Agregar fit_tips (consejos de ajuste)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_brand'
        AND column_name = 'fit_tips'
    ) THEN
        ALTER TABLE public.profiles_brand 
        ADD COLUMN fit_tips JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE '✅ Columna fit_tips agregada';
    ELSE
        RAISE NOTICE '⏭️  Columna fit_tips ya existe';
    END IF;
END $$;

-- 2.4 Agregar policies (políticas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_brand'
        AND column_name = 'policies'
    ) THEN
        ALTER TABLE public.profiles_brand 
        ADD COLUMN policies JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE '✅ Columna policies agregada';
    ELSE
        RAISE NOTICE '⏭️  Columna policies ya existe';
    END IF;
END $$;

-- 2.5 Agregar conversion (conversión/cupones)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_brand'
        AND column_name = 'conversion'
    ) THEN
        ALTER TABLE public.profiles_brand 
        ADD COLUMN conversion JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE '✅ Columna conversion agregada';
    ELSE
        RAISE NOTICE '⏭️  Columna conversion ya existe';
    END IF;
END $$;

-- ============================================
-- 3. VERIFICAR COLUMNAS FINALES
-- ============================================
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles_brand'
AND table_schema = 'public'
AND column_name IN ('productos', 'size_guide', 'fit_tips', 'policies', 'conversion')
ORDER BY column_name;

-- ============================================
-- 4. COMENTARIOS SOBRE LAS COLUMNAS
-- ============================================
COMMENT ON COLUMN public.profiles_brand.productos IS 'Catálogo de productos: [{ id, titulo, imagen_url, category, price, sizes }]';
COMMENT ON COLUMN public.profiles_brand.size_guide IS 'Guía de tallas: [{ mx, us, eu }]';
COMMENT ON COLUMN public.profiles_brand.fit_tips IS 'Consejos de ajuste: [{ style, tip }]';
COMMENT ON COLUMN public.profiles_brand.policies IS 'Políticas: { shipping, returns, warranty }';
COMMENT ON COLUMN public.profiles_brand.conversion IS 'Conversión/cupones: { headline, subtitle, coupons: [] }';

-- ============================================
-- 5. VERIFICACIÓN FINAL
-- ============================================
SELECT 
    '=== COLUMNAS PROFILES_BRAND ===' as section,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles_brand'
AND table_schema = 'public'
ORDER BY ordinal_position;

