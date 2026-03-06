-- Ritmos contextuales por tipo de Explore.
-- Devuelve únicamente tags de tipo "ritmo" realmente usados en el contexto pedido.

DROP FUNCTION IF EXISTS public.rpc_get_used_rhythms(text) CASCADE;

CREATE OR REPLACE FUNCTION public.rpc_get_used_rhythms(p_context text)
RETURNS TABLE(id bigint, nombre text, slug text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
WITH direct_id_texts AS (
  -- ======================
  -- SOCIALES (eventos)
  -- ======================
  SELECT jsonb_array_elements_text(COALESCE(to_jsonb(ed.estilos), '[]'::jsonb)) AS raw_id
  FROM public.events_date ed
  WHERE p_context = 'sociales'
    AND ed.estado_publicacion = 'publicado'

  UNION ALL
  SELECT jsonb_array_elements_text(COALESCE(to_jsonb(ep.estilos), '[]'::jsonb)) AS raw_id
  FROM public.events_parent ep
  WHERE p_context = 'sociales'
    AND EXISTS (
      SELECT 1
      FROM public.events_date edp
      WHERE edp.parent_id = ep.id
        AND edp.estado_publicacion = 'publicado'
    )

  -- ======================
  -- CLASES (cronograma en perfiles academy/teacher)
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

  -- ======================
  -- PERFILES (ritmos numéricos)
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

),
direct_ids AS (
  SELECT DISTINCT raw_id::bigint AS id
  FROM direct_id_texts
  WHERE raw_id ~ '^[0-9]+$'
),
slug_texts AS (
  -- ======================
  -- SOCIALES (slugs/catálogo)
  -- ======================
  SELECT lower(trim(x)) AS slug
  FROM public.events_date ed,
       jsonb_array_elements_text(COALESCE(to_jsonb(ed.ritmos_seleccionados), '[]'::jsonb)) AS x
  WHERE p_context = 'sociales'
    AND ed.estado_publicacion = 'publicado'

  UNION ALL
  SELECT lower(trim(x)) AS slug
  FROM public.events_parent ep,
       jsonb_array_elements_text(COALESCE(to_jsonb(ep.ritmos_seleccionados), '[]'::jsonb)) AS x
  WHERE p_context = 'sociales'
    AND EXISTS (
      SELECT 1
      FROM public.events_date edp
      WHERE edp.parent_id = ep.id
        AND edp.estado_publicacion = 'publicado'
    )

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
  -- PERFILES (slugs/catálogo)
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
ORDER BY t.nombre ASC;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_used_rhythms(text) TO anon, authenticated;
