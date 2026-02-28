# ETAPA 0 — INVENTARIO DE SUPABASE
## Donde Bailar — Auditoría y Optimización Backend

**Fecha:** 2025-02-27  
**Objetivo:** Inventario completo de tablas, queries, RPCs, vistas y flujo de datos para la auditoría de performance.

---

## 1. TABLAS PRINCIPALES Y RELACIONES

### 1.1 Tablas core de eventos

| Tabla | Columnas críticas | Relaciones |
|-------|-------------------|------------|
| **events_parent** | `id`, `organizer_id`, `nombre`, `descripcion`, `estilos`, `ritmos_seleccionados`, `zonas`, `media`, `sede_general`, `ubicaciones`, `created_at` | FK: `organizer_id` → auth.users (vía profiles_organizer.id) |
| **events_date** | `id`, `parent_id`, `nombre`, `fecha`, `dia_semana`, `hora_inicio`, `hora_fin`, `lugar`, `direccion`, `ciudad`, `zona`, `zonas`, `estilos`, `ritmos_seleccionados`, `estado_publicacion`, `media`, `flyer_url`, `costos`, `cronograma`, `rsvp_interesado_count`, `created_at`, `updated_at` | FK: `parent_id` → events_parent.id |
| **event_rsvp** | `id`, `event_date_id`, `user_id`, `status`, `created_at` | FK: event_date_id → events_date.id, user_id → auth.users |
| **event_prices** | `id`, `event_date_id`, ... | FK: event_date_id → events_date.id |
| **event_schedules** | `id`, ... | Relacionado con eventos |

### 1.2 Tablas de perfiles

| Tabla | Columnas críticas | Uso |
|-------|-------------------|-----|
| **profiles_user** | `user_id`, `display_name`, `bio`, `avatar_url`, `ritmos`, `ritmos_seleccionados`, `zonas`, `onboarding_complete`, `rsvp_events`, `media`, `created_at` | Perfiles de bailarines |
| **profiles_organizer** | `id`, `user_id`, `nombre_publico`, `bio`, `media`, `ritmos`, `ritmos_seleccionados`, `zonas`, `estado_aprobacion`, `slug`, `created_at` | Organizadores |
| **profiles_teacher** | `id`, `user_id`, `nombre_publico`, `estado_aprobacion`, `ritmos`, `zonas`, `estilos`, `created_at` | Maestros |
| **profiles_academy** | `id`, `user_id`, `nombre_publico`, `estado_aprobacion`, `ritmos`, `zonas`, `created_at` | Academias |
| **profiles_brand** | `id`, `user_id`, `nombre_publico`, `estado_aprobacion`, `zonas`, `created_at` | Marcas |

### 1.3 Catálogos y tags

| Tabla | Columnas críticas | Uso |
|-------|-------------------|-----|
| **tags** | `id`, `nombre`, `tipo` ('ritmo' \| 'zona'), `slug`, `descripcion`, `created_at` | Ritmos y zonas para filtros |

### 1.4 Otras tablas relevantes

| Tabla | Uso |
|-------|-----|
| **clase_asistencias** | Asistencia a clases |
| **competition_groups**, **competition_group_members** | Grupos de competencia |
| **trendings**, **trending_candidates**, **trending_votes** | Sistema trending |
| **challenges**, **challenge_submissions**, **challenge_votes** | Challenges |
| **academy_teacher_invitations** | Relación academia-maestro |
| **user_roles** | Roles de usuario |
| **organizer_locations** | Ubicaciones de organizadores |

---

## 2. VISTAS PÚBLICAS

| Vista | Tablas base | Filtros | Uso |
|-------|-------------|---------|-----|
| **v_organizers_public** | profiles_organizer | estado_aprobacion = 'aprobado' | Explore organizadores |
| **v_academies_public** | profiles_academy | estado_aprobacion = 'aprobado' | Explore academias |
| **v_teachers_public** | profiles_teacher | estado_aprobacion = 'aprobado' | Explore maestros |
| **v_brands_public** | profiles_brand | estado_aprobacion = 'aprobado' | Explore marcas |
| **v_user_public** | profiles_user | display_name IS NOT NULL | Explore usuarios |
| **v_events_dates_public** | events_date ⋈ events_parent ⋈ profiles_organizer | aprobado + fecha >= hoy | Alternativa a events_date directo |
| **v_events_parent_public** | events_parent ⋈ profiles_organizer | aprobado | Eventos padre públicos |
| **events_live** | events_date ⋈ events_parent ⋈ profiles_organizer | aprobado + fecha >= hoy | Vista legacy |
| **events_with_rsvp_stats** | (vista/materializada) | — | **Usada en useEventsWithRSVPStats** — puede no existir en migraciones actuales |

