-- ============================================================================
-- Diagnóstico: ¿Por qué no se muestran los eventos del organizer_id 14?
-- ============================================================================
-- Ejecutar en Supabase SQL Editor para identificar la causa.
-- ============================================================================

-- 1. Organizador 14 en profiles_organizer
SELECT 
  id,
  user_id,
  nombre_publico,
  estado_aprobacion,
  created_at
FROM public.profiles_organizer
WHERE id = 14;

-- 2. ¿Existe organizer 14 en v_organizers_public? (debe existir para ver la página)
SELECT id, nombre_publico 
FROM public.v_organizers_public 
WHERE id = 14;

-- 3. events_parent con organizer_id = 14
SELECT id, organizer_id, nombre, created_at
FROM public.events_parent
WHERE organizer_id = 14
ORDER BY created_at DESC;

-- 4. events_date con organizer_id = 14 (fuente directa de useEventDatesByOrganizer)
SELECT id, parent_id, organizer_id, nombre, fecha, dia_semana, estado_publicacion
FROM public.events_date
WHERE organizer_id = 14
ORDER BY fecha ASC;

-- 5. events_date por parent_id (si organizer_id en events_date es NULL)
SELECT ed.id, ed.parent_id, ed.organizer_id as ed_organizer_id, ep.organizer_id as ep_organizer_id, 
       ed.nombre, ed.fecha, ed.estado_publicacion
FROM public.events_date ed
JOIN public.events_parent ep ON ed.parent_id = ep.id
WHERE ep.organizer_id = 14
ORDER BY ed.fecha ASC
LIMIT 20;

-- 6. ¿Hay fechas futuras? (OrganizerPublicScreen filtra solo futuras)
SELECT 
  COUNT(*) FILTER (WHERE ed.fecha >= CURRENT_DATE OR ed.dia_semana IS NOT NULL) as futuras_o_recurrentes,
  COUNT(*) FILTER (WHERE ed.fecha < CURRENT_DATE AND ed.dia_semana IS NULL) as pasadas_especificas,
  COUNT(*) as total
FROM public.events_date ed
JOIN public.events_parent ep ON ed.parent_id = ep.id
WHERE ep.organizer_id = 14;

-- 7. events_live (usado en Explore / useEventsByOrganizerLive)
SELECT id, parent_id, nombre, fecha, organizador_id
FROM public.events_live
WHERE organizador_id = 14
ORDER BY fecha
LIMIT 10;

/*
RESUMEN DE POSIBLES CAUSAS:
- Si (3) está vacío: no hay events_parent para organizer 14.
- Si (4) está vacío pero (5) tiene filas: events_date.organizer_id puede ser NULL 
  → useEventDatesByOrganizer usa .eq("organizer_id", 14) y no encuentra filas.
- Si (6) muestra solo pasadas: todos los eventos son pasados 
  → OrganizerPublicScreen filtra solo fechas futuras.
- Si (7) está vacío: events_live filtra por estado_aprobacion='aprobado' + fecha>=hoy.
*/
