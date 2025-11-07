-- Crear vista pública para organizadores en STAGING
-- Ejecutar en el proyecto de staging

DROP VIEW IF EXISTS public.v_organizers_public;

CREATE VIEW public.v_organizers_public AS
SELECT
    id,
    user_id,
    nombre_publico,
    bio,
    media,
    ritmos,
    ritmos_seleccionados,
    zonas,
    redes_sociales,
    faq,
    estado_aprobacion,
    created_at,
    updated_at
FROM public.profiles_organizer
WHERE estado_aprobacion = 'aprobado';

-- Verificar
SELECT * FROM public.v_organizers_public LIMIT 5;

-- Ver la definición para replicarla en prod después
SELECT pg_get_viewdef('public.v_organizers_public', true);

