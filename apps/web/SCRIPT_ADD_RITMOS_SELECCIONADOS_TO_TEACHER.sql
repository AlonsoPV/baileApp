-- Adds ritmos_seleccionados to profiles_teacher to store allowed catalog rhythm IDs
alter table if exists profiles_teacher
  add column if not exists ritmos_seleccionados text[] default '{}';


