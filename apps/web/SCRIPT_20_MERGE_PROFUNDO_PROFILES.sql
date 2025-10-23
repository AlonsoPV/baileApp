-- ============================================
-- SCRIPT 20: Merge Profundo para Profiles
-- ============================================
-- Este script implementa funciones de merge profundo para JSONB
-- que permiten editar perfiles sin borrar datos existentes.
-- ============================================

-- 1) Función utilitaria: jsonb_deep_merge
-- Fusiona recursivamente dos objetos JSONB
-- b pisa a a, pero respeta subclaves que no están en b
CREATE OR REPLACE FUNCTION public.jsonb_deep_merge(a jsonb, b jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    jsonb_object_agg(
      coalesce(ka, kb),
      CASE
        WHEN jsonb_typeof(va) = 'object' AND jsonb_typeof(vb) = 'object'
          THEN public.jsonb_deep_merge(va, vb)
        ELSE coalesce(vb, va)
      END
    )
  FROM
    (SELECT * FROM jsonb_each(a)) AS ea(ka, va)
  FULL JOIN
    (SELECT * FROM jsonb_each(b)) AS eb(kb, vb)
  ON ka = kb
$$;

-- 2) Reemplaza merge_profiles_user para fusionar respuestas
CREATE OR REPLACE FUNCTION public.merge_profiles_user(p_user_id uuid, p_patch jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prev            public.profiles_user%rowtype;
  v_next_respuestas jsonb;
  v_next_media      jsonb;
  v_next_redes      jsonb;
BEGIN
  SELECT * INTO v_prev FROM public.profiles_user WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    -- Auto crear fila mínima para evitar updates vacíos
    INSERT INTO public.profiles_user(user_id) VALUES (p_user_id);
    SELECT * INTO v_prev FROM public.profiles_user WHERE user_id = p_user_id FOR UPDATE;
  END IF;

  -- respuestas: merge profundo (no borra redes si no vienen)
  IF p_patch ? 'respuestas' THEN
    v_next_respuestas := public.jsonb_deep_merge(
      coalesce(v_prev.respuestas, '{}'::jsonb), 
      p_patch->'respuestas'
    );
  ELSE
    v_next_respuestas := v_prev.respuestas;
  END IF;

  -- redes_sociales: merge profundo también
  IF p_patch ? 'redes_sociales' THEN
    v_next_redes := public.jsonb_deep_merge(
      coalesce(v_prev.redes_sociales, '{}'::jsonb), 
      p_patch->'redes_sociales'
    );
  ELSE
    v_next_redes := v_prev.redes_sociales;
  END IF;

  -- media: se reemplaza sólo si viene; si no, conserva
  v_next_media := coalesce(p_patch->'media', v_prev.media);

  UPDATE public.profiles_user
  SET
    display_name = coalesce(p_patch->>'display_name', v_prev.display_name),
    bio          = coalesce(p_patch->>'bio',          v_prev.bio),
    avatar_url   = coalesce(p_patch->>'avatar_url',   v_prev.avatar_url),
    email        = coalesce(p_patch->>'email',        v_prev.email),

    ritmos = CASE WHEN p_patch ? 'ritmos'
             THEN (SELECT coalesce(array_agg((x)::integer), '{}')
                   FROM jsonb_array_elements_text(p_patch->'ritmos') AS x)
             ELSE v_prev.ritmos END,

    zonas = CASE WHEN p_patch ? 'zonas'
            THEN (SELECT coalesce(array_agg((x)::integer), '{}')
                  FROM jsonb_array_elements_text(p_patch->'zonas') AS x)
            ELSE v_prev.zonas END,

    redes_sociales = v_next_redes,
    respuestas     = v_next_respuestas,
    media          = v_next_media
  WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.merge_profiles_user(uuid, jsonb) TO authenticated, anon;

-- 3) Comentarios
COMMENT ON FUNCTION public.jsonb_deep_merge IS 
'Fusiona recursivamente dos objetos JSONB. El segundo objeto (b) pisa al primero (a), pero respeta subclaves que no están en b.';

COMMENT ON FUNCTION public.merge_profiles_user IS 
'Actualiza un perfil de usuario fusionando los cambios con los datos existentes. No borra campos que no se envían en el patch.';

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Test básico de jsonb_deep_merge
DO $$
DECLARE
  a jsonb := '{"redes": {"instagram": "https://instagram.com/user1", "tiktok": "https://tiktok.com/@user1"}, "otras": {"dato": "valor"}}'::jsonb;
  b jsonb := '{"redes": {"youtube": "https://youtube.com/user1"}}'::jsonb;
  resultado jsonb;
BEGIN
  resultado := public.jsonb_deep_merge(a, b);
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'TEST DE MERGE PROFUNDO:';
  RAISE NOTICE 'Objeto A: %', a;
  RAISE NOTICE 'Objeto B: %', b;
  RAISE NOTICE 'Resultado: %', resultado;
  RAISE NOTICE '';
  
  IF resultado->'redes'->>'instagram' IS NOT NULL AND 
     resultado->'redes'->>'tiktok' IS NOT NULL AND 
     resultado->'redes'->>'youtube' IS NOT NULL THEN
    RAISE NOTICE '✅ Test exitoso: Se mantuvieron los valores de A y se agregaron los de B';
  ELSE
    RAISE NOTICE '❌ Test fallido: Se perdieron valores';
  END IF;
  RAISE NOTICE '==========================================';
END $$;

-- Ver un ejemplo de perfil de usuario
SELECT 
  user_id,
  display_name,
  redes_sociales,
  respuestas
FROM public.profiles_user
WHERE redes_sociales IS NOT NULL OR respuestas IS NOT NULL
LIMIT 1;
