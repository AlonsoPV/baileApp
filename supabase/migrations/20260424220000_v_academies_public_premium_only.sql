-- Perfil público de academias: solo plan Premium aparece en vistas públicas (anon + autenticado sin ser dueño).
-- Basic y Pro siguen usando profiles_academy con RLS para el editor y vista "live" del dueño.

DROP VIEW IF EXISTS public.academies_live CASCADE;
DROP VIEW IF EXISTS public.v_academies_public CASCADE;

CREATE VIEW public.v_academies_public AS
SELECT
    id,
    user_id,
    nombre_publico,
    bio,
    media,
    avatar_url,
    portada_url,
    ritmos,
    ritmos_seleccionados,
    zonas,
    redes_sociales,
    ubicaciones,
    horarios,
    cronograma,
    costos,
    estado_aprobacion,
    subscription_plan,
    created_at,
    updated_at
FROM public.profiles_academy
WHERE estado_aprobacion = 'aprobado'
  AND lower(trim(coalesce(subscription_plan, ''))) = 'premium';

COMMENT ON VIEW public.v_academies_public IS
'Academias aprobadas con plan Premium (perfil listable en explore y /academia/:id).';

GRANT SELECT ON public.v_academies_public TO anon, authenticated;

CREATE VIEW public.academies_live AS
SELECT * FROM public.v_academies_public;

GRANT SELECT ON public.academies_live TO anon, authenticated;
