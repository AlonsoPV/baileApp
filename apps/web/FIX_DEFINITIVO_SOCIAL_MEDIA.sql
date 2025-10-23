-- Fix definitivo: social media, draft, y Live
-- Ejecutar en Supabase SQL Editor

-- 1) Migra redes_sociales -> respuestas.redes si no existen
update public.profiles_user
set respuestas = case
  when respuestas is null or respuestas = '{}'::jsonb
    then jsonb_build_object('redes', coalesce(redes_sociales, '{}'::jsonb))
  when not (respuestas ? 'redes')
    then jsonb_set(respuestas, '{redes}', coalesce(redes_sociales, '{}'::jsonb), true)
  else respuestas
end
where redes_sociales is not null and redes_sociales <> '{}'::jsonb;

-- 2) Vacía redes_sociales para que no vuelva a mostrarse como fallback
update public.profiles_user
set redes_sociales = null
where redes_sociales is not null;

-- 3) Agrega columna updated_at si no la tienes para invalidaciones
alter table public.profiles_user
  add column if not exists updated_at timestamptz default now();

-- 4) Crea trigger para actualizar updated_at automáticamente
create or replace function public.touch_profiles_user_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_touch_profiles_user on public.profiles_user;
create trigger trg_touch_profiles_user
before update on public.profiles_user
for each row execute function public.touch_profiles_user_updated_at();

-- 5) Función jsonb_deep_merge_delete (si no existe)
create or replace function public.jsonb_deep_merge_delete(a jsonb, b jsonb)
returns jsonb
language plpgsql
as $$
declare
  result jsonb := a;
  json_key text;
  json_value jsonb;
begin
  if b is null then return a; end if;
  
  for json_key, json_value in select * from jsonb_each(b) loop
    if json_value is null or json_value = '""'::jsonb or json_value = '""'::text::jsonb then
      -- Eliminar la clave si el valor es null o string vacío
      result := result - json_key;
    elsif jsonb_typeof(json_value) = 'object' and jsonb_typeof(result->json_key) = 'object' then
      -- Merge recursivo para objetos
      result := jsonb_set(result, array[json_key], jsonb_deep_merge_delete(result->json_key, json_value));
    else
      -- Reemplazar valor
      result := jsonb_set(result, array[json_key], json_value);
    end if;
  end loop;
  
  return result;
end;
$$;

-- 6) Función merge_profiles_user actualizada (NO toca redes_sociales)
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
    respuestas = case when v_patch ? 'respuestas'
                then public.jsonb_deep_merge_delete(coalesce(v_prev.respuestas, '{}'::jsonb), v_patch->'respuestas')
                else v_prev.respuestas end
  where user_id = p_user_id;
end;
$$;

-- 7) Permisos
grant execute on function public.merge_profiles_user(uuid, jsonb) to authenticated, anon;

-- 8) Verificación
DO $$
DECLARE
  test_user_id uuid := '0c20805f-519c-4e8e-9081-341ab64e504d';
  test_patch jsonb := '{"respuestas": {"redes": {"tiktok": "", "youtube": "", "facebook": ""}}}';
  result jsonb;
BEGIN
  -- Probar la función
  SELECT jsonb_deep_merge_delete(
    '{"redes": {"instagram": "ejemplo", "tiktok": "alonso", "youtube": "alonso", "facebook": "ejemplo", "whatsapp": "+525511981149"}}'::jsonb,
    test_patch->'respuestas'
  ) INTO result;
  
  RAISE NOTICE 'Test merge delete: %', result;
  
  IF result->'redes' ? 'tiktok' OR result->'redes' ? 'youtube' OR result->'redes' ? 'facebook' THEN
    RAISE NOTICE '❌ ERROR: Las claves vacías NO se eliminaron';
  ELSE
    RAISE NOTICE '✅ SUCCESS: Las claves vacías se eliminaron correctamente';
  END IF;
END $$;
