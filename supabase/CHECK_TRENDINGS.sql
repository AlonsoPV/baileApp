-- ================================================
-- SCRIPT: Ver trendings disponibles
-- ================================================
-- Este script muestra todos los trendings disponibles
-- con su información básica para que puedas elegir el ID correcto
-- ================================================

SELECT 
  id,
  title,
  status,
  current_round_number as ronda_actual,
  total_rounds as total_rondas,
  created_at as fecha_creacion,
  starts_at as fecha_inicio,
  ends_at as fecha_fin
FROM public.trendings
ORDER BY id DESC;

-- Ver también los trendings con rondas activas
SELECT 
  t.id as trending_id,
  t.title,
  t.current_round_number,
  r.round_number,
  r.status as estado_ronda,
  r.starts_at,
  r.ends_at
FROM public.trendings t
LEFT JOIN public.trending_rounds r
  ON r.trending_id = t.id
WHERE t.status = 'open'
ORDER BY t.id DESC, r.round_number ASC;

