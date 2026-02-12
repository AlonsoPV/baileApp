-- Preservar display_name, bio, avatar_url y onboarding_complete en merge_profiles_user
-- cuando el patch no los envía o los envía vacíos (evita pérdida de datos en cada actualización).

CREATE OR REPLACE FUNCTION public.merge_profiles_user(
  p_user_id uuid,
  p_patch jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rol_baile text;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'No tienes permisos para modificar este perfil';
  END IF;

  INSERT INTO public.profiles_user (
    user_id,
    email,
    display_name,
    bio,
    avatar_url,
    rol_baile,
    ritmos,
    ritmos_seleccionados,
    zonas,
    onboarding_complete,
    media,
    redes_sociales,
    respuestas,
    rsvp_events
  )
  VALUES (
    p_user_id,
    COALESCE((p_patch->>'email')::text, auth.email()),
    NULLIF(TRIM((p_patch->>'display_name')::text), ''),
    NULLIF(TRIM((p_patch->>'bio')::text), ''),
    NULLIF(TRIM((p_patch->>'avatar_url')::text), ''),
    CASE 
      WHEN p_patch ? 'rol_baile' THEN NULLIF((p_patch->>'rol_baile')::text, '')
      ELSE NULL
    END,
    CASE 
      WHEN p_patch ? 'ritmos' THEN 
        (SELECT ARRAY(SELECT jsonb_array_elements_text(p_patch->'ritmos'))::integer[])
      ELSE NULL 
    END,
    CASE 
      WHEN p_patch ? 'ritmos_seleccionados' THEN 
        (SELECT ARRAY(SELECT jsonb_array_elements_text(p_patch->'ritmos_seleccionados')))
      ELSE NULL 
    END,
    CASE 
      WHEN p_patch ? 'zonas' THEN 
        (SELECT ARRAY(SELECT jsonb_array_elements_text(p_patch->'zonas'))::integer[])
      ELSE NULL 
    END,
    COALESCE((p_patch->>'onboarding_complete')::boolean, false),
    COALESCE(p_patch->'media', '[]'::jsonb),
    COALESCE(p_patch->'redes_sociales', '{}'::jsonb),
    COALESCE(p_patch->'respuestas', '{}'::jsonb),
    COALESCE(p_patch->'rsvp_events', '[]'::jsonb)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles_user.email),
    display_name = COALESCE(EXCLUDED.display_name, profiles_user.display_name),
    bio = COALESCE(EXCLUDED.bio, profiles_user.bio),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles_user.avatar_url),
    rol_baile = CASE 
      WHEN EXCLUDED.rol_baile IS NOT NULL THEN EXCLUDED.rol_baile
      ELSE profiles_user.rol_baile
    END,
    ritmos = COALESCE(EXCLUDED.ritmos, profiles_user.ritmos),
    ritmos_seleccionados = COALESCE(EXCLUDED.ritmos_seleccionados, profiles_user.ritmos_seleccionados),
    zonas = COALESCE(EXCLUDED.zonas, profiles_user.zonas),
    onboarding_complete = CASE WHEN p_patch ? 'onboarding_complete' THEN COALESCE(EXCLUDED.onboarding_complete, profiles_user.onboarding_complete) ELSE profiles_user.onboarding_complete END,
    media = profiles_user.media || EXCLUDED.media,
    redes_sociales = profiles_user.redes_sociales || EXCLUDED.redes_sociales,
    respuestas = CASE 
      WHEN EXCLUDED.respuestas IS NOT NULL AND jsonb_typeof(EXCLUDED.respuestas) = 'object' THEN
        public.jsonb_deep_merge(COALESCE(profiles_user.respuestas, '{}'::jsonb), EXCLUDED.respuestas)
      ELSE COALESCE(EXCLUDED.respuestas, profiles_user.respuestas)
    END,
    rsvp_events = COALESCE(EXCLUDED.rsvp_events, profiles_user.rsvp_events),
    updated_at = now();
END;
$$;
