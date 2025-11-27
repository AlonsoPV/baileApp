-- ========================================
-- 📋 INSERTAR YOGA Y PILATES COMO RITMOS
-- ========================================

-- Insertar Yoga y Pilates como ritmos en la tabla tags
INSERT INTO public.tags (id, nombre, tipo, slug) 
VALUES
  (66, 'Yoga', 'ritmo', 'yoga'),
  (67, 'Pilates', 'ritmo', 'pilates')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  tipo = EXCLUDED.tipo,
  slug = EXCLUDED.slug;

-- Verificar que se insertaron correctamente
SELECT 
  id,
  nombre,
  tipo,
  slug
FROM public.tags
WHERE id IN (66, 67)
ORDER BY id;

-- Ver resumen de ritmos
SELECT 
  'RESUMEN' as info,
  COUNT(*) FILTER (WHERE tipo = 'ritmo') as total_ritmos,
  COUNT(*) FILTER (WHERE tipo = 'zona') as total_zonas,
  COUNT(*) as total
FROM public.tags;

