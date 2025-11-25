-- Tabla para guardar preferencias de filtros predeterminados por usuario
create table if not exists public.user_filter_preferences (
  id serial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ritmos int[] default '{}',
  zonas int[] default '{}',
  date_range text default 'none', -- 'hoy', 'semana', 'mes', 'custom', 'none'
  custom_days int, -- número de días para rango personalizado
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Índices
create index if not exists idx_user_filter_preferences_user on public.user_filter_preferences(user_id);

-- RLS
alter table public.user_filter_preferences enable row level security;

-- Eliminar políticas existentes si existen
drop policy if exists "user can manage own prefs" on public.user_filter_preferences;

-- Política: usuarios pueden gestionar sus propias preferencias
create policy "user can manage own prefs"
  on public.user_filter_preferences
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Comentarios
comment on table public.user_filter_preferences is 'Preferencias de filtros predeterminados por usuario para la sección de exploración';
comment on column public.user_filter_preferences.ritmos is 'Array de IDs de ritmos favoritos';
comment on column public.user_filter_preferences.zonas is 'Array de IDs de zonas favoritas';
comment on column public.user_filter_preferences.date_range is 'Rango de fecha predeterminado: hoy, semana, mes, custom, none';
comment on column public.user_filter_preferences.custom_days is 'Número de días para rango personalizado (solo si date_range = custom)';

