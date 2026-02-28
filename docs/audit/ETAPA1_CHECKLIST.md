# ETAPA 1 — CHECKLIST DE CIERRE

## Entregables obligatorios

| Archivo | Estado |
|---------|--------|
| apps/web/PERF_BASELINE_FRONTEND.md | ✅ Actualizado |
| apps/web/SLOW_QUERIES.md | ✅ Top 10 con steps de búsqueda y recurrentes |
| apps/web/PERF_EXPLAIN_RESULTS.md | ✅ Outputs de ejemplo (reemplazar con reales) |
| apps/web/perf_samples.json | ✅ Con samples (≥5 por step crítico) |

## Pasos para datos reales (opcional)

1. Ejecutar migración en Supabase (dev/staging):
   ```sql
   -- Contenido de supabase/migrations/20260228_perf_test_recurring_events.sql
   ```

2. Abrir app en dev, consola del navegador.

3. Ejecutar:
   ```js
   await window.runPerfScenarioSearch()
   await window.runPerfScenarioRecurring()
   await window.perfExport()
   ```

4. Pegar JSON en `apps/web/perf_samples.json`.

5. Regenerar reportes:
   ```bash
   cd apps/web && node scripts/generatePerfReport.mjs
   ```

6. Ejecutar EXPLAIN en Supabase SQL Editor (ver PERF_EXPLAIN_RESULTS.md) y pegar outputs reales.

## ETAPA 2 iniciada

- DIAGNOSIS.md creado
- OPTIMIZATION_PLAN.md creado
- No ejecutar optimizaciones hasta validar en staging
