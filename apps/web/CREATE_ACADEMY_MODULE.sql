-- Módulo de Academia - Base de datos completa
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla profiles_academy
CREATE TABLE IF NOT EXISTS public.profiles_academy (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_publico TEXT NOT NULL,
  bio TEXT,
  media JSONB DEFAULT '[]'::jsonb,                 -- [{type:'image'|'video', url:''}]
  avatar_url TEXT,
  portada_url TEXT,
  ritmos BIGINT[] DEFAULT '{}',                    -- tags de ritmos
  zonas BIGINT[] DEFAULT '{}',                     -- tags de zonas
  redes_sociales JSONB DEFAULT '{}'::jsonb,        -- {instagram,tiktok,youtube,facebook,whatsapp,web}
  ubicaciones JSONB DEFAULT '[]'::jsonb,           -- [{sede:'', direccion:'', ciudad:'', zona_id:number}]
  horarios JSONB DEFAULT '[]'::jsonb,              -- [{dia:'Lun',desde:'18:00',hasta:'20:00',ritmo_id:...}]
  estado_aprobacion TEXT DEFAULT 'borrador'
    CHECK (estado_aprobacion IN ('borrador','en_revision','aprobado','rechazado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear trigger updated_at
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

-- 3. Habilitar RLS
ALTER TABLE public.profiles_academy ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS
CREATE POLICY "academy_select_public_or_owner"
ON public.profiles_academy
FOR SELECT USING (estado_aprobacion='aprobado' OR user_id = auth.uid());

CREATE POLICY "academy_insert_owner"
ON public.profiles_academy
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "academy_update_owner"
ON public.profiles_academy
FOR UPDATE USING (user_id = auth.uid());

-- 5. Crear vista pública
CREATE OR REPLACE VIEW public.v_academies_public AS
SELECT * FROM public.profiles_academy
WHERE estado_aprobacion='aprobado';

-- 6. Crear índices
CREATE INDEX idx_profiles_academy_user_id ON public.profiles_academy(user_id);
CREATE INDEX idx_profiles_academy_estado ON public.profiles_academy(estado_aprobacion);
CREATE INDEX idx_profiles_academy_ritmos ON public.profiles_academy USING GIN(ritmos);
CREATE INDEX idx_profiles_academy_zonas ON public.profiles_academy USING GIN(zonas);

-- 7. Otorgar permisos
GRANT SELECT ON public.v_academies_public TO public;
GRANT SELECT ON public.v_academies_public TO authenticated;

-- 8. Agregar comentarios
COMMENT ON TABLE public.profiles_academy IS 'Perfiles de academias de baile';
COMMENT ON COLUMN public.profiles_academy.ubicaciones IS 'Ubicaciones/sedes de la academia';
COMMENT ON COLUMN public.profiles_academy.horarios IS 'Horarios de clases por dia y ritmo';
COMMENT ON COLUMN public.profiles_academy.media IS 'Galería de medios de la academia';

-- 9. Crear academia de prueba
DO $$
DECLARE
    test_user_id UUID;
    academy_count INTEGER;
BEGIN
    -- Obtener un usuario de prueba
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Contar academias existentes para este usuario
        SELECT COUNT(*) INTO academy_count 
        FROM public.profiles_academy 
        WHERE user_id = test_user_id;
        
        -- Crear academia de prueba si no existe
        IF academy_count = 0 THEN
            INSERT INTO public.profiles_academy (
                user_id,
                nombre_publico,
                bio,
                avatar_url,
                portada_url,
                ritmos,
                zonas,
                redes_sociales,
                ubicaciones,
                horarios,
                media,
                estado_aprobacion
            ) VALUES (
                test_user_id,
                'Academia de Prueba',
                'Esta es una academia de prueba para verificar el funcionamiento',
                'https://via.placeholder.com/150x150',
                'https://via.placeholder.com/800x400',
                ARRAY[1, 2, 3],
                ARRAY[1, 2],
                '{"instagram": "https://instagram.com/academia", "web": "https://academia.com"}'::jsonb,
                '[{"sede": "Sede Principal", "direccion": "Calle Principal 123", "ciudad": "Ciudad", "zona_id": 1}]'::jsonb,
                '[{"dia": "Lun", "desde": "18:00", "hasta": "20:00", "ritmo_id": 1}, {"dia": "Mie", "desde": "19:00", "hasta": "21:00", "ritmo_id": 2}]'::jsonb,
                '[{"type": "image", "url": "https://via.placeholder.com/300x200"}]'::jsonb,
                'aprobado'
            );
            RAISE NOTICE 'Academia de prueba creada para usuario %', test_user_id;
        ELSE
            RAISE NOTICE 'Ya existe una academia para el usuario de prueba';
        END IF;
    ELSE
        RAISE NOTICE 'No se encontro usuario para crear academia de prueba';
    END IF;
END $$;

-- 10. Verificar estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles_academy' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 11. Verificar que la vista funciona
SELECT 
    COUNT(*) as total_academies_public
FROM public.v_academies_public;

-- 12. Mostrar academias públicas disponibles
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

-- 13. Verificación final
DO $$
BEGIN
    RAISE NOTICE 'CONFIGURACION COMPLETA EXITOSA!';
    RAISE NOTICE 'Modulo de Academia listo para usar';
END $$;
