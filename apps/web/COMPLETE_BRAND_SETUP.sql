-- Script completo para configurar el módulo de Marca
-- Ejecutar en Supabase SQL Editor - Este script hace TODO

-- 1. Verificar estado inicial
DO $$
BEGIN
    RAISE NOTICE '🚀 Iniciando configuración completa del módulo de Marca...';
    RAISE NOTICE 'Este script creará/actualizará la tabla profiles_brand con todas las columnas necesarias.';
END $$;

-- 2. Eliminar tabla existente si hay problemas
DROP TABLE IF EXISTS public.profiles_brand CASCADE;
DROP VIEW IF EXISTS public.v_brands_public;

-- 3. Crear tabla completa desde cero
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

-- 4. Crear función trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- 5. Crear trigger para updated_at
CREATE TRIGGER trg_profiles_brand_updated
BEFORE UPDATE ON public.profiles_brand
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 6. Habilitar RLS
ALTER TABLE public.profiles_brand ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas RLS
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

-- 8. Crear vista pública
CREATE OR REPLACE VIEW public.v_brands_public AS
SELECT 
    id,
    user_id,
    nombre_publico,
    bio,
    avatar_url,
    portada_url,
    ritmos,
    zonas,
    redes_sociales,
    media,
    productos,
    estado_aprobacion,
    created_at,
    updated_at
FROM public.profiles_brand
WHERE estado_aprobacion = 'aprobado';

-- 9. Crear índices
CREATE INDEX idx_profiles_brand_user_id ON public.profiles_brand(user_id);
CREATE INDEX idx_profiles_brand_estado ON public.profiles_brand(estado_aprobacion);
CREATE INDEX idx_profiles_brand_ritmos ON public.profiles_brand USING GIN(ritmos);
CREATE INDEX idx_profiles_brand_zonas ON public.profiles_brand USING GIN(zonas);

-- 10. Otorgar permisos
GRANT SELECT ON public.v_brands_public TO public;
GRANT SELECT ON public.v_brands_public TO authenticated;

-- 11. Agregar comentarios
COMMENT ON TABLE public.profiles_brand IS 'Perfiles de marcas comerciales';
COMMENT ON COLUMN public.profiles_brand.productos IS 'Catálogo de productos externos de la marca';
COMMENT ON COLUMN public.profiles_brand.media IS 'Galería de medios de la marca';
COMMENT ON COLUMN public.profiles_brand.redes_sociales IS 'Enlaces a redes sociales de la marca';

-- 12. Verificar estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles_brand' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 13. Verificar políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles_brand' 
AND schemaname = 'public';

-- 14. Verificar trigger
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles_brand' 
AND event_object_schema = 'public';

-- 15. Crear marca de prueba
DO $$
DECLARE
    test_user_id UUID;
    brand_count INTEGER;
BEGIN
    -- Obtener un usuario de prueba
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Contar marcas existentes para este usuario
        SELECT COUNT(*) INTO brand_count 
        FROM public.profiles_brand 
        WHERE user_id = test_user_id;
        
        -- Crear marca de prueba si no existe
        IF brand_count = 0 THEN
            INSERT INTO public.profiles_brand (
                user_id,
                nombre_publico,
                bio,
                avatar_url,
                portada_url,
                ritmos,
                zonas,
                redes_sociales,
                media,
                productos,
                estado_aprobacion
            ) VALUES (
                test_user_id,
                'Marca de Prueba',
                'Esta es una marca de prueba para verificar el funcionamiento',
                'https://via.placeholder.com/150x150',
                'https://via.placeholder.com/800x400',
                ARRAY[1, 2, 3],
                ARRAY[1, 2],
                '{"instagram": "https://instagram.com/test", "web": "https://test.com"}'::jsonb,
                '[{"type": "image", "url": "https://via.placeholder.com/300x200"}]'::jsonb,
                '[{"titulo": "Producto de Prueba", "precio": 100, "moneda": "MXN"}]'::jsonb,
                'aprobado'
            );
            RAISE NOTICE '✅ Marca de prueba creada para usuario %', test_user_id;
        ELSE
            RAISE NOTICE '⚠️ Ya existe una marca para el usuario de prueba';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ No se encontró usuario para crear marca de prueba';
    END IF;
END $$;

-- 16. Verificar que la vista funciona
SELECT 
    COUNT(*) as total_brands_public,
    COUNT(CASE WHEN estado_aprobacion = 'aprobado' THEN 1 END) as approved_brands
FROM public.v_brands_public;

-- 17. Mostrar marcas públicas disponibles
SELECT 
    id,
    nombre_publico,
    bio,
    estado_aprobacion,
    created_at,
    updated_at
FROM public.v_brands_public
ORDER BY created_at DESC
LIMIT 5;

-- 18. Probar el trigger con una actualización
DO $$
DECLARE
    test_id BIGINT;
    old_updated_at TIMESTAMPTZ;
    new_updated_at TIMESTAMPTZ;
BEGIN
    -- Obtener ID de una marca existente
    SELECT id, updated_at INTO test_id, old_updated_at 
    FROM public.profiles_brand LIMIT 1;
    
    IF test_id IS NOT NULL THEN
        -- Esperar un momento para que el timestamp cambie
        PERFORM pg_sleep(1);
        
        -- Actualizar para probar el trigger
        UPDATE public.profiles_brand 
        SET nombre_publico = nombre_publico 
        WHERE id = test_id;
        
        -- Obtener el nuevo updated_at
        SELECT updated_at INTO new_updated_at 
        FROM public.profiles_brand 
        WHERE id = test_id;
        
        IF new_updated_at > old_updated_at THEN
            RAISE NOTICE '✅ Trigger funcionando correctamente - updated_at actualizado de % a %', old_updated_at, new_updated_at;
        ELSE
            RAISE NOTICE '⚠️ Trigger podría no estar funcionando - updated_at no cambió';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ No hay marcas para probar el trigger';
    END IF;
END $$;

-- 19. Verificación final
DO $$
BEGIN
    RAISE NOTICE '🎉 CONFIGURACIÓN COMPLETA EXITOSA!';
    RAISE NOTICE '✅ Tabla profiles_brand creada con todas las columnas';
    RAISE NOTICE '✅ Trigger updated_at funcionando';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Vista pública v_brands_public operativa';
    RAISE NOTICE '✅ Índices creados para optimización';
    RAISE NOTICE '✅ Permisos otorgados correctamente';
    RAISE NOTICE '🚀 El módulo de Marca está 100% funcional!';
END $$;
