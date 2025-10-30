-- Adds ritmos_seleccionados to events_parent to store allowed catalog rhythm IDs for the social
alter table if exists events_parent
  add column if not exists ritmos_seleccionados text[] default '{}';


