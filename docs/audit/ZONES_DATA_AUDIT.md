# Zones Data Audit

Date: 2026-03-10
Scope: Explore filters by context (`eventos`, `clases`, `academias`, `maestros`, `organizadores`, `bailarines`, `marcas`)

## 1) Inventory of zone sources

| contexto | tabla | columna | tipo de dato | ejemplo real | vigente o legacy |
|---|---|---|---|---|---|
| eventos | `events_date` | `zona` | `int` (single id) | seed insert con `zona` en `events_date` | vigente |
| eventos | `events_date` | `zonas` | `int[]` | `COALESCE(ep.zonas, ed.zonas)` en vistas públicas | vigente |
| eventos/sociales | `events_parent` | `zonas` | `int[]` | insert a `events_parent (.., zonas)` en seeds/import | vigente |
| clases | `profiles_academy` | `zonas` | `int[]` | `unnest(coalesce(pa.zonas,'{}'::int[]))` | vigente (modelo actual de clases en frontend) |
| clases | `profiles_teacher` | `zonas` | `int[]` | `unnest(coalesce(pt.zonas,'{}'::int[]))` | vigente (modelo actual de clases en frontend) |
| academias | `profiles_academy` | `zonas` | `int[]` | seeds con columna `zonas` | vigente |
| maestros | `profiles_teacher` | `zonas` | `int[]` | seeds con columna `zonas` | vigente |
| organizadores | `profiles_organizer` | `zonas` | `int[]` | seeds con columna `zonas` | vigente |
| bailarines | `profiles_user` | `zonas` | `int[]` | merges `jsonb -> integer[]` para `zonas` | vigente |
| marcas | `profiles_brand` | `zonas` | `int[]` | RPCs previos leen `profiles_brand.zonas` | vigente |
| catálogo maestro | `tags` | `tipo='zona'` (`id`,`nombre`,`slug`) | catálogo | `useTags('zona')` | vigente |

Notas:
- En el repo no se encontraron DDLs de `classes_parent` y `classes_session`; no se asumieron columnas inexistentes para la RPC nueva.
- Para eventos existe coexistencia de `zona` (single) y `zonas` (array), ambos deben soportarse.

## 2) Format and quality checks (what we validated)

### `events_date.zona`
- Formato esperado: id numérico único.
- Posibles valores: `NULL`.
- Riesgo: coexistencia con `events_date.zonas` (doble fuente si no se normaliza).

### `events_date.zonas`, `events_parent.zonas`, `profiles_*.zonas`
- Formato esperado: arrays de ids numéricos (`int[]`).
- Posibles valores: `NULL`, array vacío.
- Riesgo: ids huérfanos (presentes en datos pero no en `tags`), mitigado cruzando contra `tags`.

### `tags` (`tipo='zona'`)
- Fuente maestra de visualización (`id`, `nombre`, `slug`).
- Riesgo: ids en entidades que no existan en catálogo.

## 3) Sampling queries used for audit

```sql
-- Eventos: single zone
select id, zona
from public.events_date
where estado_publicacion = 'publicado'
  and zona is not null
limit 20;
```

```sql
-- Eventos: array zones
select id, zonas
from public.events_date
where estado_publicacion = 'publicado'
  and zonas is not null
limit 20;
```

```sql
-- Parent zones
select id, zonas
from public.events_parent
where zonas is not null
limit 20;
```

```sql
-- Perfil zones
select 'profiles_user' as source, id, zonas from public.profiles_user where zonas is not null limit 20;
select 'profiles_academy' as source, id, zonas from public.profiles_academy where zonas is not null limit 20;
select 'profiles_teacher' as source, id, zonas from public.profiles_teacher where zonas is not null limit 20;
select 'profiles_organizer' as source, id, zonas from public.profiles_organizer where zonas is not null limit 20;
select 'profiles_brand' as source, id, zonas from public.profiles_brand where zonas is not null limit 20;
```

```sql
-- IDs huérfanos (ejemplo con profiles_user)
with ids as (
  select distinct unnest(coalesce(zonas, '{}'::int[])) as zona_id
  from public.profiles_user
)
select i.zona_id
from ids i
left join public.tags t on t.id = i.zona_id and t.tipo = 'zona'
where t.id is null;
```

## 4) Outcome for implementation

- Se creó RPC contextual: `rpc_get_used_zones_by_context(p_context text)`.
- Se agregó modo debug: `rpc_get_used_zones_by_context_debug(p_context text)` con:
  - `context`
  - `source_table`
  - `source_column`
  - `raw_id`
  - `normalized_id`
  - `total`
- Ambas funciones normalizan, deduplican y validan contra `tags.tipo='zona'`.

