-- Función RPC para que maestros vean métricas agregadas de sus clases
-- Similar a get_academy_class_metrics pero para maestros

-- Eliminar la función existente si existe (necesario porque puede cambiar el tipo de retorno)
drop function if exists public.get_teacher_class_metrics(bigint);

-- Crear la nueva función con el tipo de retorno
create function public.get_teacher_class_metrics(p_teacher_id bigint)
returns table (
  class_id bigint,
  total_tentativos bigint,
  por_rol jsonb,
  nombre_clase text,
  fecha_clase text,
  precio_clase numeric
) 
language plpgsql
security definer
as $$
declare
  cronograma_data jsonb;
  costos_data jsonb;
begin
  -- Verificar que el usuario es dueño del maestro o superadmin
  if not (
    exists (
      select 1 from public.profiles_teacher 
      where id = p_teacher_id 
      and user_id = auth.uid()
    )
    or
    exists (
      select 1 from public.role_requests 
      where user_id = auth.uid() 
      and role_slug = 'superadmin' 
      and status = 'aprobado'
    )
  ) then
    raise exception 'No tienes permisos para ver estas métricas';
  end if;

  -- Obtener cronograma y costos del maestro
  select cronograma, costos into cronograma_data, costos_data
  from public.profiles_teacher
  where id = p_teacher_id;

  -- Inicializar costos_data si es null
  if costos_data is null then
    costos_data := '[]'::jsonb;
  end if;

  -- Si no hay cronograma, retornar métricas sin detalles de clase
  if cronograma_data is null or (jsonb_typeof(cronograma_data) = 'array' and jsonb_array_length(cronograma_data) = 0) then
    return query
    select 
      ca.class_id,
      count(*)::bigint as total_tentativos,
      jsonb_build_object(
        'leader', count(*) filter (where ca.role_baile in ('lead', 'leader'))::bigint,
        'follower', count(*) filter (where ca.role_baile in ('follow', 'follower'))::bigint,
        'ambos', count(*) filter (where ca.role_baile = 'ambos')::bigint,
        'otros', count(*) filter (where ca.role_baile not in ('lead', 'leader', 'follow', 'follower', 'ambos') or ca.role_baile is null)::bigint
      ) as por_rol,
      'Clase #' || ca.class_id::text as nombre_clase,
      null::text as fecha_clase,
      null::numeric as precio_clase
    from public.clase_asistencias ca
    where ca.teacher_id = p_teacher_id
      and ca.status = 'tentative'
    group by ca.class_id, ca.fecha_especifica;
    return;
  end if;

  -- Retornar métricas con detalles de clase
  return query
  with class_details as (
    -- Buscar cada clase en el cronograma por su ID
    select distinct
      ca.class_id,
      -- Buscar el item en el cronograma que coincida con el class_id y extraer campos
      -- Estrategia de búsqueda similar a academias
      coalesce(
        (select t.value->>'titulo' from jsonb_array_elements(cronograma_data) with ordinality as t where (t.value->>'id')::bigint = ca.class_id limit 1),
        (select t.value->>'nombre' from jsonb_array_elements(cronograma_data) with ordinality as t where (t.value->>'id')::bigint = ca.class_id limit 1),
        (select t.value->>'titulo' from jsonb_array_elements(cronograma_data) with ordinality as t where ca.class_id % 1000 = 0 and (ca.class_id / 1000)::integer = t.ordinality - 1 limit 1),
        (select t.value->>'nombre' from jsonb_array_elements(cronograma_data) with ordinality as t where ca.class_id % 1000 = 0 and (ca.class_id / 1000)::integer = t.ordinality - 1 limit 1),
        (select t.value->>'titulo' from jsonb_array_elements(cronograma_data) with ordinality as t where ca.class_id < 1000 and ca.class_id::integer = t.ordinality - 1 limit 1),
        (select t.value->>'nombre' from jsonb_array_elements(cronograma_data) with ordinality as t where ca.class_id < 1000 and ca.class_id::integer = t.ordinality - 1 limit 1),
        (select t.value->>'titulo' from jsonb_array_elements(cronograma_data) with ordinality as t where ca.class_id = p_teacher_id and t.ordinality = 1 limit 1),
        (select t.value->>'nombre' from jsonb_array_elements(cronograma_data) with ordinality as t where ca.class_id = p_teacher_id and t.ordinality = 1 limit 1),
        'Clase #' || ca.class_id::text
      ) as nombre_clase,
      -- Extraer fecha o día de la semana
      (
        select 
          case 
            when clase_item.value->>'fecha' is not null then clase_item.value->>'fecha'
            when clase_item.value->>'diaSemana' is not null then
              case (clase_item.value->>'diaSemana')::integer
                when 0 then 'Domingo'
                when 1 then 'Lunes'
                when 2 then 'Martes'
                when 3 then 'Miércoles'
                when 4 then 'Jueves'
                when 5 then 'Viernes'
                when 6 then 'Sábado'
                else null
              end
            when clase_item.value->>'dia_semana' is not null then
              case (clase_item.value->>'dia_semana')::integer
                when 0 then 'Domingo'
                when 1 then 'Lunes'
                when 2 then 'Martes'
                when 3 then 'Miércoles'
                when 4 then 'Jueves'
                when 5 then 'Viernes'
                when 6 then 'Sábado'
                else null
              end
            when jsonb_typeof(clase_item.value->'diasSemana') = 'array' and jsonb_array_length(clase_item.value->'diasSemana') > 0 then
              (select trim(both '"' from elem::text) from jsonb_array_elements(clase_item.value->'diasSemana') as elem limit 1)
            else null
          end
        from (
          select t.value
          from jsonb_array_elements(cronograma_data) with ordinality as t
          where (t.value->>'id')::bigint = ca.class_id
             or (ca.class_id % 1000 = 0 and (ca.class_id / 1000)::integer = t.ordinality - 1)
             or (ca.class_id < 1000 and ca.class_id::integer = t.ordinality - 1)
             or (ca.class_id = p_teacher_id and t.ordinality = 1)
          limit 1
        ) as clase_item
      ) as fecha_clase,
      coalesce(
        (select t.value->>'referenciaCosto' from jsonb_array_elements(cronograma_data) with ordinality as t where (t.value->>'id')::bigint = ca.class_id limit 1),
        (select t.value->>'referenciaCosto' from jsonb_array_elements(cronograma_data) with ordinality as t where ca.class_id % 1000 = 0 and (ca.class_id / 1000)::integer = t.ordinality - 1 limit 1),
        (select t.value->>'referenciaCosto' from jsonb_array_elements(cronograma_data) with ordinality as t where ca.class_id < 1000 and ca.class_id::integer = t.ordinality - 1 limit 1),
        (select t.value->>'referenciaCosto' from jsonb_array_elements(cronograma_data) with ordinality as t where ca.class_id = p_teacher_id and t.ordinality = 1 limit 1),
        ''
      ) as referencia_costo
    from public.clase_asistencias ca
    where ca.teacher_id = p_teacher_id
      and ca.status = 'tentative'
  )
  select 
    ca.class_id,
    count(*)::bigint as total_tentativos,
    jsonb_build_object(
      'leader', count(*) filter (where ca.role_baile in ('lead', 'leader'))::bigint,
      'follower', count(*) filter (where ca.role_baile in ('follow', 'follower'))::bigint,
      'ambos', count(*) filter (where ca.role_baile = 'ambos')::bigint,
      'otros', count(*) filter (where ca.role_baile not in ('lead', 'leader', 'follow', 'follower', 'ambos') or ca.role_baile is null)::bigint
    ) as por_rol,
    cd.nombre_clase,
    -- Mostrar fecha específica si existe, si no mostrar fecha_clase (día de la semana)
    coalesce(
      ca.fecha_especifica::text,
      cd.fecha_clase
    ) as fecha_clase,
    -- Extraer precio de la clase desde costos usando referenciaCosto
    (
      select (costo_elem->>'precio')::numeric
      from jsonb_array_elements(
        case 
          when costos_data is null or jsonb_typeof(costos_data) != 'array' then '[]'::jsonb
          else costos_data
        end
      ) as costo_elem
      where lower(trim((costo_elem->>'nombre')::text)) = lower(trim(cd.referencia_costo))
      limit 1
    ) as precio_clase
  from public.clase_asistencias ca
  left join class_details cd on cd.class_id = ca.class_id
  where ca.teacher_id = p_teacher_id
    and ca.status = 'tentative'
  group by ca.class_id, ca.fecha_especifica, cd.nombre_clase, cd.fecha_clase, cd.referencia_costo;
end;
$$;

comment on function public.get_teacher_class_metrics is 'Permite a los maestros ver métricas agregadas de sus clases con detalles (nombre, fecha, precio). Solo dueños o superadmins.';

