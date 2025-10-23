-- Rehidratación confiable al volver a Editar
-- Ejecutar en Supabase SQL Editor

-- 1) Asegura columna updated_at en profiles_user (si aún no existe)
alter table public.profiles_user
  add column if not exists updated_at timestamptz default now();

-- 2) Función para actualizar updated_at automáticamente
create or replace function public.touch_profiles_user_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- 3) Trigger para actualizar updated_at en cada UPDATE
drop trigger if exists trg_touch_profiles_user on public.profiles_user;
create trigger trg_touch_profiles_user
before update on public.profiles_user
for each row execute function public.touch_profiles_user_updated_at();

-- 4) Actualizar updated_at para registros existentes
update public.profiles_user 
set updated_at = now() 
where updated_at is null;

-- 5) Verificación
DO $$
DECLARE
  test_count integer;
BEGIN
  SELECT COUNT(*) INTO test_count 
  FROM public.profiles_user 
  WHERE updated_at IS NOT NULL;
  
  RAISE NOTICE '✅ Registros con updated_at: %', test_count;
  
  IF test_count > 0 THEN
    RAISE NOTICE '✅ Columna updated_at configurada correctamente';
  ELSE
    RAISE NOTICE '❌ ERROR: No se pudo configurar updated_at';
  END IF;
END $$;
