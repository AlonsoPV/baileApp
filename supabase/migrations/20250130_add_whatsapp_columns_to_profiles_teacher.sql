-- Agregar columnas de WhatsApp para clases a profiles_teacher
-- Estas columnas permiten a los maestros configurar un número de WhatsApp
-- y un template de mensaje para que los usuarios puedan contactarlos sobre clases

-- ============================================
-- 1. AGREGAR COLUMNAS FALTANTES
-- ============================================

-- 1.1 Agregar whatsapp_number (número de WhatsApp para clases)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_teacher'
        AND table_schema = 'public'
        AND column_name = 'whatsapp_number'
    ) THEN
        ALTER TABLE public.profiles_teacher 
        ADD COLUMN whatsapp_number TEXT;
        RAISE NOTICE '✅ Columna whatsapp_number agregada a profiles_teacher';
    ELSE
        RAISE NOTICE '⏭️  Columna whatsapp_number ya existe en profiles_teacher';
    END IF;
END $$;

-- 1.2 Agregar whatsapp_message_template (template del mensaje para clases)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles_teacher'
        AND table_schema = 'public'
        AND column_name = 'whatsapp_message_template'
    ) THEN
        ALTER TABLE public.profiles_teacher 
        ADD COLUMN whatsapp_message_template TEXT DEFAULT 'Hola, me interesa la clase: {nombre}';
        RAISE NOTICE '✅ Columna whatsapp_message_template agregada a profiles_teacher';
    ELSE
        RAISE NOTICE '⏭️  Columna whatsapp_message_template ya existe en profiles_teacher';
    END IF;
END $$;

-- ============================================
-- 2. VERIFICAR COLUMNAS AGREGADAS
-- ============================================
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles_teacher'
AND table_schema = 'public'
AND column_name IN ('whatsapp_number', 'whatsapp_message_template')
ORDER BY ordinal_position;

