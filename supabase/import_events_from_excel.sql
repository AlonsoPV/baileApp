-- ============================================
-- IMPORTAR EVENTOS DESDE EXCEL/CSV
-- ============================================
-- Este script te permite importar eventos en masa desde Excel
-- 
-- INSTRUCCIONES:
-- 1. Prepara tu Excel con las columnas indicadas
-- 2. Reemplaza los valores en los INSERT con tus datos
-- 3. Ejecuta este script en Supabase SQL Editor
-- ============================================

-- ============================================
-- PASO 1: CREAR TABLAS TEMPORALES
-- ============================================

CREATE TEMP TABLE IF NOT EXISTS temp_events_parent (
  nombre text,
  descripcion text,
  organizer_email text,
  estilos text, -- "1,2,3" (IDs separados por comas)
  zonas text,   -- "1,2" (IDs separados por comas)
  sede_general text
);

CREATE TEMP TABLE IF NOT EXISTS temp_events_date (
  parent_nombre text,
  fecha date,
  hora_inicio time,
  hora_fin time,
  lugar text,
  direccion text,
  ciudad text,
  zona integer,
  estilos text, -- "1,2,3"
  nombre_fecha text,
  biografia text,
  referencias text,
  requisitos text
);

-- ============================================
-- PASO 2: INSERTAR DATOS DEL EXCEL
-- ============================================
-- ⚠️ REEMPLAZA ESTOS VALORES CON TUS DATOS DEL EXCEL

-- Datos de eventos parent (sociales)
INSERT INTO temp_events_parent (nombre, descripcion, organizer_email, estilos, zonas, sede_general) VALUES
-- Ejemplo 1:
('Salsa Night CDMX', 'Evento mensual de salsa en el corazón de la ciudad', 'organizador@email.com', '1,2', '1,2', 'Av. Reforma 123, CDMX'),
-- Ejemplo 2:
('Bachata Social', 'Evento semanal de bachata para todos los niveles', 'organizador@email.com', '3,4', '1', 'Calle Principal 456, CDMX'),
-- Ejemplo 3:
('Kizomba Weekend', 'Fin de semana completo de kizomba', 'organizador@email.com', '5', '2', 'Hotel Centro, CDMX');
-- ⬆️ Agrega más filas aquí según tu Excel

-- Datos de eventos date (fechas específicas)
INSERT INTO temp_events_date (parent_nombre, fecha, hora_inicio, hora_fin, lugar, direccion, ciudad, zona, estilos, nombre_fecha, biografia, referencias, requisitos) VALUES
-- Ejemplo 1:
('Salsa Night CDMX', '2025-02-15', '20:00', '23:00', 'Salón Principal', 'Av. Reforma 123', 'CDMX', 1, '1,2', 'Febrero 2025', 'Noche especial con DJ internacional', 'Cerca del metro Insurgentes', 'Mayores de 18 años'),
-- Ejemplo 2:
('Salsa Night CDMX', '2025-03-15', '20:00', '23:00', 'Salón Principal', 'Av. Reforma 123', 'CDMX', 1, '1,2', 'Marzo 2025', 'Noche especial con DJ internacional', 'Cerca del metro Insurgentes', 'Mayores de 18 años'),
-- Ejemplo 3:
('Bachata Social', '2025-02-20', '19:00', '22:00', 'Club Dance', 'Calle Principal 456', 'CDMX', 1, '3,4', 'Febrero 2025', 'Social de bachata con clase incluida', 'Estacionamiento disponible', 'Cambio de calzado obligatorio');
-- ⬆️ Agrega más filas aquí según tu Excel

-- ============================================
-- PASO 3: VERIFICAR DATOS TEMPORALES
-- ============================================

SELECT 
  '📋 EVENTOS PARENT A IMPORTAR' as info,
  COUNT(*) as total
FROM temp_events_parent;

SELECT 
  '📅 EVENTOS DATE A IMPORTAR' as info,
  COUNT(*) as total
FROM temp_events_date;

-- Verificar que los organizadores existan
SELECT 
  '⚠️ ORGANIZADORES NO ENCONTRADOS' as info,
  tep.organizer_email,
  tep.nombre as evento_nombre
