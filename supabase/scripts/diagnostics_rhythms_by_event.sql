-- Diagnostico por evento para comparar fuentes de ritmos
-- Cambia el valor de event_id en el CTE params.
WITH params AS (
  SELECT 11129::bigint AS event_id
),
ed AS (
  SELECT e.*
  FROM public.events_date e
  JOIN params p ON p.event_id = e.id
),
cronograma_rows AS (
  SELECT cls
  FROM ed, jsonb_array_elements(COALESCE(ed.cronograma, '[]'::jsonb)) AS cls
),
ids_estilos AS (
  SELECT DISTINCT x::bigint AS id
  FROM ed, jsonb_array_elements_text(COALESCE(to_jsonb(ed.estilos), '[]'::jsonb)) AS x
  WHERE x ~ '^[0-9]+$'
),
slugs_ritmos_seleccionados AS (
  SELECT DISTINCT lower(trim(x)) AS slug
  FROM ed, jsonb_array_elements_text(COALESCE(to_jsonb(ed.ritmos_seleccionados), '[]'::jsonb)) AS x
  WHERE NULLIF(trim(COALESCE(x, '')), '') IS NOT NULL
),
ids_cronograma AS (
  SELECT DISTINCT raw_id::bigint AS id
  FROM (
    SELECT cls->>'ritmoId' AS raw_id
    FROM cronograma_rows
    WHERE NULLIF(trim(COALESCE(cls->>'ritmoId', '')), '') IS NOT NULL

    UNION ALL
    SELECT jsonb_array_elements_text(COALESCE(cls->'ritmoIds', '[]'::jsonb)) AS raw_id
    FROM cronograma_rows
    WHERE jsonb_typeof(COALESCE(cls->'ritmoIds', '[]'::jsonb)) = 'array'

    UNION ALL
    SELECT jsonb_array_elements_text(COALESCE(cls->'ritmos', '[]'::jsonb)) AS raw_id
    FROM cronograma_rows
    WHERE jsonb_typeof(COALESCE(cls->'ritmos', '[]'::jsonb)) = 'array'
  ) raw
  WHERE raw_id ~ '^[0-9]+$'
),
slugs_cronograma AS (
  SELECT DISTINCT lower(trim(x)) AS slug
  FROM cronograma_rows,
       jsonb_array_elements_text(COALESCE(cls->'ritmosSeleccionados', cls->'ritmos_seleccionados', '[]'::jsonb)) AS x
  WHERE jsonb_typeof(COALESCE(cls->'ritmosSeleccionados', cls->'ritmos_seleccionados', '[]'::jsonb)) = 'array'
    AND NULLIF(trim(COALESCE(x, '')), '') IS NOT NULL
),
ids_from_slugs AS (
  SELECT DISTINCT t.id
  FROM (
    SELECT slug FROM slugs_ritmos_seleccionados
    UNION
    SELECT slug FROM slugs_cronograma
  ) s
  JOIN public.tags t
    ON t.tipo = 'ritmo'
   AND lower(t.slug) = s.slug
),
has_cronograma_rhythms AS (
  SELECT EXISTS (
    SELECT 1
    FROM cronograma_rows c
    WHERE
      NULLIF(trim(COALESCE(c.cls->>'ritmoId', '')), '') IS NOT NULL
      OR (jsonb_typeof(COALESCE(c.cls->'ritmoIds', '[]'::jsonb)) = 'array' AND jsonb_array_length(COALESCE(c.cls->'ritmoIds', '[]'::jsonb)) > 0)
      OR (jsonb_typeof(COALESCE(c.cls->'ritmos', '[]'::jsonb)) = 'array' AND jsonb_array_length(COALESCE(c.cls->'ritmos', '[]'::jsonb)) > 0)
      OR (jsonb_typeof(COALESCE(c.cls->'ritmosSeleccionados', '[]'::jsonb)) = 'array' AND jsonb_array_length(COALESCE(c.cls->'ritmosSeleccionados', '[]'::jsonb)) > 0)
      OR (jsonb_typeof(COALESCE(c.cls->'ritmos_seleccionados', '[]'::jsonb)) = 'array' AND jsonb_array_length(COALESCE(c.cls->'ritmos_seleccionados', '[]'::jsonb)) > 0)
  ) AS value
),
final_ids AS (
  -- Misma idea de prioridad que la RPC:
  -- si cronograma tiene ritmos, se usa cronograma (+ resolucion de slugs de cronograma).
  -- si no, fallback a estilos + ritmos_seleccionados de la fila.
  SELECT DISTINCT id
  FROM (
    SELECT i.id
    FROM ids_cronograma i
    JOIN has_cronograma_rhythms h ON h.value = true
    UNION
    SELECT t.id
    FROM slugs_cronograma s
    JOIN public.tags t ON t.tipo = 'ritmo' AND lower(t.slug) = s.slug
    JOIN has_cronograma_rhythms h ON h.value = true
    UNION
    SELECT i.id
    FROM ids_estilos i
    JOIN has_cronograma_rhythms h ON h.value = false
    UNION
    SELECT t.id
    FROM slugs_ritmos_seleccionados s
    JOIN public.tags t ON t.tipo = 'ritmo' AND lower(t.slug) = s.slug
    JOIN has_cronograma_rhythms h ON h.value = false
  ) u
)
SELECT
  p.event_id,
  COALESCE((SELECT array_agg(id ORDER BY id) FROM ids_estilos), ARRAY[]::bigint[]) AS ids_desde_estilos,
  COALESCE((SELECT array_agg(slug ORDER BY slug) FROM slugs_ritmos_seleccionados), ARRAY[]::text[]) AS slugs_desde_ritmos_seleccionados,
  COALESCE((SELECT array_agg(id ORDER BY id) FROM ids_cronograma), ARRAY[]::bigint[]) AS ids_desde_cronograma,
  COALESCE((SELECT array_agg(slug ORDER BY slug) FROM slugs_cronograma), ARRAY[]::text[]) AS slugs_desde_cronograma,
  COALESCE((SELECT value FROM has_cronograma_rhythms), false) AS cronograma_tiene_ritmos,
  COALESCE((SELECT array_agg(id ORDER BY id) FROM final_ids), ARRAY[]::bigint[]) AS ids_finales_resueltos,
  COALESCE((
    SELECT array_agg(t.slug ORDER BY t.slug)
    FROM public.tags t
    JOIN final_ids f ON f.id = t.id
    WHERE t.tipo = 'ritmo'
  ), ARRAY[]::text[]) AS slugs_finales_resueltos;