---

## 3. QUERIES PRINCIPALES Y UBICACIÓN EN CÓDIGO

### 3.1 ExploreHomeScreenModern — Query principal de eventos

**Archivo:** `apps/web/src/hooks/useExploreQuery.ts`  
**Función:** `fetchPage(params, page)`

| Paso | Query | Tabla/Vista | Propósito |
|-----|-------|------------|-----------|
| 1 | Mapeo ritmos | `tags` | `select('id,nombre,tipo').in('id', ritmos).eq('tipo','ritmo')` |
| 2 | Query principal | `events_date` | Select con join `events_parent`, filtros fecha/ritmos/zonas/búsqueda |
| 3 | Búsqueda extra (si hay texto) | `events_parent` | `select('id').or(nombre.ilike) limit 250` |
| 4 | Búsqueda extra (si hay texto) | `v_organizers_public` | `select('id').or(nombre_publico.ilike) limit 250` |
| 5 | Búsqueda extra (si hay texto) | `events_parent` | `select('id').in('organizer_id', matchedIds) limit 500` |
| 6 | Query adicional por parent_ids | `events_date` | Si hay matches por parent/organizer |
| 7 | RPC materialización | `ensure_weekly_occurrences` | Por cada parent recurrente (dia_semana) |
| 8 | Re-fetch ocurrencias | `events_date` | `.in('parent_id', recurringParentIds).gte('fecha').lte('fecha')` |
| 9 | Búsqueda organizadores (filtro final) | `v_organizers_public` | Si search y no se obtuvo antes |

**Select usado para fechas:**
```sql
id, parent_id, nombre, fecha, dia_semana, hora_inicio, hora_fin, lugar, direccion, ciudad, zona,
estado_publicacion, estilos, ritmos_seleccionados, costos, media, flyer_url, created_at, updated_at,
events_parent(id, nombre, descripcion, estilos, ritmos_seleccionados, zonas, media, organizer_id)
```

**Filtros aplicados:**
- `estado_publicacion = 'publicado'`
- `dia_semana.not.is.null OR fecha.gte.dateFrom` (y análogo para dateTo)
- `overlaps("estilos", ritmos)` o `overlaps("ritmos_seleccionados", catalogIds)`
- `in("zona", zonas)` si hay zonas
- `or(nombre.ilike, lugar.ilike, ciudad.ilike, direccion.ilike)` si hay búsqueda

**Orden:** `order("fecha", { ascending: true })`  
**Paginación:** `range(from, to)` con PAGE_LIMIT=12

### 3.2 Búsqueda por texto

**Archivo:** `apps/web/src/hooks/useExploreQuery.ts` (líneas 239-346, 357-455)

- Normalización: `normalizeSearch(q)` — escapa comas y backslashes
- Patrón: `ilike` con `%pattern%`
- Para fechas: también busca en `events_parent.nombre` y `v_organizers_public.nombre_publico` vía queries adicionales
- Filtro final en memoria: `matchesFechaSearch()` para combinar resultados

### 3.3 Filtros por fecha / ritmo / zona

**Archivo:** `apps/web/src/hooks/useExploreQuery.ts` (líneas 197-335)

- **Fecha:** `dateFrom`/`dateTo` o hoy CDMX por defecto; lógica `or(dia_semana.not.is.null, fecha.gte/lte)`
- **Ritmos:** IDs numéricos → `overlaps("estilos", ritmos)`; IDs catálogo → `overlaps("ritmos_seleccionados", selectedCatalogIds)`
- **Zonas:** `in("zona", zonas)` para events_date

### 3.4 Pantalla detalle evento (EventDatePublicScreen)

