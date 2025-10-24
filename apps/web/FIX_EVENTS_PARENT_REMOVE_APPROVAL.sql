-- FIX_EVENTS_PARENT_REMOVE_APPROVAL.sql
-- Script para eliminar completamente el sistema de aprobación de eventos

-- 1. Verificar dependencias actuales
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
AND (viewname LIKE '%events%' OR viewname LIKE '%v_events%');

-- 2. Eliminar vistas dependientes
DROP VIEW IF EXISTS public.v_events_dates_public CASCADE;
DROP VIEW IF EXISTS public.events_live CASCADE;
DROP VIEW IF EXISTS public.events_with_rsvp_stats CASCADE;

-- 3. Eliminar políticas dependientes
DROP POLICY IF EXISTS "Users can view own events or approved" ON public.events_parent;
DROP POLICY IF EXISTS "read parent live" ON public.events_parent;

-- 4. Agregar columnas faltantes si no existen
DO $$
BEGIN
    -- Verificar y agregar columna 'biografia' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_parent' 
        AND column_name = 'biografia'
    ) THEN
        ALTER TABLE public.events_parent ADD COLUMN biografia TEXT;
        RAISE NOTICE 'Columna "biografia" agregada a events_parent.';
    END IF;

    -- Verificar y agregar columna 'estilos' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_parent' 
        AND column_name = 'estilos'
    ) THEN
        ALTER TABLE public.events_parent ADD COLUMN estilos INTEGER[] DEFAULT '{}';
        RAISE NOTICE 'Columna "estilos" agregada a events_parent.';
    END IF;

    -- Verificar y agregar columna 'zonas' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_parent' 
        AND column_name = 'zonas'
    ) THEN
        ALTER TABLE public.events_parent ADD COLUMN zonas INTEGER[] DEFAULT '{}';
        RAISE NOTICE 'Columna "zonas" agregada a events_parent.';
    END IF;

    -- Verificar y agregar columna 'sede_general' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_parent' 
        AND column_name = 'sede_general'
    ) THEN
        ALTER TABLE public.events_parent ADD COLUMN sede_general TEXT;
        RAISE NOTICE 'Columna "sede_general" agregada a events_parent.';
    END IF;

    -- Verificar y agregar columna 'faq' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_parent' 
        AND column_name = 'faq'
    ) THEN
        ALTER TABLE public.events_parent ADD COLUMN faq JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Columna "faq" agregada a events_parent.';
    END IF;

    -- Verificar y agregar columna 'media' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_parent' 
        AND column_name = 'media'
    ) THEN
        ALTER TABLE public.events_parent ADD COLUMN media JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Columna "media" agregada a events_parent.';
    END IF;

    -- Verificar y agregar columna 'updated_at' si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'events_parent' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.events_parent ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Columna "updated_at" agregada a events_parent.';
    END IF;
END $$;

-- 5. Eliminar columna estado_aprobacion
ALTER TABLE public.events_parent DROP COLUMN IF EXISTS estado_aprobacion;

-- 6. Habilitar RLS
ALTER TABLE public.events_parent ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas RLS básicas (sin aprobación)
DO $$
BEGIN
    -- Política de SELECT - todos pueden ver eventos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'events_parent' 
        AND policyname = 'events_parent_select_policy'
    ) THEN
        CREATE POLICY events_parent_select_policy ON public.events_parent
            FOR SELECT USING (true);
        RAISE NOTICE 'Política de SELECT creada para events_parent.';
    END IF;

    -- Política de INSERT - usuarios autenticados pueden crear
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'events_parent' 
        AND policyname = 'events_parent_insert_policy'
    ) THEN
        CREATE POLICY events_parent_insert_policy ON public.events_parent
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        RAISE NOTICE 'Política de INSERT creada para events_parent.';
    END IF;

    -- Política de UPDATE - solo el organizador puede editar
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'events_parent' 
        AND policyname = 'events_parent_update_policy'
    ) THEN
        CREATE POLICY events_parent_update_policy ON public.events_parent
            FOR UPDATE USING (
                organizer_id IN (
                    SELECT id FROM public.profiles_organizer 
                    WHERE user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Política de UPDATE creada para events_parent.';
    END IF;

    -- Política de DELETE - solo el organizador puede eliminar
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'events_parent' 
        AND policyname = 'events_parent_delete_policy'
    ) THEN
        CREATE POLICY events_parent_delete_policy ON public.events_parent
            FOR DELETE USING (
                organizer_id IN (
                    SELECT id FROM public.profiles_organizer 
                    WHERE user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Política de DELETE creada para events_parent.';
    END IF;
END $$;

-- 8. Crear vistas simplificadas (sin aprobación)
CREATE OR REPLACE VIEW public.events_live AS
SELECT 
    ep.id,
    ep.organizer_id,
    ep.nombre,
    ep.descripcion,
    ep.biografia,
    ep.estilos,
    ep.zonas,
    ep.sede_general,
    ep.faq,
    ep.media,
    ep.created_at,
    ep.updated_at,
    po.nombre_publico as organizer_name,
    po.bio as organizer_bio,
    po.media as organizer_media
FROM public.events_parent ep
JOIN public.profiles_organizer po ON ep.organizer_id = po.id;

CREATE OR REPLACE VIEW public.v_events_dates_public AS
SELECT 
    ed.id,
    ed.parent_id,
    ed.nombre,
    ed.biografia,
    ed.fecha,
    ed.hora_inicio,
    ed.hora_fin,
    ed.lugar,
    ed.direccion,
    ed.ciudad,
    ed.zona,
    ed.zonas,
    ed.referencias,
    ed.requisitos,
    ed.cronograma,
    ed.costos,
    ed.estilos,
    ed.media,
    ed.estado_publicacion,
    ed.created_at,
    ed.updated_at,
    ep.nombre as parent_nombre,
    ep.descripcion as parent_descripcion,
    ep.organizer_id,
    po.nombre_publico as organizer_name
FROM public.events_date ed
JOIN public.events_parent ep ON ed.parent_id = ep.id
JOIN public.profiles_organizer po ON ep.organizer_id = po.id;

-- 9. Verificar la estructura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'events_parent'
ORDER BY ordinal_position;

-- 10. Mostrar algunos registros
SELECT 
    id,
    organizer_id,
    nombre,
    descripcion,
    created_at
FROM public.events_parent
ORDER BY id DESC
LIMIT 5;
