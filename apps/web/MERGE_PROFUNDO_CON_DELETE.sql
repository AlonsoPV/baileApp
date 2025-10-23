-- Merge profundo que respeta "borrar" cuando vb es null o cadena vacía
create or replace function public.jsonb_deep_merge_delete(a jsonb, b jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  json_key text;
  va jsonb;
  vb jsonb;
  result jsonb := coalesce(a, '{}'::jsonb);
begin
  if b is null then
    return result;
  end if;

  for json_key, vb in select key, value from jsonb_each(b) loop
    va := result -> json_key;

    -- Si vb es null o cadena vacía => eliminar clave
    if vb is null or (jsonb_typeof(vb) = 'string' and trim(both from vb::text, '"') = '') then
      result := result - json_key;
      continue;
    end if;

    if jsonb_typeof(va) = 'object' and jsonb_typeof(vb) = 'object' then
      result := result || jsonb_build_object(json_key, public.jsonb_deep_merge_delete(va, vb));
    else
      result := result || jsonb_build_object(json_key, vb);
    end if;
  end loop;

  return result;
end;
$$;

-- Actualiza tu merge de profiles_user para usar la nueva función (en respuestas y redes_sociales si la usas)
create or replace function public.merge_profiles_user(p_user_id uuid, p_patch jsonb)
returns void
language plpgsql
security definer
as $$
declare
  v_prev public.profiles_user%rowtype;
  v_patch jsonb := coalesce(p_patch, '{}'::jsonb);
begin
  select * into v_prev from public.profiles_user where user_id = p_user_id for update;
  if not found then
    insert into public.profiles_user(user_id) values (p_user_id);
    select * into v_prev from public.profiles_user where user_id = p_user_id for update;
  end if;

  update public.profiles_user
  set
    display_name = coalesce(v_patch->>'display_name', v_prev.display_name),
    bio          = coalesce(v_patch->>'bio',          v_prev.bio),
    avatar_url   = coalesce(v_patch->>'avatar_url',   v_prev.avatar_url),

    ritmos = case when v_patch ? 'ritmos'
             then (select coalesce(array_agg((x)::bigint), '{}') from jsonb_array_elements_text(v_patch->'ritmos') x)
             else v_prev.ritmos end,

    zonas = case when v_patch ? 'zonas'
            then (select coalesce(array_agg((x)::bigint), '{}') from jsonb_array_elements_text(v_patch->'zonas') x)
            else v_prev.zonas end,

    -- 👇 merge profundo con delete (null / "")
    respuestas = case when v_patch ? 'respuestas'
                then public.jsonb_deep_merge_delete(coalesce(v_prev.respuestas, '{}'::jsonb), v_patch->'respuestas')
                else v_prev.respuestas end,

    -- si usas una columna separada redes_sociales, aplícale lo mismo:
    redes_sociales = case when v_patch ? 'redes_sociales'
                     then public.jsonb_deep_merge_delete(coalesce(v_prev.redes_sociales, '{}'::jsonb), v_patch->'redes_sociales')
                     else v_prev.redes_sociales end,

    media = coalesce(v_patch->'media', v_prev.media)

  where user_id = p_user_id;
end;
$$;

grant execute on function public.merge_profiles_user(uuid, jsonb) to authenticated, anon;