**Archivo:** `apps/web/src/screens/events/EventDatePublicScreen.tsx`

| Hook | Archivo | Query |
|------|---------|-------|
| `useEventDateSuspense(dateId)` | `apps/web/src/hooks/useEventDateSuspense.ts` | `from("events_date").select("*").eq("id", dateId).maybeSingle()` |
| `useEventParent(parentId)` | `apps/web/src/hooks/useEventParent.ts` | `from("events_parent").select("*").eq("id", parentId)` |
| `useEventRSVP(dateId)` | `apps/web/src/hooks/useRSVP.ts` | RPCs: `get_user_rsvp_status`, `get_event_rsvp_stats` |
| Media/flyer | — | Lee `media` JSONB y `flyer_url` de events_date/events_parent |

### 3.5 RSVPs

**Archivo:** `apps/web/src/hooks/useRSVP.ts`

| Operación | Método | RPC/Query |
|-----------|--------|-----------|
| Estado usuario | `useUserRSVP` | `rpc('get_user_rsvp_status', { event_id })` |
| Stats evento | `useEventRSVPStats` | `rpc('get_event_rsvp_stats', { event_id })` |
| Crear/actualizar | `useUpdateRSVP` | `rpc('upsert_event_rsvp', { p_event_date_id, p_status })` |
| Eliminar | `useRemoveRSVP` | `rpc('delete_event_rsvp', { p_event_date_id })` |
| Lista eventos con RSVP | `useUserRSVPEvents` | `from("event_rsvp").select(...).eq("user_id")` + `from("events_date").select("*").in("id", dateIds)` |

### 3.6 MyRSVPsScreen

**Archivo:** `apps/web/src/hooks/useMyRSVPs.ts`

| Paso | Query |
|------|-------|
| 1 | `from("event_rsvp").select("*").eq("user_id", user.id)` |
| 2 | `from("events_date").select("*").in("id", dateIds)` |
| 3 | `from("events_parent").select("id, nombre").in("id", parentIds)` |
| 4 | Filtro en memoria: solo fechas futuras |

### 3.7 Otras queries relevantes

| Pantalla/Componente | Archivo | Query |
|---------------------|---------|-------|
| OrganizerPublicScreen | `OrganizerPublicScreen.tsx` | `from("v_organizers_public").select("*").eq("id"\|"user_id"\|"slug", routeId)` |
| useUsedFilterTags | `useUsedFilterTags.ts` | `rpc('rpc_get_used_tags')` |
| useTags | `useTags.ts` | `from("tags").select(...).eq("tipo", tipo)` |
| useEventsWithRSVPStats | `useRSVP.ts` | `from("events_with_rsvp_stats").select("*")` — **verificar existencia de vista** |
| EventDatesSheet | `EventDatesSheet.tsx` | `from("events_date").select("*").eq("id", id)` |
| useUserRSVPEvents | `useRSVP.ts` | event_rsvp + events_date (2 queries) |

---

## 4. EDGE FUNCTIONS

| Función | Uso | Archivo que invoca |
|---------|-----|--------------------|
| `stripe-create-connected-account` | Crear cuenta Stripe | `StripePayoutSettings.tsx` |
| `stripe-create-account-link` | Link onboarding Stripe | `StripePayoutSettings.tsx` |
| `stripe-create-checkout-session` | Checkout Stripe | `useStripeCheckout.ts` |
| `stripe-webhook` | Webhook Stripe | (backend) |
| `request-account-deletion` | Borrado de cuenta | `DeleteAccountScreen.tsx` |

---

## 5. RPCs UTILIZADAS

### Eventos y RSVP
| RPC | Parámetros | Uso |
|-----|------------|-----|
| `ensure_weekly_occurrences` | `p_parent_id`, `p_weeks_ahead` | Materializar ocurrencias recurrentes |
| `get_user_rsvp_status` | `event_id` | Estado RSVP del usuario |
| `get_event_rsvp_stats` | `event_id` | Stats (interesado, total) |
| `upsert_event_rsvp` | `p_event_date_id`, `p_status` | Crear/actualizar RSVP |
| `delete_event_rsvp` | `p_event_date_id` | Eliminar RSVP |
| `cleanup_expired_rsvps` | — | Limpieza (MyRSVPsScreen) |

