-- DIAGNOSTICO_EVENTOS_PUBLICOS.sql
-- Script para diagnosticar por qué no se ven eventos públicos

-- 1. ¿Cuántos eventos existen en total?
SELECT 
  'Total de eventos' as tipo,
  COUNT(*) as cantidad
FROM events_date;

-- 2. ¿Cuántos están publicados vs borradores?
SELECT 
  estado_publicacion,
  COUNT(*) as cantidad
FROM events_date
GROUP BY estado_publicacion;

-- 3. Ver todos los eventos con detalles
SELECT 
  ed.id,
  ed.fecha,
  ed.lugar,
  ed.ciudad,
  ed.estado_publicacion,
  ep.nombre as evento_nombre,
  po.nombre_publico as organizador,
  po.estado_aprobacion as estado_org
FROM events_date ed
JOIN events_parent ep ON ep.id = ed.parent_id
JOIN profiles_organizer po ON po.id = ep.organizer_id
ORDER BY ed.created_at DESC;

-- 4. ¿Hay eventos publicados con organizadores aprobados?
SELECT 
  COUNT(*) as eventos_publicados_aprobados
FROM events_date ed
JOIN events_parent ep ON ep.id = ed.parent_id
JOIN profiles_organizer po ON po.id = ep.organizer_id
WHERE ed.estado_publicacion = 'publicado'
  AND po.estado_aprobacion = 'aprobado';

-- 5. Ver políticas RLS actuales de events_date
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'events_date';

-- 6. Verificar si RLS está habilitado en events_date
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'events_date';

-- 7. Solución rápida: Listar eventos que DEBERÍAN ser visibles
SELECT 
  ed.id as event_date_id,
  ed.fecha,
  ed.hora_inicio,
  ed.lugar,
  ed.ciudad,
  ed.estado_publicacion,
  ep.nombre as evento_padre,
  po.nombre_publico as organizador,
  po.estado_aprobacion as estado_organizador,
  CASE 
    WHEN ed.estado_publicacion = 'publicado' THEN '✅ Debería verse'
    ELSE '❌ No visible (borrador)'
  END as visibilidad
FROM events_date ed
JOIN events_parent ep ON ep.id = ed.parent_id
JOIN profiles_organizer po ON po.id = ep.organizer_id
ORDER BY ed.fecha ASC;

-- 8. Recomendaciones
DO $$
DECLARE
  total_eventos INT;
  publicados INT;
  con_org_aprobado INT;
BEGIN
  SELECT COUNT(*) INTO total_eventos FROM events_date;
  SELECT COUNT(*) INTO publicados FROM events_date WHERE estado_publicacion = 'publicado';
  SELECT COUNT(*) INTO con_org_aprobado 
  FROM events_date ed
  JOIN events_parent ep ON ep.id = ed.parent_id
  JOIN profiles_organizer po ON po.id = ep.organizer_id
  WHERE ed.estado_publicacion = 'publicado' AND po.estado_aprobacion = 'aprobado';

  RAISE NOTICE '==========================================';
  RAISE NOTICE 'DIAGNÓSTICO DE EVENTOS PÚBLICOS';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Total de eventos: %', total_eventos;
  RAISE NOTICE 'Eventos publicados: %', publicados;
  RAISE NOTICE 'Publicados + Organizador aprobado: %', con_org_aprobado;
  RAISE NOTICE '';
  
  IF total_eventos = 0 THEN
    RAISE NOTICE '⚠️ NO HAY EVENTOS CREADOS';
    RAISE NOTICE 'Crea algunos eventos desde /events/new';
  ELSIF publicados = 0 THEN
    RAISE NOTICE '⚠️ NO HAY EVENTOS PUBLICADOS';
    RAISE NOTICE 'Edita tus eventos y marca "estado_publicacion = publicado"';
  ELSIF con_org_aprobado = 0 THEN
    RAISE NOTICE '⚠️ NO HAY ORGANIZADORES APROBADOS';
    RAISE NOTICE 'Aprueba el organizador:';
    RAISE NOTICE 'UPDATE profiles_organizer SET estado_aprobacion = ''aprobado'' WHERE id = X;';
  ELSE
    RAISE NOTICE '✅ HAY % EVENTOS VISIBLES', con_org_aprobado;
    RAISE NOTICE 'Ejecuta SCRIPT_13_FIX_EVENTS_PUBLIC_RLS.sql si aún no se ven';
  END IF;
  RAISE NOTICE '==========================================';
END $$;

