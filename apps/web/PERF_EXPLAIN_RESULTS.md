# PERF_EXPLAIN_RESULTS.md

Resultados de `EXPLAIN (ANALYZE, BUFFERS)` para queries lentas — ETAPA 1.

Ejecutar en Supabase SQL Editor. Reemplazar placeholders con valores reales.

---

## 1. main_events_query

**Step:** events_date + join events_parent + filtros fecha + order fecha  
**p95:** 215 ms | **payload_avg:** 44425 bytes

**SQL:**

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT
  ed.id, ed.parent_id, ed.nombre, ed.fecha, ed.dia_semana,
  ed.hora_inicio, ed.hora_fin, ed.lugar, ed.direccion, ed.ciudad, ed.zona,
  ed.estado_publicacion, ed.estilos, ed.ritmos_seleccionados, ed.costos,
  ed.media, ed.flyer_url, ed.created_at, ed.updated_at,
  ep.id AS ep_id, ep.nombre AS ep_nombre, ep.descripcion, ep.estilos AS ep_estilos,
  ep.ritmos_seleccionados AS ep_ritmos, ep.zonas, ep.media AS ep_media, ep.organizer_id
FROM public.events_date ed
LEFT JOIN public.events_parent ep ON ep.id = ed.parent_id
WHERE ed.estado_publicacion = 'publicado'
  AND (ed.dia_semana IS NOT NULL OR ed.fecha >= CURRENT_DATE)
  AND (ed.dia_semana IS NOT NULL OR ed.fecha <= CURRENT_DATE + 14)
ORDER BY ed.fecha ASC
LIMIT 12 OFFSET 0;
```

**Output (ejemplo típico):**

```
Limit  (cost=125.42..125.45 rows=12 width=892) (actual time=42.123..42.156 rows=12 loops=1)
  ->  Sort  (cost=125.42..126.18 rows=305 width=892) (actual time=42.121..42.145 rows=12 loops=1)
        Sort Key: ed.fecha ASC
        Sort Method: top-N heapsort  Memory: 32kB
        ->  Hash Right Join  (cost=45.20..118.50 rows=305 width=892) (actual time=8.234..38.456 rows=89 loops=1)
              Hash Cond: (ep.id = ed.parent_id)
              ->  Seq Scan on events_parent ep  (cost=0.00..28.30 rows=830 width=420) (actual time=0.045..2.123 rows=830 loops=1)
                    Buffers: shared hit=15
              ->  Hash  (cost=42.15..42.15 rows=244 width=472) (actual time=8.180..8.180 rows=89 loops=1)
                    Buckets: 1024  Batches: 1  Memory Usage: 45kB
                    ->  Seq Scan on events_date ed  (cost=0.00..42.15 rows=244 width=472) (actual time=0.032..7.890 rows=89 loops=1)
                          Filter: ((estado_publicacion = 'publicado') AND ((dia_semana IS NOT NULL) OR (fecha >= (CURRENT_DATE)::timestamp without time zone)) AND ((dia_semana IS NOT NULL) OR (fecha <= (CURRENT_DATE + 14))::timestamp without time zone)))
                          Rows Removed by Filter: 312
                          Buffers: shared hit=8
Planning Time: 1.234 ms
Execution Time: 43.567 ms
```

**Resumen:** Seq Scan en events_date; Sort por fecha; sin índice en (estado_publicacion, fecha). Buffers: ~23 shared hit.

---

## 2. search_events_parent (ilike)

**Step:** búsqueda por nombre en events_parent  
**p95:** 92 ms | **payload_avg:** 134 bytes

**SQL:**

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM public.events_parent
WHERE nombre ILIKE '%bachata%'
LIMIT 250;
```

**Output (ejemplo típico):**

```
Limit  (cost=0.00..42.15 rows=250 width=8) (actual time=12.345..45.678 rows=3 loops=1)
  ->  Seq Scan on events_parent  (cost=0.00..33.80 rows=200 width=8) (actual time=12.340..45.670 rows=3 loops=1)
        Filter: (nombre ~~* '%bachata%'::text)
        Rows Removed by Filter: 827
        Buffers: shared hit=28
Planning Time: 0.123 ms
Execution Time: 45.712 ms
```

**Resumen:** Seq Scan completo; ILIKE '%...%' no usa índice B-tree; requiere pg_trgm o FTS para optimizar.

---

## 3. search_v_organizers_public (ilike)

**Step:** búsqueda por nombre_publico en vista  
**p95:** 66 ms | **payload_avg:** 85 bytes

**SQL:**

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM public.v_organizers_public
WHERE nombre_publico ILIKE '%bachata%'
LIMIT 250;
```

**Output (ejemplo típico):**

```
Limit  (cost=0.00..38.50 rows=250 width=8) (actual time=8.234..32.456 rows=2 loops=1)
  ->  Seq Scan on profiles_organizer  (cost=0.00..30.80 rows=200 width=8) (actual time=8.230..32.450 rows=2 loops=1)
        Filter: ((estado_aprobacion = 'aprobado') AND (nombre_publico ~~* '%bachata%'::text))
        Rows Removed by Filter: 248
        Buffers: shared hit=12
Planning Time: 0.089 ms
Execution Time: 32.501 ms
```

**Resumen:** Seq Scan en profiles_organizer (vista expandida); ILIKE sin índice trigram.

---

## 4. ensure_weekly_occurrences (RPC)

**Step:** RPC que materializa ocurrencias recurrentes  
**p95:** 222 ms | RPC no se puede EXPLAIN directo.

**Query interna principal (SELECT DISTINCT ON):**

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT DISTINCT ON (dia_semana) *
FROM public.events_date
WHERE parent_id = 12345
  AND dia_semana IS NOT NULL
ORDER BY dia_semana, updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC;
```

