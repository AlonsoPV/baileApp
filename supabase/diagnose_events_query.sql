-- ========================================
-- 🔍 DIAGNÓSTICO: Error 400 en Query de Eventos
-- ========================================

-- 1. Verificar columnas de events_date
SELECT 
  '📋 COLUMNAS DE events_date' as info,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columnas_existentes
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'events_date';

-- 2. Verificar columnas de events_parent
SELECT 
  '📋 COLUMNAS DE events_parent' as info,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columnas_existentes
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'events_parent';

-- 3. Verificar columnas de profiles_organizer
SELECT 
  '📋 COLUMNAS DE profiles_organizer' as info,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columnas_existentes
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles_organizer';

-- 4. Probar la query exacta que usa la app (simplificada)
-- Si esta falla, sabremos qué columna falta
SELECT 
  ed.id,
  ed.parent_id,
  ed.nombre,
  ed.fecha,
  ed.hora_inicio,
  ed.hora_fin,
  ed.lugar,
  ed.direccion,
  ed.ciudad,
  ed.zona,
  ed.estilos,
  ed.media,
  ed.flyer_url,
  ep.nombre as parent_nombre,
  ep.descripcion as parent_descripcion,
  po.id as org_id,
  po.nombre_publico as org_nombre,
  po.bio as org_bio,
  po.estado_aprobacion
FROM public.events_date ed
JOIN public.events_parent ep ON ed.parent_id = ep.id
JOIN public.profiles_organizer po ON ep.organizer_id = po.user_id
WHERE po.estado_aprobacion = 'aprobado'
  AND ed.fecha >= CURRENT_DATE
LIMIT 5;

-- Si esta query falla con error de "column does not exist":
-- - Anota qué columna falta
-- - Ejecutar ALTER TABLE para agregarla

-- 5. Ver qué evento tenemos y verificar relaciones
SELECT 
  '🔍 DIAGNÓSTICO DEL EVENTO' as info,
  ed.id,
  ed.nombre,
  ed.fecha,
  ed.parent_id,
  ep.organizer_id,
  po.user_id as org_user_id,
  po.estado_aprobacion,
  CASE WHEN ed.fecha >= CURRENT_DATE THEN '✅ Futuro' ELSE '⚠️ Pasado' END as validez_fecha
FROM public.events_date ed
LEFT JOIN public.events_parent ep ON ed.parent_id = ep.id
LEFT JOIN public.profiles_organizer po ON ep.organizer_id = po.user_id;

-- 6. Si no aparece nada, el evento no existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.events_date) THEN '✅ Hay eventos en la tabla'
    ELSE '❌ NO hay eventos - ejecutar seed_staging.sql'
  END as estado;