### Perfiles
| RPC | Uso |
|-----|-----|
| `merge_profiles_user` | Actualizar perfil usuario |
| `merge_profiles_organizer` | Actualizar perfil organizador |
| `merge_profiles_academy` | Actualizar perfil academia |
| `submit_academy_for_review` | Enviar academia a revisión |

### Filtros y catálogos
| RPC | Uso |
|-----|-----|
| `rpc_get_used_tags` | Tags usados en perfiles (SECURITY DEFINER, CTEs sobre 5 tablas) |

### Clases, ratings, trending, challenges
- `get_academy_class_reservations`, `get_academy_class_metrics`, `get_teacher_class_metrics`
- `create_class_parent`, `merge_classes_parent`, `create_class_session`, `merge_classes_session`
- `get_academy_rating_average`, `get_teacher_rating_average`, `get_event_parent_rating_average`
- `rpc_trending_leaderboard`, `rpc_trending_vote`, `rpc_trending_create`, etc.
- `challenge_create`, `challenge_publish`, `challenge_submit`, `challenge_approve_submission`, etc.

---

## 6. REALTIME

| Hook | Archivo | Uso |
|------|---------|-----|
| `useUnreadNotifications` | `useUnreadNotifications.ts` | Canal realtime para notificaciones no leídas |

---

## 7. FLUJO DE DATOS POR PANTALLA

### ExploreHomeScreenModern
1. `useExploreQuery(type, q, ritmos, zonas, dateFrom, dateTo)` → `fetchPage`
2. Query a `tags` (si ritmos) para mapear a catálogo
3. Query principal a `events_date` + join `events_parent`
4. Si búsqueda: hasta 3 queries extra (events_parent, v_organizers_public, events_parent por organizer)
5. Si hay recurrentes: RPC `ensure_weekly_occurrences` por cada parent + re-fetch
6. Post-procesamiento en memoria (filtro por fecha calculada, orden, búsqueda)
7. `useUsedFilterTags`, `useTags`, `useUserFilterPreferences` para filtros

### EventDatePublicScreen
1. `useEventDateSuspense(dateId)` → events_date
2. `useEventParent(parentId)` → events_parent
3. `useEventRSVP(dateId)` → get_user_rsvp_status + get_event_rsvp_stats
4. Media/flyer desde JSONB y flyer_url

### MyRSVPsScreen
1. `cleanup_expired_rsvps` RPC (fire-and-forget)
2. `useMyRSVPs()` → event_rsvp → events_date → events_parent

### OrganizerPublicScreen
1. Query a `v_organizers_public` por id/user_id/slug
2. Eventos del organizador vía hook separado

---

## 8. ÍNDICES EXISTENTES (20250128_create_performance_indexes.sql)

- **events_date:** idx_events_date_parent_id, idx_events_date_created_at, idx_events_date_zona, idx_events_date_parent_created
- **events_parent:** idx_events_parent_organizer_id, idx_events_parent_created_at, idx_events_parent_organizer_created
- **event_rsvp:** idx_event_rsvp_created_at (más idx_event_rsvp_event_date, idx_event_rsvp_user en migración RSVP)
- **profiles_*:** user_id, created_at, compuestos
- **tags:** (no hay índices explícitos en esta migración)

**Nota:** No hay índice en `events_date.fecha` ni en `events_date.estado_publicacion`, columnas muy usadas en filtros.

---

## 9. OBSERVACIONES PARA ETAPA 1

1. **events_with_rsvp_stats:** Usada en `useEventsWithRSVPStats` pero no aparece en migraciones recientes; verificar si existe en prod.
2. **Búsqueda por texto:** Múltiples queries adicionales cuando hay `q`; `ilike` sin FTS/trigram.
3. **Recurrentes:** RPC `ensure_weekly_occurrences` llamada en serie por cada parent recurrente en la página.
4. **Select explícito en fechas:** Sí (no SELECT *), pero otros tipos usan `select: "*"`.
5. **Paginación:** Sí, range(from, to) con limit 12.

---

*Documento generado como parte de la auditoría Supabase — ETAPA 0 completada.*
