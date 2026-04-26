-- Marcar asistencia/pago vía RPC: para filas de academia, solo plan Premium (superadmin sin cambio).

create or replace function public.assert_academy_attendance_flags_edit_allowed(p_academy_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
begin
  if exists (
    select 1
    from public.role_requests rr
    where rr.user_id = auth.uid()
      and rr.role_slug = 'superadmin'
      and rr.status = 'aprobado'
  ) then
    return;
  end if;

  select case lower(trim(coalesce(pa.subscription_plan, '')))
    when 'pro' then 'pro'
    when 'premium' then 'premium'
    else 'basic'
  end
  into v_plan
  from public.profiles_academy pa
  where pa.id = p_academy_id;

  if v_plan is null then
    raise exception 'No tienes permisos para actualizar este registro';
  end if;

  if v_plan <> 'premium' then
    raise exception 'ACADEMY_METRICS_ATTENDANCE_PREMIUM_ONLY Marcar asistencia y pago en métricas requiere plan Premium.';
  end if;
end;
$$;

comment on function public.assert_academy_attendance_flags_edit_allowed(bigint) is
'Dueño de academia: editar flags attended/paid solo con plan Premium.';

create or replace function public.rpc_update_clase_asistencia_flags(
  p_id bigint,
  p_attended boolean,
  p_paid boolean,
  p_payment_type text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.clase_asistencias%rowtype;
  v_ptype text;
  v_st text;
begin
  select * into v_row
  from public.clase_asistencias ca
  where ca.id = p_id;

  if not found then
    raise exception 'Registro de asistencia no encontrado';
  end if;

  if not (
    (v_row.academy_id is not null and public.is_academy_owner(v_row.academy_id))
    or (v_row.teacher_id is not null and public.is_teacher_owner(v_row.teacher_id))
    or exists (
      select 1
      from public.role_requests rr
      where rr.user_id = auth.uid()
        and rr.role_slug = 'superadmin'
        and rr.status = 'aprobado'
    )
  ) then
    raise exception 'No tienes permisos para actualizar este registro';
  end if;

  if v_row.academy_id is not null then
    perform public.assert_academy_attendance_flags_edit_allowed(v_row.academy_id);
  end if;

  v_ptype := null;
  if p_paid then
    v_ptype := coalesce(nullif(trim(p_payment_type), ''), 'class');
    if v_ptype not in ('class', 'package', 'other') then
      v_ptype := 'class';
    end if;
  end if;

  v_st := case
    when p_paid then 'pagado'
    when p_attended then 'attended'
    else 'tentative'
  end;

  update public.clase_asistencias
  set
    attended = p_attended,
    paid = p_paid,
    payment_type = v_ptype,
    status = v_st
  where id = p_id
  returning * into v_row;

  return jsonb_build_object(
    'id', v_row.id,
    'user_id', v_row.user_id,
    'class_id', v_row.class_id,
    'academy_id', v_row.academy_id,
    'attended', v_row.attended,
    'paid', v_row.paid,
    'payment_type', v_row.payment_type,
    'status', public.normalize_class_attendance_status(v_row.status)
  );
end;
$$;

create or replace function public.rpc_mark_class_attendance_attended(
  p_attendance_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.clase_asistencias%rowtype;
  v_prev_status text;
begin
  select *
  into v_row
  from public.clase_asistencias ca
  where ca.id = p_attendance_id;

  if not found then
    raise exception 'Registro de asistencia no encontrado';
  end if;

  if not (
    (v_row.academy_id is not null and public.is_academy_owner(v_row.academy_id))
    or (v_row.teacher_id is not null and public.is_teacher_owner(v_row.teacher_id))
    or exists (
      select 1
      from public.role_requests rr
      where rr.user_id = auth.uid()
        and rr.role_slug = 'superadmin'
        and rr.status = 'aprobado'
    )
  ) then
    raise exception 'No tienes permisos para actualizar esta asistencia';
  end if;

  if v_row.academy_id is not null then
    perform public.assert_academy_attendance_flags_edit_allowed(v_row.academy_id);
  end if;

  v_prev_status := public.normalize_class_attendance_status(v_row.status);

  update public.clase_asistencias
  set
    attended = true,
    status = case
      when coalesce(paid, false) then 'pagado'
      else 'attended'
    end
  where id = p_attendance_id
  returning * into v_row;

  return jsonb_build_object(
    'id', v_row.id,
    'user_id', v_row.user_id,
    'class_id', v_row.class_id,
    'academy_id', v_row.academy_id,
    'teacher_id', v_row.teacher_id,
    'previous_status', v_prev_status,
    'attended', v_row.attended,
    'status', public.normalize_class_attendance_status(v_row.status),
    'paid', v_row.paid,
    'fecha_especifica', v_row.fecha_especifica,
    'created_at', v_row.created_at
  );
end;
$$;

grant execute on function public.rpc_update_clase_asistencia_flags(bigint, boolean, boolean, text) to authenticated;
grant execute on function public.rpc_mark_class_attendance_attended(bigint) to authenticated;
