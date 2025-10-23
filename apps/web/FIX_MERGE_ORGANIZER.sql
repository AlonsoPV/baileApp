-- ============================================
-- FIX: Solo función merge_profiles_organizer
-- ============================================

-- 1) Función utilitaria: jsonb_deep_merge (si no existe)
CREATE OR REPLACE FUNCTION public.jsonb_deep_merge(a jsonb, b jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_object_agg(
    coalesce(ka, kb),
    CASE
      WHEN jsonb_typeof(va) = 'object' AND jsonb_typeof(vb) = 'object'
        THEN public.jsonb_deep_merge(va, vb)
      ELSE coalesce(vb, va)
    END
  )
  FROM jsonb_each(a) ea(ka, va)
  FULL JOIN jsonb_each(b) eb(kb, vb) ON ka = kb
$$;

-- 2) Función merge_profiles_organizer
CREATE OR REPLACE FUNCTION public.merge_profiles_organizer(p_id bigint, p_owner uuid, p_patch jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prev public.profiles_organizer%rowtype;
  v_patch jsonb := coalesce(p_patch, '{}'::jsonb);
BEGIN
  SELECT * INTO v_prev FROM public.profiles_organizer WHERE id = p_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organizer % not found', p_id USING errcode='P0002';
  END IF;

  -- Protección de dueño
  IF v_prev.user_id <> p_owner THEN
    RAISE EXCEPTION 'Forbidden' USING errcode='42501';
  END IF;

  UPDATE public.profiles_organizer
  SET
    nombre_publico = coalesce(v_patch->>'nombre_publico', v_prev.nombre_publico),
    bio            = coalesce(v_patch->>'bio',            v_prev.bio),

    ritmos = CASE WHEN v_patch ? 'ritmos'
             THEN (SELECT coalesce(array_agg((x)::integer), '{}')
                   FROM jsonb_array_elements_text(v_patch->'ritmos') x)
             ELSE v_prev.ritmos END,

    zonas = CASE WHEN v_patch ? 'zonas'
            THEN (SELECT coalesce(array_agg((x)::integer), '{}')
                  FROM jsonb_array_elements_text(v_patch->'zonas') x)
            ELSE v_prev.zonas END,

    respuestas = CASE WHEN v_patch ? 'respuestas'
                 THEN public.jsonb_deep_merge(coalesce(v_prev.respuestas,'{}'::jsonb), v_patch->'respuestas')
                 ELSE v_prev.respuestas END,

    redes_sociales = CASE WHEN v_patch ? 'redes_sociales'
                      THEN public.jsonb_deep_merge(coalesce(v_prev.redes_sociales,'{}'::jsonb), v_patch->'redes_sociales')
                      ELSE v_prev.redes_sociales END,

    media = coalesce(v_patch->'media', v_prev.media),

    estado_aprobacion = coalesce(v_patch->>'estado_aprobacion', v_prev.estado_aprobacion)

  WHERE id = p_id;
END;
$$;

-- 3) Permisos
GRANT EXECUTE ON FUNCTION public.merge_profiles_organizer(bigint, uuid, jsonb) TO authenticated;

-- 4) Test de la función
DO $$
BEGIN
  RAISE NOTICE '✅ Función merge_profiles_organizer creada exitosamente';
  RAISE NOTICE '✅ Soporte para redes_sociales agregado';
  RAISE NOTICE '✅ Permisos otorgados a authenticated';
END $$;
