-- ========================================
-- 🔧 FIX: Error 400 en eventos (400 Bad Request)
-- ========================================
-- El error ocurre porque la query usa !inner join pero faltan relaciones

-- 1. Verificar el evento creado y sus relaciones
SELECT 
  ed.id as event_id,
  ed.nombre as event_nombre,
  ed.parent_id,
  ep.id as parent_id_real,
  ep.nombre as parent_nombre,
  ep.organizer_id,
  po.user_id as organizer_user_id,
  po.nombre_publico as organizer_nombre,
  po.estado_aprobacion
FROM public.events_date ed
LEFT JOIN public.events_parent ep ON ed.parent_id = ep.id
LEFT JOIN public.profiles_organizer po ON ep.organizer_id = po.user_id
ORDER BY ed.created_at DESC
LIMIT 5;

-- Si ves NULL en organizer_id o estado_aprobacion != 'aprobado':

-- 2. Corregir relación organizer_id
UPDATE public.events_parent
SET organizer_id = '00000000-0000-0000-0000-000000000002'
WHERE nombre = 'Social de Salsa Staging'
  AND (organizer_id IS NULL OR organizer_id != '00000000-0000-0000-0000-000000000002');

-- 3. Asegurar que el organizador esté aprobado
UPDATE public.profiles_organizer
SET estado_aprobacion = 'aprobado'
WHERE user_id = '00000000-0000-0000-0000-000000000002';

-- 4. Verificar que ahora sí está todo conectado
SELECT 
  '✅ VERIFICACIÓN' as status,
  ed.nombre as evento,
  ep.nombre as social,
  po.nombre_publico as organizador,
  po.estado_aprobacion
FROM public.events_date ed
JOIN public.events_parent ep ON ed.parent_id = ep.id
JOIN public.profiles_organizer po ON ep.organizer_id = po.user_id
WHERE ed.nombre = 'Social de Salsa - Viernes';

-- Deberías ver:
-- evento: Social de Salsa - Viernes
-- social: Social de Salsa Staging
-- organizador: Sociales de Prueba
-- estado_aprobacion: aprobado

-- 5. Si el problema persiste, verificar que la fecha sea futura
SELECT 
  nombre,
  fecha,
  CASE 
    WHEN fecha >= CURRENT_DATE THEN '✅ Futuro'
    ELSE '❌ Pasado (no se mostrará)'
  END as estado_fecha
FROM public.events_date
WHERE nombre = 'Social de Salsa - Viernes';

-- Si la fecha es pasada, actualizarla:
UPDATE public.events_date
SET fecha = CURRENT_DATE + INTERVAL '7 days'
WHERE nombre = 'Social de Salsa - Viernes';

