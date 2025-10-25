-- Script para crear las vistas LIVE necesarias para la exploración
-- Estas vistas muestran solo contenido público/aprobado

-- 1. Vista para organizadores aprobados
CREATE OR REPLACE VIEW public.organizers_live AS
SELECT 
    po.id,
    po.user_id,
    po.nombre_publico,
    po.bio,
    po.media,
    po.estilos,
    po.zonas,
    po.redes_sociales,
    po.respuestas,
    po.created_at,
    po.updated_at,
    po.estado_aprobacion
FROM public.profiles_organizer po
WHERE po.estado_aprobacion = 'aprobado';

-- 2. Vista para eventos con fechas (eventos publicados)
CREATE OR REPLACE VIEW public.events_live AS
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
    ed.referencias,
    ed.requisitos,
    ed.cronograma,
    ed.costos,
    ed.media,
    ed.flyer_url,
    ed.created_at,
    ed.updated_at,
    -- Campos del evento padre
    ep.nombre as evento_nombre,
    ep.descripcion as evento_descripcion,
    ep.biografia as evento_biografia,
    ep.estilos as evento_estilos,
    ep.zonas as evento_zonas,
    ep.sede_general,
    ep.faq,
    ep.media as evento_media,
    -- Campos del organizador
    po.id as organizador_id,
    po.user_id as organizador_user_id,
    po.nombre_publico as organizador_nombre,
    po.bio as organizador_bio,
    po.media as organizador_media,
    po.estilos as organizador_estilos,
    po.zonas as organizador_zonas
FROM public.events_date ed
JOIN public.events_parent ep ON ed.parent_id = ep.id
JOIN public.profiles_organizer po ON ep.organizer_id = po.id
WHERE po.estado_aprobacion = 'aprobado'
  AND ed.fecha >= CURRENT_DATE; -- Solo eventos futuros

-- 3. Vista para usuarios (bailarines) públicos
CREATE OR REPLACE VIEW public.users_live AS
SELECT 
    pu.user_id,
    pu.display_name,
    pu.avatar_url,
    pu.ritmos,
    pu.zonas,
    pu.bio,
    pu.redes_sociales,
    pu.respuestas,
    pu.created_at,
    pu.updated_at
FROM public.profiles_user pu
WHERE pu.display_name IS NOT NULL 
  AND pu.display_name != '';

-- 4. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_organizers_live_estado 
ON public.profiles_organizer(estado_aprobacion);

CREATE INDEX IF NOT EXISTS idx_events_date_fecha 
ON public.events_date(fecha);

CREATE INDEX IF NOT EXISTS idx_events_date_parent 
ON public.events_date(parent_id);

CREATE INDEX IF NOT EXISTS idx_events_parent_organizer 
ON public.events_parent(organizer_id);

-- 5. Políticas RLS para las vistas (si es necesario)
-- Las vistas heredan las políticas de las tablas base

-- 6. Comentarios para documentación
COMMENT ON VIEW public.organizers_live IS 'Vista pública de organizadores aprobados';
COMMENT ON VIEW public.events_live IS 'Vista pública de eventos futuros con organizadores aprobados';
COMMENT ON VIEW public.users_live IS 'Vista pública de usuarios con perfiles completos';
