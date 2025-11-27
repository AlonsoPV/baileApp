-- ========================================
-- 📋 INSERTAR CUMBIA SONIDERA COMO RITMO
-- ========================================

-- Insertar Cumbia Sonidera como ritmo en la tabla tags
INSERT INTO public.tags (id, nombre, tipo, slug) 
VALUES
  (68, 'Cumbia Sonidera', 'ritmo', 'cumbia_sonidera')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  tipo = EXCLUDED.tipo,
  slug = EXCLUDED.slug;

-- Verificar que se insertó correctamente
SELECT 
  id,
  nombre,
  tipo,
  slug
FROM public.tags
WHERE id = 68;

-- Ver resumen de ritmos
SELECT 
  'RESUMEN' as info,
  COUNT(*) FILTER (WHERE tipo = 'ritmo') as total_ritmos,
  COUNT(*) FILTER (WHERE tipo = 'zona') as total_zonas,
  COUNT(*) as total
FROM public.tags;

