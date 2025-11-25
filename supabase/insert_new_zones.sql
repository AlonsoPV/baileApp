-- ========================================
-- 📋 INSERTAR NUEVAS ZONAS
-- ========================================
-- Script para agregar las nuevas zonas organizadas por categorías
-- Ejecutar este script en Supabase SQL Editor

-- Zonas del Norte
INSERT INTO public.tags (id, nombre, tipo, slug) 
OVERRIDING SYSTEM VALUE
VALUES
  (45, 'Baja California', 'zona', 'baja_california'),
  (46, 'Sonora', 'zona', 'sonora'),
  (47, 'Chihuahua', 'zona', 'chihuahua'),
  (48, 'Coahuila', 'zona', 'coahuila'),
  (49, 'Nuevo León', 'zona', 'nuevo_leon'),
  (50, 'Tamaulipas', 'zona', 'tamaulipas'),
  (51, 'Durango', 'zona', 'durango')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  tipo = EXCLUDED.tipo,
  slug = EXCLUDED.slug;

-- Zonas del Bajío (Querétaro ya existe con id: 40)
INSERT INTO public.tags (id, nombre, tipo, slug) 
OVERRIDING SYSTEM VALUE
VALUES
  (52, 'Guanajuato', 'zona', 'guanajuato'),
  (53, 'Aguascalientes', 'zona', 'aguascalientes'),
  (54, 'San Luis Potosí', 'zona', 'san_luis_potosi'),
  (55, 'Zacatecas', 'zona', 'zacatecas')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  tipo = EXCLUDED.tipo,
  slug = EXCLUDED.slug;

-- Zonas del Centro (Puebla ya existe con id: 39)
INSERT INTO public.tags (id, nombre, tipo, slug) 
OVERRIDING SYSTEM VALUE
VALUES
  (56, 'Hidalgo', 'zona', 'hidalgo'),
  (57, 'Tlaxcala', 'zona', 'tlaxcala'),
  (58, 'Morelos', 'zona', 'morelos')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  tipo = EXCLUDED.tipo,
  slug = EXCLUDED.slug;

-- Zonas del Sur / Sureste
-- Oaxaca ya existe (id: 43), Puerto Escondido ya existe (id: 44)
-- Veracruz (ciudad), Xalapa (id: 38), Orizaba (id: 36), Córdova (id: 37) ya existen
-- Cancún (id: 35), Playa del Carmen (id: 34) ya existen
INSERT INTO public.tags (id, nombre, tipo, slug) 
OVERRIDING SYSTEM VALUE
VALUES
  (59, 'Chiapas', 'zona', 'chiapas'),
  (60, 'Guerrero', 'zona', 'guerrero'),
  (61, 'Veracruz', 'zona', 'veracruz'),
  (62, 'Tabasco', 'zona', 'tabasco'),
  (63, 'Campeche', 'zona', 'campeche'),
  (64, 'Yucatán', 'zona', 'yucatan'),
  (65, 'Quintana Roo', 'zona', 'quintana_roo')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  tipo = EXCLUDED.tipo,
  slug = EXCLUDED.slug;

-- Verificar que se insertaron correctamente
SELECT 
  'RESUMEN DE ZONAS' as info,
  COUNT(*) as total_zonas
FROM public.tags
WHERE tipo = 'zona';

-- Ver todas las zonas ordenadas por ID
SELECT id, nombre, tipo, slug
FROM public.tags
WHERE tipo = 'zona'
ORDER BY id;

-- Verificar zonas por categoría
SELECT 
  CASE 
    WHEN slug IN ('baja_california', 'sonora', 'chihuahua', 'coahuila', 'nuevo_leon', 'tamaulipas', 'durango', 'monterrey', 'guadalajara') THEN 'Norte'
    WHEN slug IN ('queretaro', 'guanajuato', 'aguascalientes', 'san_luis_potosi', 'zacatecas') THEN 'Bajío'
    WHEN slug IN ('puebla', 'hidalgo', 'tlaxcala', 'morelos') THEN 'Centro'
    WHEN slug IN ('oaxaca', 'puerto_escondido', 'chiapas', 'guerrero', 'veracruz', 'xalapa', 'orizaba', 'cordova', 'tabasco', 'campeche', 'yucatan', 'quintana_roo', 'cancun', 'playa_del_carmen') THEN 'Sur / Sureste'
    WHEN slug LIKE 'cdmx%' THEN 'CDMX'
    WHEN slug = 'edomex' THEN 'Edo. de México'
    ELSE 'Otros'
  END as categoria,
  COUNT(*) as cantidad
FROM public.tags
WHERE tipo = 'zona'
GROUP BY categoria
ORDER BY categoria;

