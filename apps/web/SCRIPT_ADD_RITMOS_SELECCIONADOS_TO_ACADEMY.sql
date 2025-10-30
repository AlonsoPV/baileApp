-- Adds ritmos_seleccionados to profiles_academy to store allowed catalog rhythm IDs
alter table if exists profiles_academy
  add column if not exists ritmos_seleccionados text[] default '{}';


