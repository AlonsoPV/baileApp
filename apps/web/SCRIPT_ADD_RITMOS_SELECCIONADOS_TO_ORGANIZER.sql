-- Adds ritmos_seleccionados to profiles_organizer to store allowed catalog rhythm IDs
alter table if exists profiles_organizer
  add column if not exists ritmos_seleccionados text[] default '{}';


