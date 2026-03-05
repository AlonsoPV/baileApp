-- Incluir en la barra de filtros los ritmos y zonas utilizados en sociales (events_parent)
-- y en clases (cronograma de academias y maestros).

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
  -- Ritmos seleccionados por catálogo (slugs) → mapear a tags.id (perfiles)
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

  -- Ritmos y zonas usados en sociales (events_parent)
  parent_ritmos_estilos AS (
    SELECT DISTINCT unnest(COALESCE(ep.estilos, '{}'::int[]))::bigint AS tag_id, 'ritmo'::text AS tipo
    FROM public.events_parent ep
    WHERE ep.estilos IS NOT NULL AND array_length(ep.estilos, 1) > 0
  ),
  parent_ritmos_sel AS (
    SELECT DISTINCT t.id AS tag_id, 'ritmo'::text AS tipo
    FROM public.events_parent ep
    JOIN LATERAL unnest(COALESCE(ep.ritmos_seleccionados, '{}'::text[])) rs(slug)
      ON rs.slug IS NOT NULL AND rs.slug <> ''
    JOIN public.tags t
      ON t.tipo = 'ritmo'
     AND t.slug = rs.slug
  ),
  parent_zonas AS (
    SELECT DISTINCT unnest(COALESCE(ep.zonas, '{}'::int[]))::bigint AS tag_id, 'zona'::text AS tipo
    FROM public.events_parent ep
    WHERE ep.zonas IS NOT NULL AND array_length(ep.zonas, 1) > 0
  ),

  -- Ritmos usados en clases (cronograma de academias y maestros): por ID y por slug
  class_ritmos_ids AS (
    SELECT DISTINCT (jsonb_array_elements_text(elem->'ritmos'))::bigint AS tag_id, 'ritmo'::text AS tipo
    FROM public.profiles_academy pa,
         jsonb_array_elements(COALESCE(pa.cronograma, '[]'::jsonb)) AS elem
    WHERE pa.cronograma IS NOT NULL AND jsonb_typeof(pa.cronograma) = 'array'
      AND elem ? 'ritmos' AND jsonb_typeof(elem->'ritmos') = 'array'
      AND pa.estado_aprobacion = 'aprobado'
    UNION
    SELECT DISTINCT (jsonb_array_elements_text(elem->'ritmos'))::bigint AS tag_id, 'ritmo'::text AS tipo
    FROM public.profiles_teacher pt,
         jsonb_array_elements(COALESCE(pt.cronograma, '[]'::jsonb)) AS elem
    WHERE pt.cronograma IS NOT NULL AND jsonb_typeof(pt.cronograma) = 'array'
      AND elem ? 'ritmos' AND jsonb_typeof(elem->'ritmos') = 'array'
      AND pt.estado_aprobacion = 'aprobado'
  ),
  class_ritmos_sel AS (
    SELECT DISTINCT t.id AS tag_id, 'ritmo'::text AS tipo
    FROM public.profiles_academy pa,
         jsonb_array_elements(COALESCE(pa.cronograma, '[]'::jsonb)) AS elem,
         jsonb_array_elements_text(COALESCE(elem->'ritmosSeleccionados', elem->'ritmos_seleccionados', '[]'::jsonb)) AS slug_val
    JOIN public.tags t ON t.tipo = 'ritmo' AND t.slug = slug_val
    WHERE pa.cronograma IS NOT NULL AND jsonb_typeof(pa.cronograma) = 'array'
      AND jsonb_typeof(COALESCE(elem->'ritmosSeleccionados', elem->'ritmos_seleccionados', '[]'::jsonb)) = 'array'
      AND jsonb_array_length(COALESCE(elem->'ritmosSeleccionados', elem->'ritmos_seleccionados', '[]'::jsonb)) > 0
      AND pa.estado_aprobacion = 'aprobado'
      AND slug_val IS NOT NULL AND trim(slug_val) <> ''
    UNION
    SELECT DISTINCT t.id AS tag_id, 'ritmo'::text AS tipo
    FROM public.profiles_teacher pt,
         jsonb_array_elements(COALESCE(pt.cronograma, '[]'::jsonb)) AS elem,
         jsonb_array_elements_text(COALESCE(elem->'ritmosSeleccionados', elem->'ritmos_seleccionados', '[]'::jsonb)) AS slug_val
    JOIN public.tags t ON t.tipo = 'ritmo' AND t.slug = slug_val
    WHERE pt.cronograma IS NOT NULL AND jsonb_typeof(pt.cronograma) = 'array'
      AND jsonb_typeof(COALESCE(elem->'ritmosSeleccionados', elem->'ritmos_seleccionados', '[]'::jsonb)) = 'array'
      AND jsonb_array_length(COALESCE(elem->'ritmosSeleccionados', elem->'ritmos_seleccionados', '[]'::jsonb)) > 0
      AND pt.estado_aprobacion = 'aprobado'
      AND slug_val IS NOT NULL AND trim(slug_val) <> ''
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
    UNION ALL SELECT * FROM parent_ritmos_estilos
    UNION ALL SELECT * FROM parent_ritmos_sel
    UNION ALL SELECT * FROM class_ritmos_ids
    UNION ALL SELECT * FROM class_ritmos_sel
    UNION ALL SELECT * FROM user_zonas
    UNION ALL SELECT * FROM academy_zonas
    UNION ALL SELECT * FROM teacher_zonas
    UNION ALL SELECT * FROM organizer_zonas
    UNION ALL SELECT * FROM brand_zonas
    UNION ALL SELECT * FROM parent_zonas
  )
  SELECT DISTINCT at.tag_id, at.tipo
  FROM all_tags at
  JOIN public.tags tg
    ON tg.id = at.tag_id
   AND tg.tipo = at.tipo;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_used_tags() TO anon, authenticated;
