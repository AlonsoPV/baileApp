-- ============================================
-- SCRIPT 19: Ritmos y Zonas para Organizadores
-- ============================================
-- Este script agrega los campos 'ritmos' y 'zonas' a profiles_organizer
-- para permitir que los organizadores especifiquen los estilos de música
-- que tocan y las zonas donde operan.
-- ============================================

-- 1) Agregar columnas 'ritmos' y 'zonas' si no existen
ALTER TABLE public.profiles_organizer 
ADD COLUMN IF NOT EXISTS ritmos INTEGER[] DEFAULT '{}';

ALTER TABLE public.profiles_organizer 
ADD COLUMN IF NOT EXISTS zonas INTEGER[] DEFAULT '{}';

-- 2) Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_organizer_ritmos 
ON public.profiles_organizer USING gin (ritmos);

CREATE INDEX IF NOT EXISTS idx_organizer_zonas 
ON public.profiles_organizer USING gin (zonas);

-- 3) Agregar comentarios a las columnas
COMMENT ON COLUMN public.profiles_organizer.ritmos IS 
'Array de IDs de tags de tipo "ritmo" que representa los estilos de música que toca el organizador';

COMMENT ON COLUMN public.profiles_organizer.zonas IS 
'Array de IDs de tags de tipo "zona" que representa las zonas geográficas donde opera el organizador';

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver organizadores con ritmos y zonas
SELECT 
    id,
    nombre_publico,
    ritmos,
    zonas,
    ARRAY_LENGTH(ritmos, 1) as num_ritmos,
    ARRAY_LENGTH(zonas, 1) as num_zonas
FROM public.profiles_organizer
WHERE ARRAY_LENGTH(ritmos, 1) > 0 OR ARRAY_LENGTH(zonas, 1) > 0
ORDER BY nombre_publico;

-- Estadísticas
DO $$
DECLARE
    total_org INT;
    org_con_ritmos INT;
    org_con_zonas INT;
BEGIN
    SELECT COUNT(*) INTO total_org FROM public.profiles_organizer;
    
    SELECT COUNT(*) INTO org_con_ritmos 
    FROM public.profiles_organizer 
    WHERE ARRAY_LENGTH(ritmos, 1) > 0;
    
    SELECT COUNT(*) INTO org_con_zonas 
    FROM public.profiles_organizer 
    WHERE ARRAY_LENGTH(zonas, 1) > 0;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'ESTADÍSTICAS DE ORGANIZADORES:';
    RAISE NOTICE 'Total de organizadores: %', total_org;
    RAISE NOTICE 'Organizadores con ritmos: %', org_con_ritmos;
    RAISE NOTICE 'Organizadores con zonas: %', org_con_zonas;
    RAISE NOTICE '==========================================';
END $$;

-- ============================================
-- EJEMPLO DE USO
-- ============================================
-- Para agregar ritmos y zonas a un organizador:
/*
UPDATE public.profiles_organizer
SET 
    ritmos = ARRAY[1, 2, 3],  -- IDs de tags de tipo 'ritmo'
    zonas = ARRAY[10, 11]      -- IDs de tags de tipo 'zona'
WHERE id = <tu_organizador_id>;
*/
