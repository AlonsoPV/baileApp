-- ============================================================================
-- Blackout global de clases (abril 2026, días 1–5)
-- ============================================================================
-- Uso: SQL Editor en Supabase (o psql). Idempotente.
--
-- La app web (Explorar → clases) filtra por las mismas fechas vía
-- `apps/web/src/config/classBlackoutDates.ts`. Esta tabla sirve para auditoría,
-- reportes y futuras integraciones (p. ej. leer fechas desde BD sin redeploy).
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.baileapp_class_blackout_dates (
  fecha date PRIMARY KEY,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.baileapp_class_blackout_dates IS
  'Días calendario en que las clases no deben mostrarse en producto (Explorar, etc.).';

INSERT INTO public.baileapp_class_blackout_dates (fecha, motivo)
VALUES
  ('2026-04-01', 'Blackout programado (abril 2026)'),
  ('2026-04-02', 'Blackout programado (abril 2026)'),
  ('2026-04-03', 'Blackout programado (abril 2026)'),
  ('2026-04-04', 'Blackout programado (abril 2026)'),
  ('2026-04-05', 'Blackout programado (abril 2026)')
ON CONFLICT (fecha) DO UPDATE SET
  motivo = EXCLUDED.motivo;

COMMIT;

-- Verificación
SELECT fecha, motivo, created_at
FROM public.baileapp_class_blackout_dates
WHERE fecha BETWEEN '2026-04-01' AND '2026-04-05'
ORDER BY fecha;
