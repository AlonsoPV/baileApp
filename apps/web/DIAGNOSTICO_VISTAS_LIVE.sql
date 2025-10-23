-- =====================================================
-- DIAGNÓSTICO: Vistas LIVE y Datos
-- =====================================================
-- Ejecuta este script en Supabase SQL Editor para diagnosticar
-- por qué no se muestran eventos en las vistas live
-- =====================================================

-- 1) Verificar si las vistas existen
SELECT 
  schemaname,
  viewname,
  viewowner
FROM pg_views 
WHERE viewname IN ('events_live', 'organizers_live')
ORDER BY viewname;

-- Si no aparecen, ejecuta SCRIPT_16_VISTAS_LIVE.sql primero

-- =====================================================
-- 2) Contar organizadores por estado
-- =====================================================
SELECT 
  estado_aprobacion,
  COUNT(*) as total
FROM profiles_organizer
GROUP BY estado_aprobacion
ORDER BY estado_aprobacion;

-- =====================================================
-- 3) Contar eventos padre por estado
-- =====================================================
SELECT 
  estado_aprobacion,
  COUNT(*) as total
FROM events_parent
GROUP BY estado_aprobacion
ORDER BY estado_aprobacion;

-- =====================================================
-- 4) Contar fechas de eventos por estado
-- =====================================================
SELECT 
  estado_publicacion,
  COUNT(*) as total
FROM events_date
GROUP BY estado_publicacion
ORDER BY estado_publicacion;

-- =====================================================
-- 5) Ver eventos completos (con estados)
-- =====================================================
SELECT 
  d.id as date_id,
  d.fecha,
  d.lugar,
  d.estado_publicacion as fecha_estado,
  p.nombre as evento_nombre,
  p.estado_aprobacion as padre_estado,
  o.nombre_publico as organizador,
  o.estado_aprobacion as org_estado,
  -- Cumple requisitos para vista live?
  CASE 
    WHEN d.estado_publicacion = 'publicado' 
      AND p.estado_aprobacion = 'aprobado'
      AND o.estado_aprobacion = 'aprobado'
    THEN '✅ SÍ'
    ELSE '❌ NO'
  END as aparece_en_live
FROM events_date d
LEFT JOIN events_parent p ON p.id = d.parent_id
LEFT JOIN profiles_organizer o ON o.id = p.organizer_id
ORDER BY d.created_at DESC
LIMIT 10;

-- =====================================================
-- 6) Verificar cuántos eventos están en la vista live
-- =====================================================
SELECT COUNT(*) as eventos_en_vista_live
FROM events_live;

-- Si es 0, ningún evento cumple los requisitos
-- Si da error "relation does not exist", ejecuta SCRIPT_16 primero

-- =====================================================
-- 7) Ver eventos en la vista live (si existen)
-- =====================================================
SELECT 
  id,
  fecha,
  lugar,
  ciudad,
  evento_nombre,
  organizador_nombre
FROM events_live
ORDER BY fecha
LIMIT 5;

-- =====================================================
-- 8) SOLUCIÓN: Aprobar/Publicar datos de prueba
-- =====================================================

-- Si no tienes eventos que aparezcan en live, ejecuta esto:

-- A) Aprobar organizador (cambia el ID)
-- UPDATE profiles_organizer 
-- SET estado_aprobacion = 'aprobado'
-- WHERE id = 1; -- Cambia por tu ID

-- B) Aprobar evento padre (cambia el ID)
-- UPDATE events_parent 
-- SET estado_aprobacion = 'aprobado'
-- WHERE id = 1; -- Cambia por tu ID

-- C) Publicar fecha de evento (cambia el ID)
-- UPDATE events_date 
-- SET estado_publicacion = 'publicado'
-- WHERE id = 1; -- Cambia por tu ID

-- Después de ejecutar estos UPDATEs, verifica de nuevo:
-- SELECT * FROM events_live;

-- =====================================================
-- 9) Script rápido para aprobar TODO (SOLO DESARROLLO)
-- =====================================================
-- ⚠️ CUIDADO: Esto aprueba/publica TODO. Solo para desarrollo/testing

/*
-- Aprobar todos los organizadores
UPDATE profiles_organizer SET estado_aprobacion = 'aprobado';

-- Aprobar todos los eventos padre
UPDATE events_parent SET estado_aprobacion = 'aprobado';

-- Publicar todas las fechas
UPDATE events_date SET estado_publicacion = 'publicado';

-- Verificar resultado
SELECT COUNT(*) FROM events_live;
SELECT COUNT(*) FROM organizers_live;
*/

-- =====================================================
-- NOTAS
-- =====================================================
-- 
-- Para que un evento aparezca en events_live, necesita:
-- 1. events_date.estado_publicacion = 'publicado'
-- 2. events_parent.estado_aprobacion = 'aprobado'
-- 3. profiles_organizer.estado_aprobacion = 'aprobado'
--
-- Si alguno de estos falta, el evento NO aparecerá en la vista live
-- =====================================================

