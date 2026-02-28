# OPTIMIZATION_PLAN.md — ETAPA 2

Plan priorizado por impacto vs riesgo. **No ejecutar cambios hasta validar en staging.**

---

## FASE 1 — Quick wins (índices parciales + select mínimo)

**Objetivo de métricas:** main_events_query p95 &lt; 150 ms; refetch_recurring p95 &lt; 80 ms; payload refetch &lt; 35 KB.  
**Validación:** `runPerfScenarios.ts` (runPerfScenarioSearch + runPerfScenarioRecurring) → `perfExport()` → `generatePerfReport.mjs` → comparar PERF_BASELINE_FRONTEND.md.  
**Rollback:** DROP INDEX; revertir SELECT a columnas originales.

### 1.1 Índices parciales events_date (estado_publicacion, fecha)

**Qué:** Índices que soporten filtro `estado_publicacion='publicado'`, rango por fecha, orden por fecha (top-N). El WHERE con `OR dia_semana IS NOT NULL` complica el uso de índices; ideal a futuro: separar query recurrentes vs no recurrentes.  
**Dónde:** Migración SQL.  
**Mapeo DIAGNOSIS:** Hallazgo 3 (main_events_query).

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date_estado_fecha
ON public.events_date (fecha)
WHERE estado_publicacion = 'publicado';
```

**Impacto estimado:** -30% a -50% en main_events_query (p95 215 → ~100–150 ms).

---

### 1.2 Select explícito en events_date (detalle y lista)

**Qué:** Reemplazar SELECT * por columnas necesarias en useEventDateSuspense, events_date_by_ids, refetch_recurring.  
**Dónde:** useEventDateSuspense.ts, useMyRSVPs.ts, useExploreQuery.ts (select de refetch).  
**Mapeo DIAGNOSIS:** Hallazgos 6 (refetch_recurring), 8 (events_date_by_id), 9 (events_date_by_ids).

**Impacto estimado:** -20% payload; menor parsing y transferencia.

---

### 1.3 refetch_recurring: select mínimo + índice (parent_id, fecha) + materialización anticipada

**Qué:** Select mínimo de columnas necesarias; índice parcial (parent_id, fecha); evitar re-fetch con materialización anticipada (ensure_weekly ya inserta) o cache.  
**Dónde:** Migración SQL + useExploreQuery.ts (select explícito; evaluar omitir re-fetch cuando ensure_weekly acaba de materializar).  
**Mapeo DIAGNOSIS:** Hallazgo 6 (refetch_recurring_occurrences).

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date_parent_fecha
ON public.events_date (parent_id, fecha)
WHERE estado_publicacion = 'publicado' AND parent_id IS NOT NULL;
```

**Impacto estimado:** -30% en refetch_recurring (p95 111 → ~75 ms).

---

## FASE 2 — Search (pg_trgm + GIN)

**Objetivo de métricas:** search_events_parent p95 &lt; 40 ms; search_v_organizers_public p95 &lt; 35 ms.  
**Validación:** Runners de búsqueda; regenerar reporte con `generatePerfReport.mjs`. EXPLAIN search_events_parent y search_v_organizers_public.  
**Rollback:** DROP INDEX idx_events_parent_nombre_trgm, idx_profiles_organizer_nombre_trgm.

### 2.1 pg_trgm + GIN trigram para ILIKE '%term%'

