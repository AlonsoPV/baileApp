-- Script para verificar y corregir la tabla profiles_academy
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si la tabla existe y qué columnas tiene
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles_academy' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Si la tabla existe pero le faltan columnas, agregarlas
DO $$
BEGIN
    -- Verificar si la columna ritmos existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_academy' 
        AND column_name = 'ritmos'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_academy ADD COLUMN ritmos BIGINT[] DEFAULT '{}';
        RAISE NOTICE 'Columna ritmos agregada';
    END IF;

    -- Verificar si la columna zonas existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_academy' 
        AND column_name = 'zonas'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_academy ADD COLUMN zonas BIGINT[] DEFAULT '{}';
        RAISE NOTICE 'Columna zonas agregada';
    END IF;

    -- Verificar si la columna ubicaciones existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_academy' 
        AND column_name = 'ubicaciones'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_academy ADD COLUMN ubicaciones JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Columna ubicaciones agregada';
    END IF;

    -- Verificar si la columna horarios existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_academy' 
        AND column_name = 'horarios'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_academy ADD COLUMN horarios JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Columna horarios agregada';
    END IF;

    -- Verificar si la columna redes_sociales existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_academy' 
        AND column_name = 'redes_sociales'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_academy ADD COLUMN redes_sociales JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Columna redes_sociales agregada';
    END IF;

    -- Verificar si la columna media existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_academy' 
        AND column_name = 'media'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_academy ADD COLUMN media JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Columna media agregada';
    END IF;

    -- Verificar si la columna avatar_url existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_academy' 
        AND column_name = 'avatar_url'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_academy ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Columna avatar_url agregada';
    END IF;

    -- Verificar si la columna portada_url existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_academy' 
        AND column_name = 'portada_url'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_academy ADD COLUMN portada_url TEXT;
        RAISE NOTICE 'Columna portada_url agregada';
    END IF;

    -- Verificar si la columna estado_aprobacion existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_academy' 
        AND column_name = 'estado_aprobacion'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_academy ADD COLUMN estado_aprobacion TEXT DEFAULT 'borrador';
        RAISE NOTICE 'Columna estado_aprobacion agregada';
    END IF;

    -- Verificar si la columna updated_at existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_academy' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_academy ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Columna updated_at agregada';
    END IF;
END $$;

-- 3. Crear trigger updated_at si no existe
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_academy_updated ON public.profiles_academy;
CREATE TRIGGER trg_profiles_academy_updated
BEFORE UPDATE ON public.profiles_academy
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 4. Habilitar RLS si no está habilitado
ALTER TABLE public.profiles_academy ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas RLS si no existen
DO $$
BEGIN
    -- Política de SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles_academy' 
        AND policyname = 'academy_select_public_or_owner'
    ) THEN
        CREATE POLICY "academy_select_public_or_owner"
        ON public.profiles_academy
        FOR SELECT USING (estado_aprobacion='aprobado' OR user_id = auth.uid());
        RAISE NOTICE 'Política academy_select_public_or_owner creada';
    END IF;

    -- Política de INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles_academy' 
        AND policyname = 'academy_insert_owner'
    ) THEN
        CREATE POLICY "academy_insert_owner"
        ON public.profiles_academy
        FOR INSERT WITH CHECK (user_id = auth.uid());
        RAISE NOTICE 'Política academy_insert_owner creada';
    END IF;

    -- Política de UPDATE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles_academy' 
        AND policyname = 'academy_update_owner'
    ) THEN
        CREATE POLICY "academy_update_owner"
        ON public.profiles_academy
        FOR UPDATE USING (user_id = auth.uid());
        RAISE NOTICE 'Política academy_update_owner creada';
    END IF;
END $$;

-- 6. Crear vista pública si no existe
CREATE OR REPLACE VIEW public.v_academies_public AS
SELECT * FROM public.profiles_academy
WHERE estado_aprobacion='aprobado';

-- 7. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_profiles_academy_user_id ON public.profiles_academy(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_academy_estado ON public.profiles_academy(estado_aprobacion);
CREATE INDEX IF NOT EXISTS idx_profiles_academy_ritmos ON public.profiles_academy USING GIN(ritmos);
CREATE INDEX IF NOT EXISTS idx_profiles_academy_zonas ON public.profiles_academy USING GIN(zonas);

-- 8. Otorgar permisos
GRANT SELECT ON public.v_academies_public TO public;
GRANT SELECT ON public.v_academies_public TO authenticated;

-- 9. Verificar estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles_academy' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. Verificar que la vista funciona
SELECT 
    COUNT(*) as total_academies_public
FROM public.v_academies_public;

-- 11. Mostrar academias públicas disponibles
SELECT 
    id,
    nombre_publico,
    bio,
    estado_aprobacion,
    created_at,
    updated_at
FROM public.v_academies_public
ORDER BY created_at DESC
LIMIT 5;

-- 12. Verificación final
DO $$
BEGIN
    RAISE NOTICE 'VERIFICACION COMPLETA EXITOSA!';
    RAISE NOTICE 'Tabla profiles_academy configurada correctamente';
END $$;
