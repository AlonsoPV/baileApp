-- Módulo de Marca - Base de datos (CORREGIDO)
-- Ejecutar en Supabase SQL Editor

-- 1. Perfil de Marca
CREATE TABLE IF NOT EXISTS public.profiles_brand (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_publico TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  portada_url TEXT,
  ritmos BIGINT[] DEFAULT '{}',
  zonas BIGINT[] DEFAULT '{}',
  redes_sociales JSONB DEFAULT '{}'::jsonb, -- {instagram, tiktok, youtube, facebook, whatsapp, web}
  media JSONB DEFAULT '[]'::jsonb,          -- [{type:'image'|'video', url:''}]
  productos JSONB DEFAULT '[]'::jsonb,      -- [{titulo, precio, moneda, url_externa, imagen_url}]
  estado_aprobacion TEXT DEFAULT 'borrador'
    CHECK (estado_aprobacion IN ('borrador','en_revision','aprobado','rechazado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger de updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_brand_updated ON public.profiles_brand;
CREATE TRIGGER trg_profiles_brand_updated
BEFORE UPDATE ON public.profiles_brand
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 3. RLS (Row Level Security)
ALTER TABLE public.profiles_brand ENABLE ROW LEVEL SECURITY;

-- Política de SELECT: público si está aprobado, o si es el dueño
CREATE POLICY "brand_select_public_or_owner"
ON public.profiles_brand
FOR SELECT
USING (estado_aprobacion = 'aprobado' OR user_id = auth.uid());

-- Política de INSERT: solo el dueño puede insertar
CREATE POLICY "brand_insert_owner"
ON public.profiles_brand
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Política de UPDATE: solo el dueño puede actualizar
CREATE POLICY "brand_update_owner"
ON public.profiles_brand
FOR UPDATE
USING (user_id = auth.uid());

-- 4. Vista pública (solo aprobadas)
CREATE OR REPLACE VIEW public.v_brands_public AS
SELECT *
FROM public.profiles_brand
WHERE estado_aprobacion = 'aprobado';

-- 5. Índices básicos (sin GIN por ahora)
CREATE INDEX IF NOT EXISTS idx_profiles_brand_user_id ON public.profiles_brand(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_brand_estado ON public.profiles_brand(estado_aprobacion);

-- 6. Comentarios para documentación
COMMENT ON TABLE public.profiles_brand IS 'Perfiles de marcas comerciales';
COMMENT ON COLUMN public.profiles_brand.productos IS 'Catálogo de productos externos de la marca';
COMMENT ON COLUMN public.profiles_brand.media IS 'Galería de medios de la marca';
COMMENT ON COLUMN public.profiles_brand.redes_sociales IS 'Enlaces a redes sociales de la marca';
