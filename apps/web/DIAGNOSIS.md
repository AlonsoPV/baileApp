# DIAGNOSIS.md — ETAPA 2

Diagnóstico de causas raíz para queries lentas. Basado en PERF_BASELINE_FRONTEND.md y PERF_EXPLAIN_RESULTS.md.

---

## HALLAZGO 1

**Query:** useExploreQuery / fetchPage_total  
**Impacto:** p95 533 ms  
**Evidencia:** Tiempo total del flujo Explore (main query + search extra + RPC recurrentes + post-proceso). Suma de múltiples steps.

**Causa raíz probable:** Acumulación de latencias: main_events_query (~215ms) + ensure_weekly_occurrences_rpc (~222ms cuando hay recurrentes) + search_parent_matches_events_date (~141ms con búsqueda) + refetch_recurring_occurrences (~111ms).

**Riesgo:** Alto — afecta la pantalla principal de la app.

**Acción propuesta:** Optimizar los steps individuales (ver hallazgos 2–7). Reducir queries extra cuando no hay búsqueda; batch ensure_weekly_occurrences si es posible.

---

## HALLAZGO 2

**Query:** useExploreQuery / ensure_weekly_occurrences_rpc  
**Impacto:** p95 222 ms  
**Evidencia:** RPC llamada en serie por cada parent recurrente. La query interna por parent_id está ok (Index Scan).

**Causa raíz:** El costo no está en leer (tu query interna por parent_id está ok), está en: N llamadas en serie, inserts/checks repetidos, cálculos `max(fecha)` repetidos.

**Acción propuesta:** Batch RPC (array de parent_ids) + "upsert set-based" dentro de Postgres.

**Riesgo:** Medio — solo cuando hay eventos recurrentes.

---

## HALLAZGO 3

**Query:** useExploreQuery / main_events_query  
**Impacto:** p95 215 ms | payload ~44 KB  
**Evidencia:** EXPLAIN muestra Seq Scan en events_date; Sort por fecha; filtro complejo (OR dia_semana/fecha).

**Causa raíz:** Falta un índice que soporte: filtro fijo `estado_publicacion='publicado'`, rango por fecha, orden por fecha (top-N). Tu WHERE tiene OR con `dia_semana IS NOT NULL`, lo cual complica el uso de índices si no lo separas.

**Acción propuesta:** Índices parciales + (ideal) separar query recurrentes vs no recurrentes.

**Riesgo:** Alto — query más frecuente.

---

## HALLAZGO 4

**Query:** useMyRSVPs / total  
**Impacto:** p95 194 ms  
**Evidencia:** Suma de 3 queries: event_rsvp_by_user + events_date_by_ids + events_parent_by_ids. Payload total ~10KB.

**Causa raíz probable:** Tres round-trips secuenciales. event_rsvp y events_date tienen índices; latencia por red + RLS.

**Riesgo:** Medio — pantalla secundaria.

**Acción propuesta:** Vista materializada o RPC que devuelva todo en una query; o reducir columnas en events_date (select explícito).

---

## HALLAZGO 5

**Query:** useExploreQuery / search_parent_matches_events_date  
**Impacto:** p95 141 ms  
**Evidencia:** Query adicional cuando hay matches por events_parent o v_organizers_public. Select con join events_parent, filtros fecha/zonas/ritmos. Payload ~28KB.

**Causa raíz:** Estás haciendo otra query "similar a main" pero con IN(parent_ids) + join. Es casi duplicado.

**Acción propuesta:** Limitar tamaño de parent_ids, y soportarlo con índice compuesto.

**Riesgo:** Medio — solo con búsqueda por texto.

---

## HALLAZGO 6

**Query:** useExploreQuery / refetch_recurring_occurrences  
**Impacto:** p95 111 ms | payload ~54 KB  
**Evidencia:** Re-fetch de events_date por parent_ids + rango fecha. Join events_parent.

**Causa raíz:** Payload grande + join + sort. DB ejecuta rápido, pero la ida/vuelta pesa.

**Acción propuesta:** Select mínimo + índice (parent_id, fecha) parcial + evitar re-fetch con "materialización anticipada" o cache.

**Riesgo:** Medio — solo con recurrentes.

---

## HALLAZGO 7

**Query:** useExploreQuery / search_events_parent  
**Impacto:** p95 92 ms  
**Evidencia:** EXPLAIN: Seq Scan en events_parent; Filter nombre ILIKE '%bachata%'.

**Causa raíz:** ILIKE '%term%' sin índice → seq scan.

**Acción propuesta:** pg_trgm + GIN trigram (más fácil que FTS y se ajusta a "contains").

**Riesgo:** Medio — solo con búsqueda.

---

## HALLAZGO 8

**Query:** useEventDateSuspense / events_date_by_id  
**Impacto:** p95 91 ms  
**Evidencia:** SELECT * por id. PK lookup debería ser O(1). Latencia por payload (~3KB) o RLS.

**Causa raíz probable:** SELECT * trae columnas innecesarias (media, costos JSONB). RLS puede añadir subqueries.

**Riesgo:** Bajo — lookup por PK.

**Acción propuesta:** Select explícito de columnas necesarias; revisar RLS en events_date.

---

## HALLAZGO 9

**Query:** useMyRSVPs / events_date_by_ids  
**Impacto:** p95 77 ms  
**Evidencia:** IN (id1, id2, id3). Bitmap Index Scan en PK. Payload ~10KB.

**Causa raíz probable:** Payload grande; SELECT * con media/costos. RLS.

**Riesgo:** Bajo.

**Acción propuesta:** Select explícito; excluir media si no se usa en lista.

---

## HALLAZGO 10

**Query:** useExploreQuery / search_v_organizers_public  
**Impacto:** p95 66 ms  
**Evidencia:** EXPLAIN: Seq Scan en profiles_organizer; Filter nombre_publico ILIKE '%bachata%'.

**Causa raíz:** ILIKE '%term%' sin índice → seq scan.

**Acción propuesta:** pg_trgm + GIN trigram (más fácil que FTS y se ajusta a "contains").

**Riesgo:** Medio.

---

## HALLAZGO 11 (adicional)

**Query:** useExploreQuery / search_events_parent_by_org  
**Impacto:** p95 48 ms  
**Evidencia:** SELECT id FROM events_parent WHERE organizer_id = ANY(...). Debería usar idx_events_parent_organizer_id.

**Causa raíz probable:** Query ligera; latencia por round-trip. Índice existe.

**Riesgo:** Bajo.

**Acción propuesta:** Mantener; considerar combinar con search_events_parent si el flujo lo permite.

---

## RESUMEN DE CAUSAS RAÍZ

| Categoría | Queries afectadas | Acción |
|-----------|-------------------|--------|
| Índices faltantes | main_events_query | (estado_publicacion, fecha) |
| ILIKE sin trigram | search_events_parent, search_v_organizers_public | pg_trgm + GIN |
| RPC en serie | ensure_weekly_occurrences_rpc | Batch o async |
| SELECT * / payload | events_date_by_id, events_date_by_ids, refetch_recurring | Select explícito |
| Queries extra | search_parent_matches, filter_organizers_final | Unificar o limitar |
| Round-trips | MyRSVPs total | Vista o RPC única |