FROM temp_events_parent tep
LEFT JOIN public.profiles_user pu ON pu.email = tep.organizer_email
WHERE pu.user_id IS NULL;

-- Si hay organizadores no encontrados, créalos primero o corrige los emails

-- ============================================
-- PASO 4: IMPORTAR EVENTOS PARENT
-- ============================================

INSERT INTO public.events_parent (
  nombre,
  descripcion,
  organizer_id,
  estilos,
  zonas,
  sede_general
)
SELECT 
  tep.nombre,
  tep.descripcion,
  pu.user_id as organizer_id, -- Convertir email a user_id
  string_to_array(tep.estilos, ',')::integer[] as estilos,
  string_to_array(tep.zonas, ',')::integer[] as zonas,
  tep.sede_general
FROM temp_events_parent tep
JOIN public.profiles_user pu ON pu.email = tep.organizer_email
WHERE NOT EXISTS (
  -- Evitar duplicados por nombre
  SELECT 1 FROM public.events_parent ep 
  WHERE ep.nombre = tep.nombre
)
RETURNING id, nombre, organizer_id;

-- ============================================
-- PASO 5: IMPORTAR EVENTOS DATE
-- ============================================

INSERT INTO public.events_date (
  parent_id,
  nombre,
  biografia,
  fecha,
  hora_inicio,
  hora_fin,
  lugar,
  direccion,
  ciudad,
  zona,
  referencias,
  requisitos,
  estilos,
  estado_publicacion
)
SELECT 
  ep.id as parent_id,
  COALESCE(ted.nombre_fecha, ep.nombre) as nombre,
  ted.biografia,
  ted.fecha,
  ted.hora_inicio,
  ted.hora_fin,
  ted.lugar,
  ted.direccion,
  ted.ciudad,
  ted.zona,
  ted.referencias,
  ted.requisitos,
  string_to_array(ted.estilos, ',')::integer[] as estilos,
  'publicado' as estado_publicacion -- O 'borrador' si prefieres
FROM temp_events_date ted
JOIN public.events_parent ep ON ep.nombre = ted.parent_nombre
WHERE NOT EXISTS (
  -- Evitar duplicados por parent_id + fecha
  SELECT 1 FROM public.events_date ed 
  WHERE ed.parent_id = ep.id AND ed.fecha = ted.fecha
)
RETURNING id, nombre, fecha, parent_id;

-- ============================================
-- PASO 6: VERIFICAR RESULTADOS
-- ============================================

SELECT 
  '✅ EVENTOS PARENT IMPORTADOS' as info,
  COUNT(*) as total
FROM public.events_parent
WHERE created_at > NOW() - INTERVAL '1 hour';

SELECT 
  '✅ EVENTOS DATE IMPORTADOS' as info,
  COUNT(*) as total
FROM public.events_date
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Ver eventos importados con detalles
SELECT 
  ep.id as parent_id,
  ep.nombre as evento_nombre,
  COUNT(ed.id) as num_fechas,
  MIN(ed.fecha) as primera_fecha,
  MAX(ed.fecha) as ultima_fecha
FROM public.events_parent ep
LEFT JOIN public.events_date ed ON ed.parent_id = ep.id
WHERE ep.created_at > NOW() - INTERVAL '1 hour'
GROUP BY ep.id, ep.nombre
ORDER BY ep.created_at DESC;

-- ============================================
-- PASO 7: LIMPIAR TABLAS TEMPORALES
-- ============================================

DROP TABLE IF EXISTS temp_events_parent;
DROP TABLE IF EXISTS temp_events_date;

-- ============================================
-- ✅ IMPORTACIÓN COMPLETADA
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ IMPORTACIÓN DE EVENTOS COMPLETADA';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Revisa los resultados arriba para verificar';
  RAISE NOTICE 'que todos los eventos se importaron correctamente.';
  RAISE NOTICE '';
  RAISE NOTICE 'Si hay errores, revisa:';
  RAISE NOTICE '1. Que los emails de organizadores existan';
  RAISE NOTICE '2. Que los IDs de ritmos y zonas sean correctos';
  RAISE NOTICE '3. Que las fechas estén en formato YYYY-MM-DD';
  RAISE NOTICE '========================================';
END $$;