-- Detalle por fuente (una fila por ritmo detectado)
WITH params AS (
  SELECT 11129::bigint AS event_id
),
ed AS (
  SELECT e.*
  FROM public.events_date e
  JOIN params p ON p.event_id = e.id
),
cronograma_rows AS (
  SELECT cls
  FROM ed, jsonb_array_elements(COALESCE(ed.cronograma, '[]'::jsonb)) AS cls
),
raw_sources AS (
  SELECT 'estilos'::text AS source, x AS raw_value
  FROM ed, jsonb_array_elements_text(COALESCE(to_jsonb(ed.estilos), '[]'::jsonb)) AS x

  UNION ALL
  SELECT 'ritmos_seleccionados'::text AS source, lower(trim(x)) AS raw_value
  FROM ed, jsonb_array_elements_text(COALESCE(to_jsonb(ed.ritmos_seleccionados), '[]'::jsonb)) AS x
  WHERE NULLIF(trim(COALESCE(x, '')), '') IS NOT NULL

  UNION ALL
  SELECT 'cronograma.ritmoId'::text AS source, cls->>'ritmoId' AS raw_value
  FROM cronograma_rows
  WHERE NULLIF(trim(COALESCE(cls->>'ritmoId', '')), '') IS NOT NULL

  UNION ALL
  SELECT 'cronograma.ritmoIds'::text AS source, jsonb_array_elements_text(COALESCE(cls->'ritmoIds', '[]'::jsonb)) AS raw_value
  FROM cronograma_rows
  WHERE jsonb_typeof(COALESCE(cls->'ritmoIds', '[]'::jsonb)) = 'array'

  UNION ALL
  SELECT 'cronograma.ritmos'::text AS source, jsonb_array_elements_text(COALESCE(cls->'ritmos', '[]'::jsonb)) AS raw_value
  FROM cronograma_rows
  WHERE jsonb_typeof(COALESCE(cls->'ritmos', '[]'::jsonb)) = 'array'

  UNION ALL
  SELECT 'cronograma.ritmosSeleccionados'::text AS source, lower(trim(x)) AS raw_value
  FROM cronograma_rows,
       jsonb_array_elements_text(COALESCE(cls->'ritmosSeleccionados', cls->'ritmos_seleccionados', '[]'::jsonb)) AS x
  WHERE jsonb_typeof(COALESCE(cls->'ritmosSeleccionados', cls->'ritmos_seleccionados', '[]'::jsonb)) = 'array'
    AND NULLIF(trim(COALESCE(x, '')), '') IS NOT NULL
),
resolved AS (
  SELECT
    rs.source,
    rs.raw_value,
    CASE
      WHEN rs.raw_value ~ '^[0-9]+$' THEN rs.raw_value::bigint
      ELSE t.id
    END AS ritmo_id
  FROM raw_sources rs
  LEFT JOIN public.tags t
    ON t.tipo = 'ritmo'
   AND lower(t.slug) = rs.raw_value
)
SELECT
  source,
  raw_value,
  ritmo_id,
  t.nombre AS ritmo_nombre,
  t.slug AS ritmo_slug
FROM resolved r
LEFT JOIN public.tags t
  ON t.id = r.ritmo_id
 AND t.tipo = 'ritmo'
ORDER BY source, raw_value;
