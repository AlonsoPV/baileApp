-- SCRIPT_21_ADD_PIN_HASH.sql
-- Agrega el campo pin_hash a la tabla profiles_user para soportar PIN de 4 dígitos

begin;

-- 1) Agregar columna si no existe (almacena hash SHA-256 en hex)
alter table if exists public.profiles_user
  add column if not exists pin_hash text;

-- Opcional: Validar formato hex de 64 chars (SHA-256)
-- Nota: Si tu Postgres < 16, usa DO $$ ... $$ para manejo de errores de constraint duplicada
-- alter table public.profiles_user
--   add constraint profiles_user_pin_hash_hex_chk
--   check (pin_hash is null or pin_hash ~ '^[0-9a-f]{64}$');

-- 2) Comentario de ayuda
comment on column public.profiles_user.pin_hash is 'Hash SHA-256 en hex del PIN (4 dígitos). Se guarda solo el hash, nunca el PIN en claro.';

commit;


