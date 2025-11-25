-- Agregar campo fecha_especifica a clase_asistencias para registrar instancias específicas
-- de clases recurrentes (ej: primer lunes, segundo lunes, etc.)

-- Agregar columna fecha_especifica (puede ser null para clases con fecha específica ya definida)
alter table public.clase_asistencias 
add column if not exists fecha_especifica date;

-- Crear índice para búsquedas por fecha
create index if not exists idx_clase_asistencias_fecha_especifica 
on public.clase_asistencias(fecha_especifica);

-- Eliminar la restricción unique anterior (user_id, class_id)
alter table public.clase_asistencias 
drop constraint if exists clase_asistencias_user_id_class_id_key;

-- Crear nueva restricción unique que incluye fecha_especifica
-- Esto permite múltiples registros por usuario/clase, uno por cada fecha específica
alter table public.clase_asistencias 
add constraint clase_asistencias_user_class_fecha_unique 
unique(user_id, class_id, fecha_especifica);

-- Comentario
comment on column public.clase_asistencias.fecha_especifica is 'Fecha específica de la clase recurrente (ej: 2024-01-15 para el primer lunes de enero). NULL para clases con fecha ya definida en el cronograma.';

