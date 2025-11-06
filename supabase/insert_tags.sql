-- ========================================
-- 📋 INSERTAR TAGS (Ritmos y Zonas)
-- ========================================

-- 1. Verificar si la tabla tags existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'tags';

-- 2. Crear tabla tags si no existe
CREATE TABLE IF NOT EXISTS public.tags (
  id integer PRIMARY KEY,
  nombre text NOT NULL,
  tipo text NOT NULL, -- 'ritmo' o 'zona'
  slug text,
  descripcion text,
  created_at timestamptz DEFAULT now()
);

-- 3. Agregar columna slug si no existe
ALTER TABLE public.tags 
ADD COLUMN IF NOT EXISTS slug text;

-- 4. Insertar TODOS los ritmos y zonas
INSERT INTO public.tags (id, nombre, tipo, slug) 
OVERRIDING SYSTEM VALUE
VALUES
  -- RITMOS
  (1, 'Salsa On 1', 'ritmo', 'on1'),
  (2, 'Bachata Moderna', 'ritmo', 'moderna'),
  (3, 'Kizomba', 'ritmo', 'kizomba'),
  (4, 'Merengue', 'ritmo', 'merengue'),
  (5, 'Reggaeton', 'ritmo', 'reggaeton'),
  (11, 'Bachata Tradicional', 'ritmo', 'tradicional'),
  (12, 'Salsa Casino', 'ritmo', 'casino'),
  (13, 'Bachata sensual', 'ritmo', 'sensual'),
  (14, 'Cumbia', 'ritmo', 'cumbia'),
  (15, 'Timba', 'ritmo', 'timba'),
  (16, 'Semba', 'ritmo', 'semba'),
  (17, 'Zouk', 'ritmo', 'zouk'),
  (18, 'Hip hop', 'ritmo', 'hip-hop'),
  (19, 'Break dance', 'ritmo', 'break-dance'),
  (20, 'Twerk', 'ritmo', 'twerk'),
  (21, 'Danzón', 'ritmo', 'danzon'),
  (22, 'Rock and Roll', 'ritmo', 'rock-and-roll'),
  (23, 'Swing', 'ritmo', 'swing'),
  (24, 'Cha-cha-chá', 'ritmo', 'cha-cha-cha'),
  (25, 'Boogie Woogie', 'ritmo', 'boogie-woogie'),
  (26, 'Salsa On 2', 'ritmo', 'on2'),
  -- ZONAS
  (6, 'CDMX Norte', 'zona', 'cdmx-norte'),
  (7, 'CDMX Sur', 'zona', 'cdmx-sur'),
  (8, 'CDMX Centro', 'zona', 'cdmx-centro'),
  (9, 'Guadalajara', 'zona', 'guadalajara'),
  (10, 'Monterrey', 'zona', 'monterrey')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  tipo = EXCLUDED.tipo,
  slug = EXCLUDED.slug;

-- 5. Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_tags_tipo ON public.tags(tipo);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);

-- 6. Verificar que se insertaron correctamente
SELECT 
  'RESUMEN' as info,
  COUNT(*) FILTER (WHERE tipo = 'ritmo') as total_ritmos,
  COUNT(*) FILTER (WHERE tipo = 'zona') as total_zonas,
  COUNT(*) as total
FROM public.tags;

-- 7. Ver todos los ritmos
SELECT id, nombre, tipo, slug
FROM public.tags
WHERE tipo = 'ritmo'
ORDER BY id;

-- 8. Ver todas las zonas
SELECT id, nombre, tipo, slug
FROM public.tags
WHERE tipo = 'zona'
ORDER BY id;

-- Deberías ver:
-- RITMOS: 21
-- ZONAS: 5
-- TOTAL: 26

