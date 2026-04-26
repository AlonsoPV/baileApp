-- Recrear vista para incluir columnas de suscripción (SELECT * se resolvió al crear la vista anterior).

DROP VIEW IF EXISTS public.v_teachers_public CASCADE;

CREATE VIEW public.v_teachers_public AS
SELECT *
FROM public.profiles_teacher
WHERE estado_aprobacion = 'aprobado';

GRANT SELECT ON public.v_teachers_public TO anon, authenticated;
