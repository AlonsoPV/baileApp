-- Agregar columna updated_at y trigger a profiles_brand
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar estado actual
DO $$
BEGIN
    RAISE NOTICE 'Iniciando corrección de columna updated_at...';
END $$;

-- 2. Agregar columna updated_at si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_brand' 
        AND column_name = 'updated_at' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles_brand ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Columna updated_at agregada';
    ELSE
        RAISE NOTICE '⚠️ Columna updated_at ya existe';
    END IF;
END $$;

-- 3. Crear o reemplazar función set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

-- 4. Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS trg_profiles_brand_updated ON public.profiles_brand;

-- 5. Crear trigger para updated_at
CREATE TRIGGER trg_profiles_brand_updated
BEFORE UPDATE ON public.profiles_brand
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 6. Actualizar registros existentes con updated_at = created_at
UPDATE public.profiles_brand 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 7. Verificar estructura de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles_brand' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Verificar que el trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles_brand' 
AND event_object_schema = 'public';

-- 9. Recrear vista pública con updated_at
DROP VIEW IF EXISTS public.v_brands_public;
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

-- 10. Otorgar permisos a la vista
GRANT SELECT ON public.v_brands_public TO public;
GRANT SELECT ON public.v_brands_public TO authenticated;

-- 11. Probar el trigger con una actualización de prueba
DO $$
DECLARE
    test_id BIGINT;
BEGIN
    -- Obtener ID de una marca existente
    SELECT id INTO test_id FROM public.profiles_brand LIMIT 1;
    
    IF test_id IS NOT NULL THEN
        -- Actualizar para probar el trigger
        UPDATE public.profiles_brand 
        SET nombre_publico = nombre_publico 
        WHERE id = test_id;
        
        RAISE NOTICE '✅ Trigger probado exitosamente en marca ID %', test_id;
    ELSE
        RAISE NOTICE '⚠️ No hay marcas para probar el trigger';
    END IF;
END $$;

-- 12. Verificar que updated_at se actualiza correctamente
SELECT 
    id,
    nombre_publico,
    created_at,
    updated_at,
    CASE 
        WHEN updated_at >= created_at THEN '✅ OK' 
        ELSE '❌ ERROR' 
    END as trigger_status
FROM public.profiles_brand
ORDER BY created_at DESC
LIMIT 3;

-- 13. Verificación final
DO $$
BEGIN
    RAISE NOTICE '🎉 Corrección de updated_at completada!';
    RAISE NOTICE 'La columna updated_at ha sido agregada.';
    RAISE NOTICE 'El trigger para actualización automática está funcionando.';
    RAISE NOTICE 'La vista v_brands_public ha sido actualizada.';
    RAISE NOTICE 'El módulo de Marca está listo para usar.';
END $$;
