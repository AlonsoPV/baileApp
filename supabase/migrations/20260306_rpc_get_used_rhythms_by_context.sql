-- Ritmos realmente usados por contexto de Explore.
-- Devuelve solo tags.tipo='ritmo' presentes en datos reales del contexto.

DROP FUNCTION IF EXISTS public.rpc_get_used_rhythms_by_context(text) CASCADE;

CREATE OR REPLACE FUNCTION public.rpc_get_used_rhythms_by_context(p_context text)
RETURNS TABLE(id bigint, nombre text, slug text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
WITH event_scope AS (
  -- Fuente única para eventos/sociales: events_date publicados.
  -- eventos: vigentes (recurrente o fecha >= hoy CDMX)
  -- sociales: publicados asociados a un parent existente
  SELECT
    ed.id,
    ed.parent_id,
    ed.fecha,
    ed.dia_semana,
    ed.estilos,
    ed.ritmos_seleccionados,
    ed.cronograma,
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(ed.cronograma, '[]'::jsonb)) AS cls
      WHERE
        NULLIF(trim(COALESCE(cls->>'ritmoId', '')), '') IS NOT NULL
        OR (
          jsonb_typeof(COALESCE(cls->'ritmoIds', '[]'::jsonb)) = 'array'
          AND jsonb_array_length(COALESCE(cls->'ritmoIds', '[]'::jsonb)) > 0
        )
        OR (
          jsonb_typeof(COALESCE(cls->'ritmos', '[]'::jsonb)) = 'array'
          AND jsonb_array_length(COALESCE(cls->'ritmos', '[]'::jsonb)) > 0
        )
        OR (
          jsonb_typeof(COALESCE(cls->'ritmosSeleccionados', '[]'::jsonb)) = 'array'
          AND jsonb_array_length(COALESCE(cls->'ritmosSeleccionados', '[]'::jsonb)) > 0
        )
        OR (
          jsonb_typeof(COALESCE(cls->'ritmos_seleccionados', '[]'::jsonb)) = 'array'
          AND jsonb_array_length(COALESCE(cls->'ritmos_seleccionados', '[]'::jsonb)) > 0
        )
    ) AS cronograma_has_rhythms
  FROM public.events_date ed
  WHERE ed.estado_publicacion = 'publicado'
    AND (
      (
        p_context = 'eventos'
        AND (
          ed.dia_semana IS NOT NULL
          OR (ed.fecha IS NOT NULL AND ed.fecha >= (now() AT TIME ZONE 'America/Mexico_City')::date)
        )
      )
      OR (
        p_context = 'sociales'
        AND ed.parent_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.events_parent ep
          WHERE ep.id = ed.parent_id
        )
      )
    )
),
direct_id_texts AS (
  -- ======================
  -- EVENTOS / SOCIALES (events_date -> cronograma prioritario)
  -- ======================
  -- cronograma.ritmoId (scalar)
  SELECT cls->>'ritmoId' AS raw_id
  FROM event_scope es,
       jsonb_array_elements(COALESCE(es.cronograma, '[]'::jsonb)) AS cls
  WHERE p_context IN ('eventos', 'sociales')
    AND NULLIF(trim(COALESCE(cls->>'ritmoId', '')), '') IS NOT NULL

  UNION ALL
  -- cronograma.ritmoIds (array)
  SELECT jsonb_array_elements_text(COALESCE(cls->'ritmoIds', '[]'::jsonb)) AS raw_id
  FROM event_scope es,
       jsonb_array_elements(COALESCE(es.cronograma, '[]'::jsonb)) AS cls
  WHERE p_context IN ('eventos', 'sociales')
    AND jsonb_typeof(COALESCE(cls->'ritmoIds', '[]'::jsonb)) = 'array'

  UNION ALL
  -- cronograma.ritmos (array)
  SELECT jsonb_array_elements_text(COALESCE(cls->'ritmos', '[]'::jsonb)) AS raw_id
  FROM event_scope es,
       jsonb_array_elements(COALESCE(es.cronograma, '[]'::jsonb)) AS cls
  WHERE p_context IN ('eventos', 'sociales')
    AND jsonb_typeof(COALESCE(cls->'ritmos', '[]'::jsonb)) = 'array'

  UNION ALL
  -- fallback legacy: estilos[] solo cuando cronograma no trae ritmos
  SELECT jsonb_array_elements_text(COALESCE(to_jsonb(es.estilos), '[]'::jsonb)) AS raw_id
  FROM event_scope es
  WHERE p_context IN ('eventos', 'sociales')
    AND NOT es.cronograma_has_rhythms

  -- ======================
  -- CLASES (cronograma academy/teacher)
  -- ======================
  UNION ALL
  SELECT jsonb_array_elements_text(COALESCE(cls->'ritmos', '[]'::jsonb)) AS raw_id
  FROM public.profiles_academy pa,
       jsonb_array_elements(COALESCE(pa.cronograma, '[]'::jsonb)) AS cls
  WHERE p_context = 'clases'
    AND pa.estado_aprobacion = 'aprobado'
    AND jsonb_typeof(COALESCE(cls->'ritmos', '[]'::jsonb)) = 'array'

  UNION ALL
  SELECT jsonb_array_elements_text(COALESCE(cls->'ritmos', '[]'::jsonb)) AS raw_id
  FROM public.profiles_teacher pt,
       jsonb_array_elements(COALESCE(pt.cronograma, '[]'::jsonb)) AS cls
  WHERE p_context = 'clases'
    AND pt.estado_aprobacion = 'aprobado'
    AND jsonb_typeof(COALESCE(cls->'ritmos', '[]'::jsonb)) = 'array'

  UNION ALL
  SELECT (cls->>'ritmoId') AS raw_id
  FROM public.profiles_academy pa,
       jsonb_array_elements(COALESCE(pa.cronograma, '[]'::jsonb)) AS cls
  WHERE p_context = 'clases'
    AND pa.estado_aprobacion = 'aprobado'
    AND (cls ? 'ritmoId')

  UNION ALL
  SELECT (cls->>'ritmoId') AS raw_id
  FROM public.profiles_teacher pt,
       jsonb_array_elements(COALESCE(pt.cronograma, '[]'::jsonb)) AS cls
  WHERE p_context = 'clases'
    AND pt.estado_aprobacion = 'aprobado'
    AND (cls ? 'ritmoId')

  UNION ALL
  SELECT jsonb_array_elements_text(COALESCE(cls->'ritmoIds', '[]'::jsonb)) AS raw_id
  FROM public.profiles_academy pa,
       jsonb_array_elements(COALESCE(pa.cronograma, '[]'::jsonb)) AS cls
  WHERE p_context = 'clases'
    AND pa.estado_aprobacion = 'aprobado'
    AND jsonb_typeof(COALESCE(cls->'ritmoIds', '[]'::jsonb)) = 'array'

  UNION ALL
  SELECT jsonb_array_elements_text(COALESCE(cls->'ritmoIds', '[]'::jsonb)) AS raw_id
  FROM public.profiles_teacher pt,
       jsonb_array_elements(COALESCE(pt.cronograma, '[]'::jsonb)) AS cls
  WHERE p_context = 'clases'
    AND pt.estado_aprobacion = 'aprobado'
    AND jsonb_typeof(COALESCE(cls->'ritmoIds', '[]'::jsonb)) = 'array'

  -- ======================
  -- PERFILES (ids numéricos)
  -- ======================
  UNION ALL
  SELECT jsonb_array_elements_text(COALESCE(to_jsonb(pa.ritmos), '[]'::jsonb)) AS raw_id
  FROM public.profiles_academy pa
  WHERE p_context = 'academias'
    AND pa.estado_aprobacion = 'aprobado'

  UNION ALL
  SELECT jsonb_array_elements_text(COALESCE(to_jsonb(pt.ritmos), '[]'::jsonb)) AS raw_id
  FROM public.profiles_teacher pt
  WHERE p_context = 'maestros'
    AND pt.estado_aprobacion = 'aprobado'

  UNION ALL
  SELECT jsonb_array_elements_text(COALESCE(to_jsonb(po.ritmos), '[]'::jsonb)) AS raw_id
  FROM public.profiles_organizer po
  WHERE p_context = 'organizadores'
    AND po.estado_aprobacion = 'aprobado'

  UNION ALL
  SELECT jsonb_array_elements_text(COALESCE(to_jsonb(pu.ritmos), '[]'::jsonb)) AS raw_id
  FROM public.profiles_user pu
  WHERE p_context = 'bailarines'
    AND pu.onboarding_complete = true

  UNION ALL
  SELECT jsonb_array_elements_text(COALESCE(to_jsonb(pb.ritmos), '[]'::jsonb)) AS raw_id
  FROM public.profiles_brand pb
  WHERE p_context = 'marcas'
    AND pb.estado_aprobacion = 'aprobado'
),
direct_ids AS (
  SELECT DISTINCT raw_id::bigint AS id
  FROM direct_id_texts
  WHERE raw_id ~ '^[0-9]+$'
),
slug_texts AS (
  -- ======================
  -- EVENTOS / SOCIALES (events_date -> cronograma prioritario)
  -- ======================
  -- cronograma.ritmosSeleccionados / ritmos_seleccionados
  SELECT lower(trim(x)) AS slug
  FROM event_scope es,
       jsonb_array_elements(COALESCE(es.cronograma, '[]'::jsonb)) AS cls,
       jsonb_array_elements_text(COALESCE(cls->'ritmosSeleccionados', cls->'ritmos_seleccionados', '[]'::jsonb)) AS x
  WHERE p_context IN ('eventos', 'sociales')
    AND jsonb_typeof(COALESCE(cls->'ritmosSeleccionados', cls->'ritmos_seleccionados', '[]'::jsonb)) = 'array'

  UNION ALL
  -- fallback legacy: ritmos_seleccionados[] del evento solo cuando cronograma no trae ritmos
  SELECT lower(trim(x)) AS slug
  FROM event_scope es,
       jsonb_array_elements_text(COALESCE(to_jsonb(es.ritmos_seleccionados), '[]'::jsonb)) AS x
  WHERE p_context IN ('eventos', 'sociales')
    AND NOT es.cronograma_has_rhythms

  -- ======================
  -- CLASES (cronograma slugs)
  -- ======================
  UNION ALL
  SELECT lower(trim(x)) AS slug
  FROM public.profiles_academy pa,
       jsonb_array_elements(COALESCE(pa.cronograma, '[]'::jsonb)) AS cls,
       jsonb_array_elements_text(COALESCE(cls->'ritmosSeleccionados', cls->'ritmos_seleccionados', '[]'::jsonb)) AS x
  WHERE p_context = 'clases'
    AND pa.estado_aprobacion = 'aprobado'
    AND jsonb_typeof(COALESCE(cls->'ritmosSeleccionados', cls->'ritmos_seleccionados', '[]'::jsonb)) = 'array'

  UNION ALL
  SELECT lower(trim(x)) AS slug
  FROM public.profiles_teacher pt,
       jsonb_array_elements(COALESCE(pt.cronograma, '[]'::jsonb)) AS cls,
       jsonb_array_elements_text(COALESCE(cls->'ritmosSeleccionados', cls->'ritmos_seleccionados', '[]'::jsonb)) AS x
  WHERE p_context = 'clases'
    AND pt.estado_aprobacion = 'aprobado'
    AND jsonb_typeof(COALESCE(cls->'ritmosSeleccionados', cls->'ritmos_seleccionados', '[]'::jsonb)) = 'array'

  -- ======================
  -- PERFILES (catálogo/slugs)
  -- ======================
  UNION ALL
  SELECT lower(trim(x)) AS slug
  FROM public.profiles_academy pa,
       jsonb_array_elements_text(COALESCE(to_jsonb(pa.ritmos_seleccionados), '[]'::jsonb)) AS x
  WHERE p_context = 'academias'
    AND pa.estado_aprobacion = 'aprobado'

  UNION ALL
  SELECT lower(trim(x)) AS slug
  FROM public.profiles_teacher pt,
       jsonb_array_elements_text(COALESCE(to_jsonb(pt.ritmos_seleccionados), '[]'::jsonb)) AS x
  WHERE p_context = 'maestros'
    AND pt.estado_aprobacion = 'aprobado'

  UNION ALL
  SELECT lower(trim(x)) AS slug
  FROM public.profiles_organizer po,
       jsonb_array_elements_text(COALESCE(to_jsonb(po.ritmos_seleccionados), '[]'::jsonb)) AS x
  WHERE p_context = 'organizadores'
    AND po.estado_aprobacion = 'aprobado'

  UNION ALL
  SELECT lower(trim(x)) AS slug
  FROM public.profiles_user pu,
       jsonb_array_elements_text(COALESCE(to_jsonb(pu.ritmos_seleccionados), '[]'::jsonb)) AS x
  WHERE p_context = 'bailarines'
    AND pu.onboarding_complete = true
),
slug_ids AS (
  SELECT DISTINCT t.id
  FROM slug_texts s
  JOIN public.tags t
    ON t.tipo = 'ritmo'
   AND lower(t.slug) = s.slug
  WHERE s.slug IS NOT NULL
    AND s.slug <> ''
),
all_ids AS (
  SELECT id FROM direct_ids
  UNION
  SELECT id FROM slug_ids
)
SELECT t.id, t.nombre, t.slug
FROM public.tags t
JOIN all_ids a ON a.id = t.id
WHERE t.tipo = 'ritmo'
  AND p_context IN ('eventos', 'sociales', 'clases', 'academias', 'maestros', 'organizadores', 'bailarines', 'marcas')
ORDER BY t.nombre ASC;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_used_rhythms_by_context(text) TO anon, authenticated;
