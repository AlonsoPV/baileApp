-- ============================================
-- EMERGENCY FIX: merge_profiles_organizer
-- ============================================

-- 1. Verificar si la función existe
DO $$
DECLARE
  function_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'merge_profiles_organizer' 
      AND routine_schema = 'public'
  ) INTO function_exists;
  
  IF function_exists THEN
    RAISE NOTICE '✅ Función merge_profiles_organizer ya existe';
  ELSE
    RAISE NOTICE '❌ Función merge_profiles_organizer NO existe - creándola...';
  END IF;
END $$;

-- 2. Eliminar función si existe (para recrearla limpia)
DROP FUNCTION IF EXISTS public.merge_profiles_organizer(bigint, uuid, jsonb);

-- 3. Crear función jsonb_deep_merge si no existe
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

-- 4. Crear función merge_profiles_organizer
CREATE OR REPLACE FUNCTION public.merge_profiles_organizer(
  p_id bigint, 
  p_owner uuid, 
  p_patch jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prev public.profiles_organizer%rowtype;
  v_patch jsonb := coalesce(p_patch, '{}'::jsonb);
BEGIN
  -- Obtener registro actual
  SELECT * INTO v_prev FROM public.profiles_organizer WHERE id = p_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organizer % not found', p_id USING errcode='P0002';
  END IF;

  -- Verificar propiedad
  IF v_prev.user_id <> p_owner THEN
    RAISE EXCEPTION 'Forbidden' USING errcode='42501';
  END IF;

  -- Actualizar campos
  UPDATE public.profiles_organizer
  SET
    nombre_publico = CASE 
      WHEN v_patch ? 'nombre_publico' THEN v_patch->>'nombre_publico'
      ELSE v_prev.nombre_publico 
    END,
    
    bio = CASE 
      WHEN v_patch ? 'bio' THEN v_patch->>'bio'
      ELSE v_prev.bio 
    END,

    ritmos = CASE 
      WHEN v_patch ? 'ritmos' THEN
        (SELECT coalesce(array_agg((x)::integer), '{}')
         FROM jsonb_array_elements_text(v_patch->'ritmos') x)
      ELSE v_prev.ritmos 
    END,

    zonas = CASE 
      WHEN v_patch ? 'zonas' THEN
        (SELECT coalesce(array_agg((x)::integer), '{}')
         FROM jsonb_array_elements_text(v_patch->'zonas') x)
      ELSE v_prev.zonas 
    END,

    respuestas = CASE 
      WHEN v_patch ? 'respuestas' THEN
        public.jsonb_deep_merge(
          coalesce(v_prev.respuestas, '{}'::jsonb), 
          v_patch->'respuestas'
        )
      ELSE v_prev.respuestas 
    END,

    redes_sociales = CASE 
      WHEN v_patch ? 'redes_sociales' THEN
        public.jsonb_deep_merge(
          coalesce(v_prev.redes_sociales, '{}'::jsonb), 
          v_patch->'redes_sociales'
        )
      ELSE v_prev.redes_sociales 
    END,

    media = CASE 
      WHEN v_patch ? 'media' THEN v_patch->'media'
      ELSE v_prev.media 
    END,

    estado_aprobacion = CASE 
      WHEN v_patch ? 'estado_aprobacion' THEN v_patch->>'estado_aprobacion'
      ELSE v_prev.estado_aprobacion 
    END

  WHERE id = p_id;
  
  RAISE NOTICE '✅ Organizer % actualizado exitosamente', p_id;
END;
$$;

-- 5. Otorgar permisos
GRANT EXECUTE ON FUNCTION public.merge_profiles_organizer(bigint, uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.merge_profiles_organizer(bigint, uuid, jsonb) TO anon;

-- 6. Verificar creación
DO $$
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✅ FUNCIÓN merge_profiles_organizer CREADA';
  RAISE NOTICE '✅ Soporte para redes_sociales incluido';
  RAISE NOTICE '✅ Permisos otorgados';
  RAISE NOTICE '==========================================';
END $$;
