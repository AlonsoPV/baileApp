# Auditoría Supabase + Vercel

Fecha: 2026-04-18

## Alcance

Esta auditoría combina:

- revisión local de configuración del repo
- mediciones HTTP reales sobre `https://dondebailar.com.mx`
- revisión rápida de patrones de acceso a Supabase en frontend

No incluye ejecución directa de queries SQL sobre la base de datos, porque desde este entorno no hay acceso a `pg_stat_statements`, `pg_stat_activity`, `pg_policies` ni a tablas internas de `storage`. Esa parte queda preparada para ejecutar manualmente en Supabase SQL Editor.

## Supabase

### Estado

- La parte SQL no se pudo ejecutar desde este entorno, pero ya se añadieron resultados manuales al documento desde Supabase SQL Editor.
- Con lo ejecutado hasta ahora ya hay dos conclusiones iniciales:
  - el top actual de `pg_stat_statements` está dominado por queries de introspección del schema (`pg_get_tabledef`, `pg_get_viewdef`, `pg_namespace`, `pg_class`), no por tráfico real de producto
  - todavía falta aislar las queries lentas de negocio (`events_date`, `event_rsvp`, `user_favorites`, vistas públicas)
- Queda pendiente correr en Supabase SQL Editor:
  - `pg_stat_statements` filtrado para excluir introspección
  - `pg_stat_user_indexes` con columnas corregidas
  - `pg_stat_user_tables`
  - `pg_policies`
  - `pg_stat_activity`
  - consultas sobre `storage.objects`

### Hallazgos de código

#### 1. `preconnect` de Supabase sin `crossorigin`

Archivo:

- `apps/web/index.html`

Hallazgo:

```3:9:apps/web/index.html
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/icon.png" />
    <link rel="apple-touch-icon" href="https://xjagwppplovcqmztcymd.supabase.co/storage/v1/object/public/media/icon.png" />
    <link rel="preconnect" href="https://xjagwppplovcqmztcymd.supabase.co" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

Impacto:

- menor eficiencia del `preconnect` hacia Supabase comparado con el de Google Fonts

Acción recomendada:

- agregar `crossorigin` al `preconnect` de Supabase

#### 2. No hay evidencia en código de uso explícito del pooler

Archivos revisados:

- `apps/web/api/_supabaseAdmin.ts`
- `apps/web/src/contexts/AuthProvider.tsx`

Hallazgo:

- la app usa `SUPABASE_URL` / `VITE_SUPABASE_URL`, pero desde código no hay garantía de que esa URL sea la del pooler
- esto depende del valor real en entorno

Riesgo:

- si producción usa la URL directa en vez del pooler, el costo en conexiones puede crecer innecesariamente

Acción recomendada:

- verificar en variables de entorno que la URL usada para server/database access sea la del pooler cuando aplique
- confirmar en Dashboard que Connection Pooling esté en `Transaction`

#### 3. Candidatos a optimización por queries secuenciales

No encontré un patrón claro de N+1 del tipo `items.map(async () => supabase...)` en la búsqueda rápida, pero sí hay secuencias que pueden consolidarse.

Archivo:

- `apps/web/src/hooks/useLiveClasses.ts`

```291:374:apps/web/src/hooks/useLiveClasses.ts
      if (opts?.academyId) {
        const { data: academyData, error: academyError } = await supabase
          .from("v_academies_public")
          .select("id, cronograma, ubicaciones")
          .eq("id", opts.academyId)
          .maybeSingle();

        if (academyError || !academyData) {
          const { data: directData, error: directError } = await supabase
            .from("profiles_academy")
            .select("id, cronograma, ubicaciones")
            .eq("id", opts.academyId)
            .maybeSingle();
        }
      }

      // ...

      if (opts?.academyId) {
        const { data: academyDataWithCostos } = await supabase
          .from("v_academies_public")
          .select("costos")
          .eq("id", opts.academyId)
          .maybeSingle();
```

Observación:

- hay doble lectura de la misma entidad para `cronograma/ubicaciones` y luego `costos`
- eso no es N+1, pero sí más round-trips de los necesarios

Acción recomendada:

- consolidar en una sola lectura por entidad cuando sea posible

Archivo:

- `apps/web/src/hooks/useEventFull.ts`

```71:120:apps/web/src/hooks/useEventFull.ts
      const { data: date, error: e1 } = await supabase
        .from("events_date").select("*").eq("id", eventDateId!).maybeSingle();

      let parent: EventParent | null = null;
      if (date.parent_id != null) {
        const { data: parentRow, error: e2 } = await supabase
          .from("events_parent").select("*").eq("id", date.parent_id).maybeSingle();
      }

      // ...

      const [{ data: legacySchedules, error: e3 }, { data: legacyPrices, error: e4 }] = await Promise.all([
        supabase.from("event_schedules").select("*").eq("event_date_id", eventDateId!).order("hora_inicio"),
        supabase.from("event_prices").select("*").eq("event_date_id", eventDateId!),
```

Observación:

- la carga completa de una fecha todavía depende de varias consultas seriales o fallback
- conviene revisar si una vista/RPC podría resolver esto en una sola llamada

#### 4. Query pública con `select("*")`

Archivo:

- `apps/web/src/hooks/useHeroEvents.ts`

```16:23:apps/web/src/hooks/useHeroEvents.ts
        const { data, error } = await supabase
          .from("v_events_dates_public")
          .select("*")
          .not("flyer_url", "is", null)
          .order("fecha", { ascending: true })
          .limit(12);
```

Riesgo:

- si la vista crece en columnas o joins, el costo de transferencia y CPU también crece

Acción recomendada:

- reemplazar `select("*")` por columnas mínimas necesarias para el hero

### Queries más lentas (top 5)

Resultado actual:

- los registros añadidos están dominados por queries tipo:
  - `pg_temp.pg_get_tabledef(...)`
  - `pg_get_viewdef(...)`
  - lecturas sobre `pg_namespace` / `pg_class`
- eso indica introspección del schema por dashboard/herramienta SQL, no latencia real de Explore, RSVP o favoritos

Conclusión:

- todavía no hay evidencia útil de queries lentas de negocio
- el siguiente paso correcto es volver a correr `pg_stat_statements` filtrando introspección

SQL recomendado:

```sql
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  stddev_exec_time,
  rows
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
  AND query NOT ILIKE '%pg_get_tabledef%'
  AND query NOT ILIKE '%pg_get_viewdef%'
  AND query NOT ILIKE '%pg_namespace%'
  AND query NOT ILIKE '%pg_class%'
  AND query NOT ILIKE '%information_schema%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```
[
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4739.208999,
    "mean_exec_time": 4739.208999,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4727.620998,
    "mean_exec_time": 4727.620998,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4336.585089,
    "mean_exec_time": 4336.585089,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4327.936224,
    "mean_exec_time": 4327.936224,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4289.578289,
    "mean_exec_time": 4289.578289,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4255.973893,
    "mean_exec_time": 4255.973893,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4241.231337,
    "mean_exec_time": 4241.231337,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4218.954465,
    "mean_exec_time": 4218.954465,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4211.852958,
    "mean_exec_time": 4211.852958,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4207.359899,
    "mean_exec_time": 4207.359899,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4200.071187,
    "mean_exec_time": 4200.071187,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4196.217507,
    "mean_exec_time": 4196.217507,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4195.005811,
    "mean_exec_time": 4195.005811,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4185.50543,
    "mean_exec_time": 4185.50543,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4180.842336,
    "mean_exec_time": 4180.842336,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4175.262432,
    "mean_exec_time": 4175.262432,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4170.414244,
    "mean_exec_time": 4170.414244,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4169.489453,
    "mean_exec_time": 4169.489453,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4166.395751,
    "mean_exec_time": 4166.395751,
    "stddev_exec_time": 0,
    "rows": 1
  },
  {
    "query": "with records as (\n  select\n    c.oid::int8 as \"id\",\n    case c.relkind\n      when $1 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $2,\n        $3,\n        $4\n      )\n      when $5 then concat(\n        $6, concat(nc.nspname, $7, c.relname), $8,\n        pg_get_viewdef(concat(nc.nspname, $9, c.relname), $10)\n      )\n      when $11 then concat(\n        $12, concat(nc.nspname, $13, c.relname), $14,\n        pg_get_viewdef(concat(nc.nspname, $15, c.relname), $16)\n      )\n      when $17 then concat($18, nc.nspname, $19, c.relname, $20)\n      when $21 then pg_temp.pg_get_tabledef(\n        concat(nc.nspname),\n        concat(c.relname),\n        $22,\n        $23,\n        $24\n      )\n    end as \"sql\"\n  from\n    pg_namespace nc\n    join pg_class c on nc.oid = c.relnamespace\n  where\n    c.relkind in ($25, $26, $27, $28, $29)\n    and not pg_is_other_temp_schema(nc.oid)\n    and (\n      pg_has_role(c.relowner, $30)\n      or has_table_privilege(\n        c.oid,\n        $31\n      )\n      or has_any_column_privilege(c.oid, $32)\n    )\n    and nc.nspname IN ($33)\n  order by c.relname asc\n  limit $34\n  offset $35\n)\nselect\n  jsonb_build_object(\n    $36, coalesce(jsonb_agg(\n      jsonb_build_object(\n        $37, r.id,\n        $38, r.sql\n      )\n    ), $39::jsonb)\n  ) \"data\"\nfrom records r",
    "calls": 1,
    "total_exec_time": 4165.529373,
    "mean_exec_time": 4165.529373,
    "stddev_exec_time": 0,
    "rows": 1
  }
]
### Índices faltantes identificados

Estado según repo y migraciones:

- Ya aparecen definidos en SQL/migrations:
  - `idx_events_date_parent_id`
  - `idx_events_date_zona`
  - `idx_events_parent_organizer_id`
  - `idx_event_rsvp_event_date`
  - `idx_event_rsvp_user`
  - `idx_user_favorites_user_id`
  - `idx_user_favorites_event_date_id`
  - `idx_user_favorites_class_source`
  - únicos de `user_favorites` para evento y clase
- Aparece además un SQL suelto para `idx_events_date_organizer_id`, pero no quedó claro desde migraciones si ya está aplicado en producción.

Siguen siendo candidatos reales a verificar en DB:

- [ ] `events_date(organizer_id)`
- [ ] `events_date(estado_publicacion, fecha) WHERE estado_publicacion = 'publicado'`
- [ ] `events_date(zona, fecha) WHERE estado_publicacion = 'publicado'`
- [ ] `event_rsvp(user_id, status)` o revisar si basta `idx_event_rsvp_user` según planes reales
- [ ] `user_favorites(user_id, entity_type)` solo si los planes muestran filtro frecuente por `entity_type`

Consultas frecuentes del frontend que justifican revisar índices:

- Explore usa repetidamente filtros sobre `events_date` por:
  - `estado_publicacion = 'publicado'`
  - `fecha`
  - `parent_id`
  - `zona` / `zonas`
  - `dia_semana`
- RSVP usa:
  - `event_rsvp.user_id`
  - `event_rsvp.event_date_id`
  - luego fetch a `events_date.id in (...)`
- Favoritos usa:
  - `user_favorites.user_id`
  - `event_date_id`
  - `class_source_type/class_source_id/class_cronograma_index`

SQL para verificar índices existentes:

```sql
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('events_date', 'events_parent', 'event_rsvp', 'user_favorites')
ORDER BY tablename, indexname;
```

SQL propuesto para candidatos aún no confirmados:

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date_organizer
  ON events_date(organizer_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date_estado_fecha
  ON events_date(estado_publicacion, fecha)
  WHERE estado_publicacion = 'publicado';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date_parent
  ON events_date(parent_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date_zona_fecha
  ON events_date(zona, fecha)
  WHERE estado_publicacion = 'publicado';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_rsvp_user
  ON event_rsvp(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_favorites_user
  ON user_favorites(user_id, entity_type);
```

Nota sobre el error ya observado:

- `CREATE INDEX CONCURRENTLY` falló con `cannot run inside a transaction block`
- en Supabase SQL Editor suele requerir ejecución aislada
- correr una sentencia por vez, o usar una ventana/contexto que no envuelva todo en transacción
- si se necesita hacerlo desde un script transaccional, usar `CREATE INDEX IF NOT EXISTS` solo en ventana de bajo tráfico



### Índices sin usar (candidatos a eliminar)

La query anterior falló porque en `pg_stat_user_indexes` no existe `tablename`.

SQL corregido:

```sql
SELECT
  schemaname,
  relname AS tablename,
  indexrelname AS indexname,
  idx_scan AS veces_usado,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

Lectura esperada:

- `idx_scan = 0` no implica borrarlo automáticamente
- primero revisar si:
  - el índice es nuevo
  - protege un caso raro pero importante
  - soporta constraints o deletes/updates indirectos

### Hot paths a explicar

Para salir de la zona de introspección y mirar tráfico real, conviene correr `EXPLAIN (ANALYZE, BUFFERS)` sobre consultas que sí aparecen en el frontend.

#### Explore / fechas públicas

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
  ed.id,
  ed.parent_id,
  ed.nombre,
  ed.fecha,
  ed.hora_inicio,
  ed.hora_fin,
  ed.lugar,
  ed.zona,
  ed.zonas,
  ed.flyer_url
FROM public.events_date ed
WHERE ed.estado_publicacion = 'publicado'
  AND (ed.fecha >= CURRENT_DATE OR ed.dia_semana IS NOT NULL)
ORDER BY ed.fecha ASC NULLS LAST, ed.hora_inicio ASC NULLS LAST, ed.id ASC
LIMIT 48;
```

#### Fechas por parent

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT id, parent_id, fecha, hora_inicio, hora_fin, estado_publicacion
FROM public.events_date
WHERE parent_id = 123
ORDER BY fecha ASC;
```

#### RSVP por usuario

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT event_date_id, status
FROM public.event_rsvp
WHERE user_id = auth.uid();
```

#### Favoritos por usuario

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT *
FROM public.user_favorites
WHERE user_id = auth.uid();
```

### Vistas públicas — verificar definición actual

Hallazgo de repo:

- en migraciones históricas, `events_live` y `v_events_dates_public` filtran por organizador aprobado y fecha futura, pero no siempre por `estado_publicacion = 'publicado'`
- existe además un script posterior (`apps/web/HOMOLOGAR_EVENTS_DATE_PROD.sql`) que recrea `v_events_dates_public` con `WHERE estado_publicacion = 'publicado'`

Riesgo:

- que la definición efectiva en producción no coincida con la esperada por el frontend
- que Explore o hooks públicos lean más filas de las necesarias

SQL a ejecutar:

```sql
SELECT viewname, definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('events_live', 'v_events_dates_public', 'v_events_parent_public');
```

Qué validar:

- `v_events_dates_public` debe filtrar `estado_publicacion = 'publicado'`
- `events_live` debería validar también publicación si esa es la semántica de negocio esperada
- revisar si el join a `profiles_organizer` sobre `estado_aprobacion = 'aprobado'` tiene soporte de índice suficiente


### Políticas RLS con subqueries lentas

Estado actual:

- en el repo, las políticas de `event_rsvp` y `user_favorites` usan comparaciones directas con `auth.uid()`
- eso es buena señal; no vi evidencia en migraciones revisadas de subqueries lentas para esas dos tablas

```sql
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

Qué revisar al ejecutar:

- subqueries dentro de `qual` o `with_check`
- joins implícitos a tablas grandes
- políticas repetidas sobre tablas de alto tráfico (`events_date`, `event_rsvp`, `user_favorites`)

### Tablas con filas muertas altas

Pendiente:

```sql
SELECT
  relname,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze,
  n_dead_tup AS filas_muertas,
  n_live_tup AS filas_vivas
FROM pg_stat_user_tables
WHERE relname IN ('events_date', 'events_parent', 'event_rsvp')
ORDER BY n_dead_tup DESC;
```

### Connection pool

Estado:

- no verificable desde el repo

Pendiente:

```sql
SELECT
  count(*) AS total_conexiones,
  count(*) FILTER (WHERE state = 'active') AS activas,
  count(*) FILTER (WHERE state = 'idle') AS idle,
  count(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_tx
FROM pg_stat_activity
WHERE datname = current_database();
```

Y adicionalmente:

```sql
SHOW max_connections;

SELECT application_name, count(*)
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY application_name
ORDER BY count DESC;
```

Checklist:

- [ ] verificar que Supabase Dashboard use `Transaction` y no `Session`
- [ ] verificar que la app use pooler donde corresponda
- [ ] revisar si hay `idle in transaction`

### Storage — assets más pesados

Pendiente:

```sql
SELECT
  name,
  bucket_id,
  metadata->>'size' AS tamaño,
  metadata->>'mimetype' AS tipo,
  created_at
FROM storage.objects
WHERE bucket_id = 'media'
ORDER BY (metadata->>'size')::bigint DESC NULLS LAST
LIMIT 20;
```

Objetivo al ejecutar:

- detectar flyers y media con peso alto
- priorizar compresión adicional si abundan archivos > 500 KB

## Vercel

### Headers de caché actuales

Medición real en producción:

| Asset | Cache-Control actual | ¿Correcto? |
|---|---|---|
| `/` | `public, max-age=0, must-revalidate` | Sí |
| `/explore` | `public, max-age=0, must-revalidate` | Sí |
| `/assets/main.css` | `public, max-age=31536000, immutable` | Sí |
| `/assets/index-CRek-AS6.js` | `public, max-age=31536000, immutable` | Sí |

Hallazgo:

- la política de caché de assets está bien configurada en producción

### Brotli

Medición real:

- `Accept-Encoding: br` sobre `/assets/index-CRek-AS6.js` devuelve `Content-Encoding: br`

Conclusión:

- Brotli ya está activo para assets principales

### TTFB promedio (5 mediciones)

Mediciones desde esta máquina:

- HTML `/`: ~222 ms
- JS principal `/assets/index-CRek-AS6.js`: ~228 ms
- CSS principal `/assets/main.css`: ~211 ms

Lectura:

- los assets están cacheados (`X-Vercel-Cache: HIT`)
- el TTFB de HTML sigue por encima del objetivo ideal `<100ms`

### Región configurada

Estado observado:

- no hay campo `regions` en `vercel.json` raíz ni en `apps/web/vercel.json`
- las respuestas observadas llegaron vía POP `sfo1` (`X-Vercel-Id`), lo cual no confirma región de funciones pero sí la ruta edge usada para esta medición

Configuración recomendada para CDMX:

- `iad1` en plan actual
- evaluar `gru1` si el proyecto escala y el tráfico principal sigue concentrado en LATAM

### Build time

Medición local:

- comando: `pnpm build:web`
- duración total medida: `14.02s`
- build de Vite reportado: `11.86s`

Conclusión:

- cumple ampliamente el objetivo `<45s`

### Rutas SPA — status codes

Medición real:

- `/explore`: `200`
- `/social/fecha/test`: `200`
- `/academia/test`: `200`

Conclusión:

- el rewrite SPA está funcionando

### Hallazgos de configuración

#### 1. Hay dos `vercel.json`

Archivos:

- `vercel.json`
- `apps/web/vercel.json`

Riesgo:

- configuración duplicada y con divergencias
- puede generar confusión sobre cuál es la fuente de verdad del deploy

Diferencias relevantes:

- el `vercel.json` raíz define `buildCommand`, `installCommand`, `outputDirectory`
- el de `apps/web` define rewrites más precisos para SPA y `/api`
- el raíz no define `Referrer-Policy`
- el de `apps/web` agrega headers de seguridad, pero también usa `X-XSS-Protection`, que ya es legado

Acción recomendada:

- consolidar en un solo `vercel.json` efectivo para producción

#### 2. Home en producción renderiza una pantalla de error

Medición real:

- `https://dondebailar.com.mx/` responde `200`, pero el HTML renderizado contiene:
  - `No se pudo cargar la pantalla.`
  - `Comprueba tu conexión o que el servidor de desarrollo esté en marcha y recarga.`

Impacto:

- problema funcional y SEO más grave que cualquier ajuste fino de caché
- posible fallo de runtime, fetch inicial o carga de route chunk

Prioridad:

- alta

#### 3. Seguridad HTTP parcial

Headers observados:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=63072000`
- `X-Xss-Protection: 1; mode=block`

Falta visible:

- `Referrer-Policy`

Acción recomendada:

- agregar `Referrer-Policy: strict-origin-when-cross-origin`
- mantener `nosniff`
- mantener `DENY` si no hay embeds legítimos
- considerar eliminar `X-XSS-Protection` si solo añade ruido operativo

## Priorización de acciones

### Esta semana — máximo impacto, mínimo riesgo

1. Ejecutar `pg_stat_statements` en Supabase y capturar top 5 queries lentas.
2. Verificar/crear índices críticos con `CONCURRENTLY`.
3. Corregir el `preconnect` de Supabase en `apps/web/index.html` agregando `crossorigin`.
4. Investigar por qué la home pública está renderizando la pantalla `No se pudo cargar la pantalla`.
5. Consolidar `vercel.json` para evitar deriva de configuración.

### Próxima semana

1. Revisar políticas RLS con subqueries y simplificarlas.
2. Ejecutar `VACUUM ANALYZE` si `n_dead_tup` sale alto.
3. Verificar Connection Pooling real en Supabase.
4. Reducir queries secuenciales en hooks como `useLiveClasses` y `useEventFullByDateId`.
5. Reemplazar `select("*")` en vistas públicas por listas de columnas explícitas.

### Cuando haya tiempo

1. Evaluar si vistas muy consultadas conviene materializarlas o convertirlas en RPCs específicas.
2. Revisar si `useHeroEvents` y Explore pueden apoyarse en payloads más pequeños.
3. Auditar storage para detectar flyers grandes y definir política de compresión/TTL.

## Punto de entrada recomendado

El primer paso sigue siendo `pg_stat_statements`. Es read-only, de bajo riesgo y te da el mapa real de dónde se está yendo el tiempo en producción.

SQL a correr primero:

```sql
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  stddev_exec_time,
  rows
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

Con ese resultado ya se puede hacer una segunda pasada mucho más precisa sobre índices, vistas o RLS.