**Qué:** `ILIKE '%term%'` sin índice → seq scan. pg_trgm + GIN trigram es más fácil que FTS y se ajusta a "contains".  
**Dónde:** Migración SQL.  
**Mapeo DIAGNOSIS:** Hallazgos 7 (search_events_parent), 10 (search_v_organizers_public).

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_parent_nombre_trgm
ON public.events_parent USING gin (nombre gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_organizer_nombre_trgm
ON public.profiles_organizer USING gin (nombre_publico gin_trgm_ops);
```

**Impacto estimado:** -60% en search_events_parent (p95 92 → ~35 ms); -50% en search_v_organizers (p95 66 → ~33 ms).

---

## FASE 3 — Recurrentes (batch RPC set-based + constraint + opcional retorno)

**Objetivo de métricas:** ensure_weekly_occurrences_rpc p95 &lt; 120 ms (3 parents); reducir o eliminar refetch cuando batch retorna ocurrencias.  
**Validación:** Runners con eventos recurrentes; regenerar reporte.  
**Rollback:** Volver a llamada RPC por parent; revertir useExploreQuery.

### 3.1 RPC ensure_weekly_occurrences batch + upsert set-based

**Qué:** Nueva RPC `ensure_weekly_occurrences_batch(p_parent_ids bigint[], p_weeks_ahead int)` que procese múltiples parents en una transacción. Upsert set-based (UNNEST + generate_series) con `ON CONFLICT DO NOTHING` sobre constraint única. Opcional: retornar ocurrencias insertadas para evitar re-fetch.  
**Dónde:** Migración SQL + useExploreQuery.ts (una llamada en lugar de N).  
**Mapeo DIAGNOSIS:** Hallazgo 2 (ensure_weekly_occurrences_rpc).

**Impacto estimado:** -40% a -60% en ensure_weekly (p95 222 → ~90–130 ms para 3 parents).

---

## FASE 4 — Limitar parent_ids / unificar búsqueda

**Objetivo de métricas:** search_parent_matches_events_date p95 &lt; 100 ms; evitar picos con listas grandes.  
**Validación:** Búsqueda que devuelva muchos matches; EXPLAIN; regenerar reporte.  
**Rollback:** Revertir límite de parent_ids; DROP INDEX; revertir unificación si se aplicó.

### 4.1 Limitar parent_ids + índice compuesto en search_parent_matches

**Qué:** search_parent_matches es casi duplicado de main (IN(parent_ids) + join). Limitar tamaño de parent_ids (p.ej. top 50–100) y soportar con índice compuesto parcial.  
**Dónde:** useExploreQuery.ts + migración SQL.  
**Mapeo DIAGNOSIS:** Hallazgo 5 (search_parent_matches_events_date).

**Impacto estimado:** Evitar picos; -20% cuando parent_ids es grande.

---

### 4.2 Unificar búsqueda en main query (opcional)

**Qué:** Cuando hay búsqueda, intentar incluir OR sobre events_parent.nombre en la query principal vía join, en lugar de 3–4 queries extra.  
**Dónde:** useExploreQuery.ts.  
**Mapeo DIAGNOSIS:** Complementa Hallazgo 5 (reducir round-trips).

**Impacto estimado:** Eliminar search_events_parent, search_v_organizers_public, search_events_parent_by_org, search_parent_matches como queries separadas.  
**Riesgo:** Alto. PostgREST puede no soportar bien OR sobre join; probar en staging.

---

## FASE 5 — MyRSVPs (RPC/vista única)

**Objetivo de métricas:** useMyRSVPs total p95 &lt; 100 ms; payload &lt; 8 KB.  
**Validación:** Runners de MyRSVPs; regenerar reporte.  
**Rollback:** Volver a 3 queries separadas.

### 5.1 Vista o RPC para MyRSVPs

**Qué:** Vista materializada o RPC get_my_rsvps_with_events(user_id) que devuelva event_rsvp + events_date + events_parent en una query.  
**Dónde:** Migración SQL + useMyRSVPs.ts.  
**Mapeo DIAGNOSIS:** Hallazgo 4 (useMyRSVPs / total).

**Impacto estimado:** -50% en MyRSVPs total (p95 194 → ~95 ms).

---

## MAPEO DIAGNOSIS → OPTIMIZATION_PLAN

| DIAGNOSIS Hallazgo | Acción propuesta | OPTIMIZATION_PLAN |
|--------------------|------------------|------------------|
| 2 ensure_weekly_occurrences_rpc | Batch RPC + upsert set-based | Fase 3.1 |
| 3 main_events_query | Índices parciales + separar recurrentes | Fase 1.1 |
| 4 MyRSVPs total | Vista o RPC única | Fase 5.1 |
| 5 search_parent_matches_events_date | Limitar parent_ids + índice compuesto | Fase 4.1 |
| 6 refetch_recurring_occurrences | Select mínimo + índice + materialización | Fase 1.2, 1.3 |
| 7 search_events_parent | pg_trgm + GIN trigram | Fase 2.1 |
| 8 events_date_by_id | Select explícito | Fase 1.2 |
| 9 events_date_by_ids | Select explícito | Fase 1.2 |
| 10 search_v_organizers_public | pg_trgm + GIN trigram | Fase 2.1 |

---

## CHECKLIST ANTES DE MERGE

- [ ] EXPLAIN (ANALYZE, BUFFERS) antes y después de cada cambio de índices  
- [ ] Medir p50/p95 con perfReport() tras cada cambio  
- [ ] Ejecutar runners y regenerar reporte con generatePerfReport.mjs  
- [ ] Verificar RLS no se rompe  
- [ ] Probar en staging con datos reales  
- [ ] Rollback plan documentado por fase
