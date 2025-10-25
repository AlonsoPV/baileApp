-- Recrear tabla profiles_brand completa
-- Ejecutar en Supabase SQL Editor si hay problemas con la estructura

-- 1. Eliminar tabla existente (CUIDADO: esto borrará todos los datos)
DROP TABLE IF EXISTS public.profiles_brand CASCADE;

-- 2. Eliminar vista si existe
DROP VIEW IF EXISTS public.v_brands_public;

-- 3. Crear tabla completa
CREATE TABLE public.profiles_brand (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_publico TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  portada_url TEXT,
  ritmos BIGINT[] DEFAULT '{}',
  zonas BIGINT[] DEFAULT '{}',
  redes_sociales JSONB DEFAULT '{}'::jsonb,
  media JSONB DEFAULT '[]'::jsonb,
  productos JSONB DEFAULT '[]'::jsonb,
  estado_aprobacion TEXT DEFAULT 'borrador'
    CHECK (estado_aprobacion IN ('borrador','en_revision','aprobado','rechazado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear trigger de updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_brand_updated
BEFORE UPDATE ON public.profiles_brand
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 5. Habilitar RLS
ALTER TABLE public.profiles_brand ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas RLS
CREATE POLICY "brand_select_public_or_owner"
ON public.profiles_brand
FOR SELECT
USING (estado_aprobacion = 'aprobado' OR user_id = auth.uid());

CREATE POLICY "brand_insert_owner"
ON public.profiles_brand
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "brand_update_owner"
ON public.profiles_brand
FOR UPDATE
USING (user_id = auth.uid());

-- 7. Crear vista pública
CREATE OR REPLACE VIEW public.v_brands_public AS
SELECT *
FROM public.profiles_brand
WHERE estado_aprobacion = 'aprobado';

-- 8. Crear índices
CREATE INDEX idx_profiles_brand_user_id ON public.profiles_brand(user_id);
CREATE INDEX idx_profiles_brand_estado ON public.profiles_brand(estado_aprobacion);
CREATE INDEX idx_profiles_brand_ritmos ON public.profiles_brand USING GIN(ritmos);
CREATE INDEX idx_profiles_brand_zonas ON public.profiles_brand USING GIN(zonas);

-- 9. Agregar comentarios
COMMENT ON TABLE public.profiles_brand IS 'Perfiles de marcas comerciales';
COMMENT ON COLUMN public.profiles_brand.productos IS 'Catálogo de productos externos de la marca';
COMMENT ON COLUMN public.profiles_brand.media IS 'Galería de medios de la marca';
COMMENT ON COLUMN public.profiles_brand.redes_sociales IS 'Enlaces a redes sociales de la marca';

-- 10. Verificar estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles_brand' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 11. Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'profiles_brand' 
AND schemaname = 'public'
ORDER BY indexname;
