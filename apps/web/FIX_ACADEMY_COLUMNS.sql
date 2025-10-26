-- Script simple para agregar columnas faltantes a profiles_academy
-- Ejecutar en Supabase SQL Editor

-- Agregar columnas faltantes una por una
ALTER TABLE public.profiles_academy 
ADD COLUMN IF NOT EXISTS ritmos BIGINT[] DEFAULT '{}';

ALTER TABLE public.profiles_academy 
ADD COLUMN IF NOT EXISTS zonas BIGINT[] DEFAULT '{}';

ALTER TABLE public.profiles_academy 
ADD COLUMN IF NOT EXISTS redes_sociales JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.profiles_academy 
ADD COLUMN IF NOT EXISTS ubicaciones JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles_academy 
ADD COLUMN IF NOT EXISTS horarios JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles_academy 
ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles_academy 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.profiles_academy 
ADD COLUMN IF NOT EXISTS portada_url TEXT;

ALTER TABLE public.profiles_academy 
ADD COLUMN IF NOT EXISTS estado_aprobacion TEXT DEFAULT 'borrador';

ALTER TABLE public.profiles_academy 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Crear trigger updated_at
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

-- Habilitar RLS
ALTER TABLE public.profiles_academy ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
DROP POLICY IF EXISTS "academy_select_public_or_owner" ON public.profiles_academy;
CREATE POLICY "academy_select_public_or_owner"
ON public.profiles_academy
FOR SELECT USING (estado_aprobacion='aprobado' OR user_id = auth.uid());

DROP POLICY IF EXISTS "academy_insert_owner" ON public.profiles_academy;
CREATE POLICY "academy_insert_owner"
ON public.profiles_academy
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "academy_update_owner" ON public.profiles_academy;
CREATE POLICY "academy_update_owner"
ON public.profiles_academy
FOR UPDATE USING (user_id = auth.uid());

-- Crear vista pública
CREATE OR REPLACE VIEW public.v_academies_public AS
SELECT * FROM public.profiles_academy
WHERE estado_aprobacion='aprobado';

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_profiles_academy_user_id ON public.profiles_academy(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_academy_estado ON public.profiles_academy(estado_aprobacion);
CREATE INDEX IF NOT EXISTS idx_profiles_academy_ritmos ON public.profiles_academy USING GIN(ritmos);
CREATE INDEX IF NOT EXISTS idx_profiles_academy_zonas ON public.profiles_academy USING GIN(zonas);

-- Otorgar permisos
GRANT SELECT ON public.v_academies_public TO public;
GRANT SELECT ON public.v_academies_public TO authenticated;

-- Verificar estructura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles_academy' 
AND table_schema = 'public'
ORDER BY ordinal_position;