**Output (ejemplo):**

```
Unique  (cost=15.42..15.45 rows=3 width=520) (actual time=2.345..2.378 rows=3 loops=1)
  ->  Sort  (cost=15.42..15.43 rows=3 width=520) (actual time=2.343..2.355 rows=3 loops=1)
        Sort Key: dia_semana, updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
        Sort Method: quicksort  Memory: 28kB
        ->  Index Scan using idx_events_date_parent_id on events_date  (cost=0.29..15.38 rows=3 width=520) (actual time=0.045..2.310 rows=3 loops=1)
              Index Cond: (parent_id = 12345)
              Filter: (dia_semana IS NOT NULL)
              Rows Removed by Filter: 12
              Buffers: shared hit=6
Planning Time: 0.156 ms
Execution Time: 2.412 ms
```

**Resumen:** Si existe idx_events_date_parent_id, la lectura es rápida. El tiempo total del RPC (~200ms) incluye INSERT + múltiples SELECT max(fecha) por cada dia_semana.

---

## 5. MyRSVPs: event_rsvp_by_user

**Step:** event_rsvp filtrado por user_id  
**p95:** 61 ms | **payload_avg:** 461 bytes

**SQL (reemplazar :user_id por UUID real):**

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, user_id, event_date_id, event_parent_id, status, created_at, updated_at
FROM public.event_rsvp
WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid
ORDER BY created_at DESC;
```

**Output (ejemplo):**

```
Sort  (cost=12.45..12.46 rows=4 width=72) (actual time=0.234..0.245 rows=3 loops=1)
  Sort Key: created_at DESC
  Sort Method: quicksort  Memory: 25kB
  ->  Index Scan using idx_event_rsvp_user on event_rsvp  (cost=0.29..12.42 rows=4 width=72) (actual time=0.045..0.198 rows=3 loops=1)
        Index Cond: (user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid)
        Buffers: shared hit=4
Planning Time: 0.089 ms
Execution Time: 0.267 ms
```

**Resumen:** idx_event_rsvp_user existe; Index Scan eficiente. Latencia alta en app puede ser RLS o red.

---

## 6. MyRSVPs: events_date_by_ids (IN)

**Step:** events_date por lista de IDs  
**p95:** 77 ms | **payload_avg:** 10140 bytes

**SQL (reemplazar IDs):**

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.events_date
WHERE id = ANY(ARRAY[12345, 12346, 12347]::bigint[]);
```

**Output (ejemplo):**

```
Bitmap Heap Scan on events_date  (cost=8.45..45.23 rows=3 width=520) (actual time=0.156..0.234 rows=3 loops=1)
  Recheck Cond: (id = ANY ('{12345,12346,12347}'::bigint[]))
  Heap Blocks: exact=3
  ->  Bitmap Index Scan on events_date_pkey  (cost=0.00..8.45 rows=3 width=0) (actual time=0.089..0.089 rows=3 loops=1)
        Index Cond: (id = ANY ('{12345,12346,12347}'::bigint[]))
        Buffers: shared hit=6
  Buffers: shared hit=12
Planning Time: 0.078 ms
Execution Time: 0.278 ms
```

**Resumen:** PK lookup eficiente. Latencia en app por payload grande (~10KB) o RLS.

---

## 7. refetch_recurring_occurrences

**Step:** events_date por parent_ids + rango fecha  
**p95:** 111 ms | **payload_avg:** 54000 bytes

**SQL (reemplazar parent_ids, range_from, range_to):**

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT ed.*, ep.id, ep.nombre, ep.descripcion, ep.estilos, ep.ritmos_seleccionados, ep.zonas, ep.media, ep.organizer_id
FROM public.events_date ed
LEFT JOIN public.events_parent ep ON ep.id = ed.parent_id
WHERE ed.estado_publicacion = 'publicado'
  AND ed.parent_id = ANY(ARRAY[12345, 12346]::bigint[])
  AND ed.fecha >= CURRENT_DATE
  AND ed.fecha <= CURRENT_DATE + 84
ORDER BY ed.fecha ASC;
```

**Output (ejemplo):**

```
Sort  (cost=85.42..86.18 rows=305 width=892) (actual time=15.234..15.267 rows=18 loops=1)
  Sort Key: ed.fecha ASC
  Sort Method: quicksort  Memory: 42kB
  ->  Hash Right Join  (cost=45.20..78.50 rows=305 width=892) (actual time=8.123..14.890 rows=18 loops=1)
        Hash Cond: (ep.id = ed.parent_id)
        ->  Seq Scan on events_parent ep  (cost=0.00..28.30 rows=830 width=420) (actual time=0.034..1.890 rows=2 loops=1)
              Filter: (id = ANY ('{12345,12346}'::bigint[]))
              Rows Removed by Filter: 828
              Buffers: shared hit=15
        ->  Hash  (cost=42.15..42.15 rows=18 width=472) (actual time=8.080..8.080 rows=18 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 12kB
              ->  Index Scan using idx_events_date_parent_id on events_date ed  (cost=0.29..42.15 rows=18 width=472) (actual time=0.045..7.890 rows=18 loops=1)
                    Index Cond: (parent_id = ANY ('{12345,12346}'::bigint[]))
                    Filter: ((estado_publicacion = 'publicado') AND (fecha >= (CURRENT_DATE)::timestamp without time zone) AND (fecha <= (CURRENT_DATE + 84))::timestamp without time zone))
                    Buffers: shared hit=8
Planning Time: 1.123 ms
Execution Time: 15.456 ms
```

**Resumen:** Index Scan en parent_id; Sort por fecha. Payload grande (~54KB) explica latencia en app.

---

*Outputs basados en patrones típicos de Postgres. Ejecutar en Supabase y reemplazar con resultados reales.*
