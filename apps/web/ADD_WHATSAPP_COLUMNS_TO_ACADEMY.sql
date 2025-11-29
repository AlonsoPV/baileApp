-- Agregar columnas de WhatsApp para clases a profiles_academy
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
WHERE table_name = 'profiles_academy'
AND table_schema = 'public'
AND column_name IN ('whatsapp_number', 'whatsapp_message_template')
ORDER BY ordinal_position;

-- ============================================
-- 2. AGREGAR COLUMNAS FALTANTES
-- ============================================

-- 2.1 Agregar whatsapp_number (número de WhatsApp para clases)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_academy'
        AND table_schema = 'public'
        AND column_name = 'whatsapp_number'
    ) THEN
        ALTER TABLE public.profiles_academy 
        ADD COLUMN whatsapp_number TEXT;
        RAISE NOTICE '✅ Columna whatsapp_number agregada';
    ELSE
        RAISE NOTICE '⏭️  Columna whatsapp_number ya existe';
    END IF;
END $$;

-- 2.2 Agregar whatsapp_message_template (template del mensaje para clases)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_academy'
        AND table_schema = 'public'
        AND column_name = 'whatsapp_message_template'
    ) THEN
        ALTER TABLE public.profiles_academy 
        ADD COLUMN whatsapp_message_template TEXT DEFAULT 'Hola, me interesa la clase: {nombre}';
        RAISE NOTICE '✅ Columna whatsapp_message_template agregada';
    ELSE
        RAISE NOTICE '⏭️  Columna whatsapp_message_template ya existe';
    END IF;
END $$;

-- ============================================
-- 3. VERIFICAR COLUMNAS AGREGADAS
-- ============================================
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles_academy'
AND table_schema = 'public'
AND column_name IN ('whatsapp_number', 'whatsapp_message_template')
ORDER BY ordinal_position;

