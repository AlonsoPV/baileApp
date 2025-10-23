-- ============================================
-- VER TAGS DISPONIBLES
-- Para saber qué IDs usar en ritmos y zonas
-- ============================================

-- Ver todos los ritmos disponibles
SELECT 
    id,
    nombre,
    tipo,
    color
FROM public.tags 
WHERE tipo = 'ritmo'
ORDER BY nombre;

-- Ver todas las zonas disponibles  
SELECT 
    id,
    nombre,
    tipo,
    color
FROM public.tags 
WHERE tipo = 'zona'
ORDER BY nombre;

-- Ver todos los tags (ritmos y zonas)
SELECT 
    id,
    nombre,
    tipo,
    color
FROM public.tags 
WHERE tipo IN ('ritmo', 'zona')
ORDER BY tipo, nombre;
