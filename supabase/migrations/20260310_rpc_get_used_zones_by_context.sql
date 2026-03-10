-- Zonas realmente usadas por contexto de Explore.
-- Devuelve solo tags.tipo='zona' presentes en datos reales del contexto.

DROP FUNCTION IF EXISTS public.rpc_get_used_zones_by_context_debug(text) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_get_used_zones_by_context(text) CASCADE;

CREATE OR REPLACE FUNCTION public.rpc_get_used_zones_by_context_debug(p_context text)
RETURNS TABLE(
  context text,
  source_table text,
  source_column text,
  raw_id text,
  normalized_id bigint,
  total bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
WITH raw_rows AS (
  -- EVENTOS: fechas vigentes/recurrentes publicadas
  SELECT 'eventos'::text AS context, 'events_date'::text AS source_table, 'zona'::text AS source_column, ed.zona::text AS raw_id
  FROM public.events_date ed
  WHERE p_context = 'eventos'
    AND ed.estado_publicacion = 'publicado'
    AND (
      ed.dia_semana IS NOT NULL
      OR (ed.fecha IS NOT NULL AND ed.fecha >= (now() AT TIME ZONE 'America/Mexico_City')::date)
    )

  UNION ALL
  SELECT 'eventos', 'events_date', 'zonas', z::text
  FROM public.events_date ed
  CROSS JOIN LATERAL unnest(COALESCE(ed.zonas, '{}'::int[])) AS z
  WHERE p_context = 'eventos'
    AND ed.estado_publicacion = 'publicado'
    AND (
      ed.dia_semana IS NOT NULL
      OR (ed.fecha IS NOT NULL AND ed.fecha >= (now() AT TIME ZONE 'America/Mexico_City')::date)
    )

  UNION ALL
  SELECT 'eventos', 'events_parent', 'zonas', z::text
  FROM public.events_date ed
  JOIN public.events_parent ep ON ep.id = ed.parent_id
  CROSS JOIN LATERAL unnest(COALESCE(ep.zonas, '{}'::int[])) AS z
  WHERE p_context = 'eventos'
    AND ed.estado_publicacion = 'publicado'
    AND (
      ed.dia_semana IS NOT NULL
      OR (ed.fecha IS NOT NULL AND ed.fecha >= (now() AT TIME ZONE 'America/Mexico_City')::date)
    )

  -- CLASES (modelo vigente en frontend): cronograma/perfiles aprobados
  UNION ALL
  SELECT 'clases', 'profiles_academy', 'zonas', z::text
  FROM public.profiles_academy pa
  CROSS JOIN LATERAL unnest(COALESCE(pa.zonas, '{}'::int[])) AS z
  WHERE p_context = 'clases'
    AND pa.estado_aprobacion = 'aprobado'

  UNION ALL
  SELECT 'clases', 'profiles_teacher', 'zonas', z::text
  FROM public.profiles_teacher pt
  CROSS JOIN LATERAL unnest(COALESCE(pt.zonas, '{}'::int[])) AS z
  WHERE p_context = 'clases'
    AND pt.estado_aprobacion = 'aprobado'

  -- ACADEMIAS
  UNION ALL
  SELECT 'academias', 'profiles_academy', 'zonas', z::text
  FROM public.profiles_academy pa
  CROSS JOIN LATERAL unnest(COALESCE(pa.zonas, '{}'::int[])) AS z
  WHERE p_context = 'academias'
    AND pa.estado_aprobacion = 'aprobado'

  -- MAESTROS
  UNION ALL
  SELECT 'maestros', 'profiles_teacher', 'zonas', z::text
  FROM public.profiles_teacher pt
  CROSS JOIN LATERAL unnest(COALESCE(pt.zonas, '{}'::int[])) AS z
  WHERE p_context = 'maestros'
    AND pt.estado_aprobacion = 'aprobado'

  -- ORGANIZADORES
  UNION ALL
  SELECT 'organizadores', 'profiles_organizer', 'zonas', z::text
  FROM public.profiles_organizer po
  CROSS JOIN LATERAL unnest(COALESCE(po.zonas, '{}'::int[])) AS z
  WHERE p_context = 'organizadores'
    AND po.estado_aprobacion = 'aprobado'

  -- BAILARINES
  UNION ALL
  SELECT 'bailarines', 'profiles_user', 'zonas', z::text
  FROM public.profiles_user pu
  CROSS JOIN LATERAL unnest(COALESCE(pu.zonas, '{}'::int[])) AS z
  WHERE p_context = 'bailarines'
    AND pu.onboarding_complete = true

  -- MARCAS
  UNION ALL
  SELECT 'marcas', 'profiles_brand', 'zonas', z::text
  FROM public.profiles_brand pb
  CROSS JOIN LATERAL unnest(COALESCE(pb.zonas, '{}'::int[])) AS z
  WHERE p_context = 'marcas'
    AND pb.estado_aprobacion = 'aprobado'
),
normalized AS (
  SELECT
    context,
    source_table,
    source_column,
    raw_id,
    CASE
      WHEN raw_id ~ '^[0-9]+$' THEN raw_id::bigint
      ELSE NULL
    END AS normalized_id
  FROM raw_rows
  WHERE p_context IN ('eventos', 'clases', 'academias', 'maestros', 'organizadores', 'bailarines', 'marcas')
    AND NULLIF(trim(COALESCE(raw_id, '')), '') IS NOT NULL
)
SELECT
  n.context,
  n.source_table,
  n.source_column,
  n.raw_id,
  n.normalized_id,
  COUNT(*)::bigint AS total
FROM normalized n
GROUP BY n.context, n.source_table, n.source_column, n.raw_id, n.normalized_id
ORDER BY n.source_table, n.source_column, n.raw_id;
$$;

CREATE OR REPLACE FUNCTION public.rpc_get_used_zones_by_context(p_context text)
RETURNS TABLE(id bigint, nombre text, slug text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
WITH valid_ids AS (
  SELECT DISTINCT d.normalized_id AS id
  FROM public.rpc_get_used_zones_by_context_debug(p_context) d
  WHERE d.normalized_id IS NOT NULL
)
SELECT t.id, t.nombre, t.slug
FROM public.tags t
JOIN valid_ids v ON v.id = t.id
WHERE t.tipo = 'zona'
  AND p_context IN ('eventos', 'clases', 'academias', 'maestros', 'organizadores', 'bailarines', 'marcas')
ORDER BY t.nombre ASC;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_used_zones_by_context_debug(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_used_zones_by_context(text) TO anon, authenticated;

