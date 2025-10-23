-- ============================================
-- SCRIPT 18: Sistema de Respuestas para Organizadores
-- ============================================
-- Este script agrega el campo 'respuestas' a profiles_organizer
-- para almacenar respuestas a preguntas personalizadas.
-- ============================================

-- 1) Agregar columna 'respuestas' si no existe
ALTER TABLE public.profiles_organizer 
ADD COLUMN IF NOT EXISTS respuestas JSONB DEFAULT '{}'::jsonb;

-- 2) Crear índice para búsquedas en respuestas
CREATE INDEX IF NOT EXISTS idx_organizer_respuestas 
ON public.profiles_organizer USING gin (respuestas);

-- 3) Agregar comentario a la columna
COMMENT ON COLUMN public.profiles_organizer.respuestas IS 
'Respuestas a preguntas personalizadas del organizador (musica_tocaran, hay_estacionamiento, etc.)';

-- 4) Agregar datos de ejemplo para organizadores existentes (opcional)
-- Descomenta si quieres agregar datos de prueba

/*
UPDATE public.profiles_organizer
SET respuestas = '{
  "musica_tocaran": "Salsa clásica, bachata moderna y un poco de merengue.",
  "hay_estacionamiento": "Sí, contamos con estacionamiento gratuito para 30 vehículos. También hay estacionamiento público a media cuadra."
}'::jsonb
WHERE respuestas = '{}'::jsonb OR respuestas IS NULL
LIMIT 5; -- Solo actualiza los primeros 5 para prueba
*/

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver organizadores con respuestas
SELECT 
    id,
    nombre_publico,
    respuestas->>'musica_tocaran' as musica_tocaran,
    respuestas->>'hay_estacionamiento' as hay_estacionamiento
FROM public.profiles_organizer
WHERE respuestas IS NOT NULL AND respuestas != '{}'::jsonb
ORDER BY nombre_publico;

-- Estadísticas
DO $$
DECLARE
    total_org INT;
    org_con_respuestas INT;
BEGIN
    SELECT COUNT(*) INTO total_org FROM public.profiles_organizer;
    SELECT COUNT(*) INTO org_con_respuestas 
    FROM public.profiles_organizer 
    WHERE respuestas IS NOT NULL AND respuestas != '{}'::jsonb;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'ESTADÍSTICAS DE ORGANIZADORES:';
    RAISE NOTICE 'Total de organizadores: %', total_org;
    RAISE NOTICE 'Organizadores con respuestas: %', org_con_respuestas;
    RAISE NOTICE '==========================================';
END $$;
