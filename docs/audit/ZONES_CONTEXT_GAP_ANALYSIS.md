# Zones Context Gap Analysis

Date: 2026-03-10

## Current-state findings (before fix)

| contexto | zonas reales detectadas | zonas mostradas UI | faltantes | sobrantes | causa probable |
|---|---|---|---|---|---|
| eventos/sociales | `events_date.zona`, `events_date.zonas`, `events_parent.zonas` | mezcla global vía `rpc_get_used_tags` | sí (si el contexto no aportaba suficientes ids al global) | sí (ids de otros perfiles/contextos) | fuente global no contextual para zonas |
| bailarines | `profiles_user.zonas` | mezcla global | sí | sí | zonas de otros perfiles contaminaban el set |
| academias | `profiles_academy.zonas` | mezcla global | sí | sí | misma RPC global para cualquier tipo |
| maestros | `profiles_teacher.zonas` | mezcla global | sí | sí | misma RPC global para cualquier tipo |
| organizadores | `profiles_organizer.zonas` | mezcla global | sí | sí | misma RPC global para cualquier tipo |
| marcas | `profiles_brand.zonas` | mezcla global | sí | sí | misma RPC global para cualquier tipo |
| clases | modelo vigente: `profiles_academy.zonas` + `profiles_teacher.zonas` | mezcla global | sí | sí | sin RPC contextual de zonas para `clases` |

## Code audit summary

1. **Carga de zonas no contextual**
   - `ExploreHomeScreenModern` usaba `useUsedFilterTags()` para `usedZonaIds` (global).
   - `FilterBar` también usaba `useUsedFilterTags()` para zonas.
2. **Ritmos sí contextual, zonas no**
   - Ritmos usa `mapExploreTypeToContext` + `useUsedRhythmsByContext`.
   - Zonas no tenía equivalente contextual.
3. **Riesgo de limpieza agresiva**
   - Limpieza de seleccionados dependía de `type + date + search`, pudiendo limpiar por cambios de búsqueda/rango y no solo por cambio de contexto.

## Implemented corrections

### Backend
- Nueva RPC: `rpc_get_used_zones_by_context(p_context text)`.
- RPC debug: `rpc_get_used_zones_by_context_debug(p_context text)`.
- Contextos soportados:
  - `eventos`
  - `clases`
  - `academias`
  - `maestros`
  - `organizadores`
  - `bailarines`
  - `marcas`
- Reglas:
  - normalización de ids
  - ignora null/vacíos
  - dedup
  - cruce con `tags.tipo='zona'`
  - orden por nombre

### Frontend
- Nuevo hook: `useUsedZonesByContext(context)`.
- Nuevo mapper centralizado: `mapExploreTypeToZoneContext(type)`.
- Integración en:
  - `ExploreHomeScreenModern` (fuente principal de opciones de zonas)
  - `FilterBar` (paridad con ritmos en componente legacy/reusable)
- Limpieza al cambiar contexto:
  - ahora usa clave de contexto basada en `type` (no en búsqueda/fechas),
  - y valida `filters.zonas` contra subconjunto contextual disponible.

## Validation checklist

Use this checklist to verify no cross-context contamination:

- Cambiar a `usuarios`: solo zonas usadas en `profiles_user`.
- Cambiar a `academias`: solo zonas usadas en `profiles_academy`.
- Cambiar a `maestros`: solo zonas usadas en `profiles_teacher`.
- Cambiar a `organizadores`: solo zonas usadas en `profiles_organizer`.
- Cambiar a `marcas`: solo zonas usadas en `profiles_brand`.
- Cambiar a `fechas`/`sociales`: solo zonas usadas en eventos.
- Seleccionar una zona en un contexto y cambiar de tipo:
  - si esa zona no existe en el nuevo contexto, debe limpiarse automáticamente.

## Quick debug queries

```sql
-- Opciones que debe mostrar el frontend para un contexto:
select * from public.rpc_get_used_zones_by_context('bailarines');
select * from public.rpc_get_used_zones_by_context('eventos');
```

```sql
-- Auditoría de origen y normalización por contexto:
select * from public.rpc_get_used_zones_by_context_debug('eventos');
select * from public.rpc_get_used_zones_by_context_debug('academias');
```

