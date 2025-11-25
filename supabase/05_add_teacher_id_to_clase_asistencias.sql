-- Agregar campo teacher_id a clase_asistencias para soportar métricas de maestros
-- Similar a academy_id, pero para clases de maestros

-- Agregar columna teacher_id (puede ser null)
alter table public.clase_asistencias 
add column if not exists teacher_id bigint;

-- Crear índice para búsquedas por teacher_id
create index if not exists idx_clase_asistencias_teacher 
on public.clase_asistencias(teacher_id);

-- Comentario
comment on column public.clase_asistencias.teacher_id is 'ID del maestro dueño de la clase (opcional, para clases de maestros independientes)';

