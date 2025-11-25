-- ========================================
-- 🎯 Tags usados en perfiles para filtros globales
-- Solo mostrar en la barra de filtros los ritmos y zonas
-- que hayan sido seleccionados en algún perfil (usuario,
-- academia, maestro, organizador o marca).
-- ========================================

-- Función SECURITY DEFINER para ignorar RLS y devolver
-- únicamente IDs de tags (sin datos sensibles).

DROP FUNCTION IF EXISTS public.rpc_get_used_tags() CASCADE;

CREATE OR REPLACE FUNCTION public.rpc_get_used_tags()
RETURNS TABLE(tag_id BIGINT, tipo TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH
  -- Ritmos seleccionados por catálogo (slugs) → mapear a tags.id
  user_ritmos_sel AS (
    SELECT DISTINCT t.id AS tag_id, 'ritmo'::text AS tipo
    FROM public.profiles_user pu
    JOIN LATERAL unnest(COALESCE(pu.ritmos_seleccionados, '{}'::text[])) rs(slug)
      ON rs.slug IS NOT NULL AND rs.slug <> ''
    JOIN public.tags t
      ON t.tipo = 'ritmo'
     AND t.slug = rs.slug
    WHERE pu.onboarding_complete = true
  ),
  academy_ritmos_sel AS (
    SELECT DISTINCT t.id AS tag_id, 'ritmo'::text AS tipo
    FROM public.profiles_academy pa
    JOIN LATERAL unnest(COALESCE(pa.ritmos_seleccionados, '{}'::text[])) rs(slug)
      ON rs.slug IS NOT NULL AND rs.slug <> ''
    JOIN public.tags t
      ON t.tipo = 'ritmo'
     AND t.slug = rs.slug
    WHERE pa.estado_aprobacion = 'aprobado'
  ),
  teacher_ritmos_sel AS (
    SELECT DISTINCT t.id AS tag_id, 'ritmo'::text AS tipo
    FROM public.profiles_teacher pt
    JOIN LATERAL unnest(COALESCE(pt.ritmos_seleccionados, '{}'::text[])) rs(slug)
      ON rs.slug IS NOT NULL AND rs.slug <> ''
    JOIN public.tags t
      ON t.tipo = 'ritmo'
     AND t.slug = rs.slug
    WHERE pt.estado_aprobacion = 'aprobado'
  ),
  organizer_ritmos_sel AS (
    SELECT DISTINCT t.id AS tag_id, 'ritmo'::text AS tipo
    FROM public.profiles_organizer po
    JOIN LATERAL unnest(COALESCE(po.ritmos_seleccionados, '{}'::text[])) rs(slug)
      ON rs.slug IS NOT NULL AND rs.slug <> ''
    JOIN public.tags t
      ON t.tipo = 'ritmo'
     AND t.slug = rs.slug
    WHERE po.estado_aprobacion = 'aprobado'
  ),

  -- Zonas (solo numéricas) desde todos los perfiles
  user_zonas AS (
    SELECT DISTINCT unnest(COALESCE(zonas, '{}'::int[]))::bigint AS tag_id, 'zona'::text AS tipo
    FROM public.profiles_user
    WHERE zonas IS NOT NULL AND array_length(zonas, 1) > 0
  ),
  academy_zonas AS (
    SELECT DISTINCT unnest(COALESCE(zonas, '{}'::int[]))::bigint AS tag_id, 'zona'::text AS tipo
    FROM public.profiles_academy
    WHERE zonas IS NOT NULL AND array_length(zonas, 1) > 0
      AND estado_aprobacion = 'aprobado'
  ),
  teacher_zonas AS (
    SELECT DISTINCT unnest(COALESCE(zonas, '{}'::int[]))::bigint AS tag_id, 'zona'::text AS tipo
    FROM public.profiles_teacher
    WHERE zonas IS NOT NULL AND array_length(zonas, 1) > 0
      AND estado_aprobacion = 'aprobado'
  ),
  organizer_zonas AS (
    SELECT DISTINCT unnest(COALESCE(zonas, '{}'::int[]))::bigint AS tag_id, 'zona'::text AS tipo
    FROM public.profiles_organizer
    WHERE zonas IS NOT NULL AND array_length(zonas, 1) > 0
      AND estado_aprobacion = 'aprobado'
  ),
  brand_zonas AS (
    SELECT DISTINCT unnest(COALESCE(zonas, '{}'::int[]))::bigint AS tag_id, 'zona'::text AS tipo
    FROM public.profiles_brand
    WHERE zonas IS NOT NULL AND array_length(zonas, 1) > 0
      AND estado_aprobacion = 'aprobado'
  ),

  all_tags AS (
    SELECT * FROM user_ritmos_sel
    UNION ALL SELECT * FROM academy_ritmos_sel
    UNION ALL SELECT * FROM teacher_ritmos_sel
    UNION ALL SELECT * FROM organizer_ritmos_sel
    UNION ALL SELECT * FROM user_zonas
    UNION ALL SELECT * FROM academy_zonas
    UNION ALL SELECT * FROM teacher_zonas
    UNION ALL SELECT * FROM organizer_zonas
    UNION ALL SELECT * FROM brand_zonas
  )
  SELECT DISTINCT at.tag_id, at.tipo
  FROM all_tags at
  JOIN public.tags tg
    ON tg.id = at.tag_id
   AND tg.tipo = at.tipo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_used_tags() TO anon, authenticated;


