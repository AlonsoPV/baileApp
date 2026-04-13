# Auditoría del modelo de eventos

Fecha: 2026-04-12

Nota de alcance: esta auditoría se hizo sin modificar código y con base en el repo local. La parte de Supabase se infiere desde SQL versionado en `supabase/`; no se consultó el estado live del dashboard ni se ejecutaron queries contra la base real.

## Tablas en Supabase

| Tabla | Columnas clave | Relaciones |
|---|---|---|
| `events_parent` | `id`, `organizer_id`, `nombre`, `descripcion`, `biografia`, `estilos`, `ritmos_seleccionados`, `zonas`, `sede_general`, `ubicaciones`, `faq`, `media`, `created_at` | `events_parent.organizer_id -> profiles_organizer.id`; `events_date.parent_id -> events_parent.id`; `event_parent_ratings.event_parent_id -> events_parent.id`; `event_rsvp.event_parent_id -> events_parent.id` |
| `events_date` | `id`, `parent_id`, `organizer_id`, `nombre`, `biografia`, `fecha`, `dia_semana`, `hora_inicio`, `hora_fin`, `lugar`, `direccion`, `ciudad`, `zona`, `referencias`, `requisitos`, `estilos`, `ritmos_seleccionados`, `zonas`, `ubicaciones`, `cronograma`, `costos`, `media`, `flyer_url`, `telefono_contacto`, `mensaje_contacto`, `djs`, `estado_publicacion`, `rsvp_interesado_count`, `created_at`, `updated_at` | `events_date.parent_id -> events_parent.id`; `events_date.organizer_id -> profiles_organizer.id`; `event_rsvp.event_date_id -> events_date.id`; `user_favorites.event_date_id -> events_date.id` |
| `event_rsvp` | `id`, `event_date_id`, `event_parent_id`, `user_id`, `status`, `created_at`, `updated_at` | `event_rsvp.event_date_id -> events_date.id`; `event_rsvp.event_parent_id -> events_parent.id`; `event_rsvp.user_id -> auth.users.id` |
| `event_parent_ratings` | `id`, `event_parent_id`, `user_id`, `overall_rating`, `ambiente_general`, `seleccion_musical`, `organizacion`, `comodidad_espacio`, `probabilidad_asistir`, `created_at`, `updated_at` | `event_parent_ratings.event_parent_id -> events_parent.id`; `event_parent_ratings.user_id -> auth.users.id` |
| `user_favorites` | `id`, `entity_type`, `event_date_id`, `user_id`, `created_at` | `user_favorites.event_date_id -> events_date.id` cuando `entity_type = 'event'` |

## Vistas públicas relacionadas

- `events_live`: mezcla `events_date` con datos del padre y del organizador.
- `v_events_dates_public`: vista pública de fechas.
- `v_events_parent_public`: vista pública de padres.

Hallazgo importante:

- En `20250131_remove_security_definer_from_views.sql`, `events_live` y `v_events_dates_public` hacen `JOIN public.events_parent ep ON ed.parent_id = ep.id`.
- En `20260307_events_date_optional_parent.sql`, esas vistas se rehacen con `LEFT JOIN public.events_parent ep ON ed.parent_id = ep.id` y `COALESCE(ep.organizer_id, ed.organizer_id)`, lo que indica una migración parcial hacia fechas sin padre.

## Foreign keys encontradas

- `events_parent.organizer_id -> profiles_organizer.id` con `ON DELETE CASCADE`.
- `events_date.parent_id -> events_parent.id` con `ON DELETE CASCADE`.
- `events_date.organizer_id -> profiles_organizer.id` con `ON DELETE SET NULL`.
- `event_rsvp.event_date_id -> events_date.id` con `ON DELETE CASCADE`.
- `event_rsvp.event_parent_id -> events_parent.id` con `ON DELETE SET NULL`.
- `event_parent_ratings.event_parent_id -> events_parent.id` con `ON DELETE CASCADE`.
- `user_favorites.event_date_id -> events_date.id` con `ON DELETE CASCADE`.

## Triggers encontrados

- `trg_event_rsvp_sync` en `event_rsvp`: recalcula contadores y sincroniza RSVP del usuario.
- `trg_event_parent_ratings_updated` en `event_parent_ratings`: mantiene `updated_at`.
- `trg_enforce_recurring_future_limit_30` en `events_date`: bloquea más de 30 fechas futuras por serie recurrente.

Conclusión de triggers:

- No encontré un trigger que cree automáticamente un `events_parent` al insertar en `events_date`.
- La auto-creación del padre ocurre hoy en frontend/hook, no en trigger SQL.

## RLS encontradas

Confirmadas en SQL versionado:

- `event_rsvp`: políticas propias de lectura/escritura y luego lectura pública.
- `event_parent_ratings`: lectura pública y escritura del propio usuario.
- `events_parent`: políticas `select_all`, `insert_organizer`, `update_own`, `delete_own`.
- `events_date`: políticas equivalentes y, desde `20260307`, lógica que permite `INSERT/UPDATE/DELETE` por `parent_id` o por `organizer_id` directo cuando `parent_id IS NULL`.

Limitación:

- En el repo sí aparecen `CREATE POLICY` para `events_parent` y `events_date`, pero no pude confirmar desde la BD real si RLS está actualmente habilitado o si todas esas migraciones están aplicadas en ese orden.

## RPCs encontradas

- `ensure_weekly_occurrences(bigint, int)`: materializa ocurrencias recurrentes por `parent_id`.
- `ensure_weekly_occurrences_orphan(bigint, int)`: materializa ocurrencias para fechas huérfanas por `organizer_id`.
- `get_user_rsvp_status(bigint)`, `get_event_rsvp_stats(bigint)`, `upsert_event_rsvp(bigint, text)`, `delete_event_rsvp(bigint)`: RSVP por fecha.
- `get_event_parent_rating_average(bigint)`: ratings por `event_parent_id`.
- `rpc_get_used_rhythms(text)`, `rpc_get_used_rhythms_by_context(text)`: filtros/descubrimiento que incluyen eventos.

## Edge Functions encontradas

En `supabase/functions` solo aparecen funciones de Stripe:

- `stripe-create-checkout-session`
- `stripe-create-account-link`
- `stripe-create-connected-account`
- `stripe-webhook`

Conclusión:

- No encontré Edge Functions relacionadas con creación de eventos.
- El frontend no llama Edge Functions para crear `events_parent` ni `events_date`; la escritura va directo por `supabase.from(...)` y algunas RPCs auxiliares.

## Flujo de creación actual (paso a paso)

### Flujo principal hoy

1. El modelo sigue siendo de dos niveles: `events_parent` como contenedor/serie/social y `events_date` como fecha concreta.
2. Varias pantallas crean primero el padre y luego la fecha.
3. Otras pantallas crean directamente la fecha, pero el hook resuelve o crea un padre si falta `parent_id`.
4. Si la fecha es recurrente (`dia_semana`), después de insertar se ejecuta `ensure_weekly_occurrences`.

### Hooks y pantallas que crean `events_parent`

- `apps/web/src/hooks/useEvents.ts`
  - `useCreateParent()`
  - Inserta directo en `events_parent`.
- `apps/web/src/hooks/useEventParent.ts`
  - `useCreateEventParent()`
  - Inserta directo en `events_parent`.
- `apps/web/src/hooks/useEventDate.ts`
  - `useCreateEventDate()`
  - Si llega `organizer_id` sin `parent_id`, busca un `events_parent` existente para ese organizador y, si no existe, inserta uno mínimo.
- `apps/web/src/screens/profile/OrganizerProfileEditor.tsx`
  - Si el organizador es nuevo, crea un `events_parent` por defecto y luego una `events_date` inicial.
- `apps/web/src/screens/events/EventCreateScreen.tsx`
  - Crea padre y luego fecha.
- `apps/web/src/screens/events/EventParentEditScreen.tsx`
  - Si no hay `id`, crea padre.
- `apps/web/src/screens/profile/EventEditor.tsx`
  - Crear social/padre.
- `apps/web/src/screens/events/OrganizerEventParentCreateScreen.tsx`
  - Crear padre.

### Hooks y pantallas que crean `events_date`

- `apps/web/src/hooks/useEvents.ts`
  - `useCreateDate()`
  - Inserta directo en `events_date`; requiere `parent_id`.
- `apps/web/src/hooks/useEventDate.ts`
  - `useCreateEventDate()`
  - Inserta una o varias filas en `events_date`; puede auto-crear el padre antes.
- `apps/web/src/screens/events/EventCreateScreen.tsx`
  - Crea fecha después del padre.
- `apps/web/src/screens/profile/OrganizerProfileEditor.tsx`
  - Crea fecha única o bulk usando `useCreateEventDate`.
- `apps/web/src/screens/events/OrganizerEventDateCreateScreen.tsx`
  - Crea fecha(s) usando `useCreateEventDate`.
- `apps/web/src/screens/profile/EventDateEditor.tsx`
  - Crea fecha(s) por `useCreateDate` o `useCreateEventDate`.
- `apps/web/src/screens/events/EventDateEditScreen.tsx`
  - En bulk hace `insert` directo sobre `events_date`.
- `apps/web/src/screens/events/OrganizerEventDateEditScreen.tsx`
  - Igual: bulk insert directo sobre `events_date`.

### Campos que se envían hoy

#### Al padre (`events_parent`)

- `organizer_id`
- `nombre`
- `descripcion`
- `biografia`
- `estilos`
- `ritmos_seleccionados`
- `zonas`
- `sede_general`
- `ubicaciones`
- `faq`
- `media`

#### A la fecha (`events_date`)

- `parent_id`
- `organizer_id`
- `nombre`
- `biografia`
- `fecha`
- `dia_semana`
- `hora_inicio`
- `hora_fin`
- `lugar`
- `direccion`
- `ciudad`
- `zona`
- `referencias`
- `requisitos`
- `estilos`
- `ritmos_seleccionados`
- `zonas`
- `ubicaciones`
- `cronograma`
- `costos`
- `media`
- `flyer_url`
- `telefono_contacto`
- `mensaje_contacto`
- `djs`
- `estado_publicacion`

## Identificación del punto exacto de `selectedParentId`

`selectedParentId` existe en un solo archivo:

- `apps/web/src/screens/profile/OrganizerProfileEditor.tsx`

Uso actual:

- Es el estado del selector de social/padre al crear fechas desde el editor del organizador.
- Si no hay selección y existen padres, el UI asigna el primero por defecto.
- En `handleCreateDate` y `handleBulkCreateDates`, el `parent_id` final se resuelve como:
  - `selectedParentId`, o
  - `parents[0].id` si no hay selección explícita.
- También se usa para invalidar caches y para subir flyers asociados al flujo de fecha.

Conclusión:

- Hoy `selectedParentId` no es decorativo; es el punto exacto que decide a qué `events_parent` se vincula cada `events_date` creada desde el editor principal del organizador.

## Identificar si el padre se crea automáticamente

Sí, pero no por trigger.

La lógica exacta está en:

- `apps/web/src/hooks/useEventDate.ts`

Comportamiento:

1. Si el payload trae `organizer_id` y no trae `parent_id`, el hook busca un `events_parent` existente para ese organizador.
2. Si no encuentra uno, crea un `events_parent` mínimo con datos derivados de la fecha.
3. Reescribe el payload agregando `parent_id`.
4. Después inserta en `events_date`.

Esto significa:

- El sistema actual ya intentó soportar la idea de “crear fecha sin seleccionar padre”.
- Pero en la implementación actual, eso no elimina al padre: solo lo crea en segundo plano.

## Flujo de display actual

### Organizador

Lecturas principales:

- `apps/web/src/hooks/useEventParentsByOrganizer.ts`
  - Lee `events_parent` por `organizer_id`.
- `apps/web/src/hooks/useEventDatesByOrganizer.ts`
  - Lee `events_date` por `organizer_id` e incluye `events_parent(id, nombre, organizer_id)`.
- `apps/web/src/hooks/useEventDate.ts`
  - `useEventDatesByParent(parentId)` lee fechas por `parent_id`.
- `apps/web/src/hooks/useEvents.ts`
  - `useParentsByOrganizer`, `useDatesByParent`, `useCreateParent`, `useCreateDate`.

Dependencia del padre en organizador:

- El dashboard del organizador sigue agrupando y navegando por `parent_id`.
- Muchas invalidaciones de caché y rutas internas están estructuradas alrededor del padre.

### Público

Lecturas principales:

- `apps/web/src/lib/eventSelects.ts`
  - `SELECT_EVENTS_CARD` y `SELECT_EVENTS_DETAIL` hacen join anidado `events_parent(...)`.
- `apps/web/src/hooks/useEventDateSuspense.ts`
  - Lee `events_date` con join a `events_parent`.
- `apps/web/src/hooks/useEventFull.ts`
  - Lee `events_date` y luego `events_parent` aparte.
- `apps/web/src/screens/events/EventDatePublicScreen.tsx`
  - Usa `useEventDateSuspense(dateId)` y además `useEventParent(date.parent_id)`.
- `apps/web/src/screens/events/DateLiveScreen.tsx`
  - Lee `events_date` y después `events_parent(date.parent_id)`.
- `apps/web/src/screens/events/EventParentPublicScreenModern.tsx`
  - Página pública basada directamente en `events_parent.id`.
- `apps/web/src/hooks/useLive.ts`
  - Usa la vista `events_live`, que aplanó datos del padre.

### URLs públicas actuales

Por padre:

- `/social/:id`
- `/social/:parentId`
- `/events/parent/:id`

Por fecha:

- `/social/fecha/:id`
- `/events/date/:id`

Conclusión:

- Ya existen URLs públicas cuyo identificador principal es `events_parent.id`.
- El padre no es solo un detalle interno del organizador; también es parte del contrato de navegación pública.

## Dependencias del padre en display

Campos del padre usados en frontend público u organizador:

- `id`
- `organizer_id`
- `nombre`
- `biografia`
- `descripcion`
- `estilos`
- `ritmos_seleccionados`
- `zonas`
- `sede_general`
- `faq`
- `media`

Dependencias concretas:

- `SELECT_EVENTS_CARD` usa `events_parent.id`, `events_parent.nombre`, `events_parent.organizer_id`.
- `SELECT_EVENTS_DETAIL` usa `events_parent.nombre`, `biografia`, `descripcion`, `estilos`, `ritmos_seleccionados`, `zonas`, `media`, `organizer_id`.
- `DateLiveScreen` falla si no existe `social`/padre.
- `useMyRSVPs` filtra y descarta items sin padre.
- `useEventFullByDateId` sí tolera ausencia de padre construyendo un “parent sintético”, pero es una excepción, no la regla general.
- Las vistas públicas y parte del Explore usan nombre y metadatos del padre como fallback o fuente principal.

## Flujo de display actual resumido

### Organizador

- Lista de sociales: query sobre `events_parent`.
- Lista de fechas: query sobre `events_date`, a veces filtrada por `parent_id`, a veces por `organizer_id`, a veces con join anidado a `events_parent`.

### Público

- Explore: consume `events_date` con join a `events_parent` o vistas derivadas.
- Detalle de fecha: carga `events_date` y además datos del padre para enriquecer el render.
- Página del social: depende 100% de `events_parent.id`.

## Conclusión

### ¿Es viable eliminar el padre sin romper el display?

No, no en el estado actual.

Hoy el cambio **no es seguro** porque:

- existen URLs públicas basadas en `events_parent.id`;
- varias pantallas públicas todavía esperan un padre real;
- el flujo del organizador sigue agrupando fechas por padre;
- la recurrencia principal (`ensure_weekly_occurrences`) sigue centrada en `parent_id`;
- hooks como `useMyRSVPs` y `DateLiveScreen` asumen que existe padre;
- parte del Explore y de los detalles usa campos del padre para renderizar.

### ¿Qué campos del padre habría que migrar a `events_date` si se quisiera avanzar?

Como mínimo:

- `nombre`
- `descripcion`
- `biografia`
- `estilos`
- `ritmos_seleccionados`
- `zonas`
- `media`
- `sede_general`
- `faq`
- posiblemente `ubicaciones`

Además habría que resolver:

- compatibilidad de rutas `/social/:parentId`;
- ratings en `event_parent_ratings`;
- recurrencia y materialización futura;
- joins, vistas y selects que hoy leen `events_parent`.

### Clasificación final

La realidad actual cae principalmente en **C**, con parte de **B**:

- **C**: el padre es referenciado en URLs públicas (`/social/:parentId`, `/events/parent/:id`) y en pantallas públicas. Eliminarlo rompería navegación y contenido ya publicado.
- **B**: el padre también tiene datos propios reales (`nombre`, `descripcion`, `biografia`, `estilos`, `zonas`, `media`, `faq`, `sede_general`), no es solo un contenedor vacío.

No cae en A.

### Recomendación técnica

Si el objetivo de producto es “que el organizador no piense en el padre”, el cambio correcto hoy no es eliminar `events_parent` de la base, sino:

1. ocultarlo del flujo de creación del organizador;
2. crear o reutilizarlo automáticamente por detrás;
3. mover gradualmente al nivel fecha solo los campos que realmente deban ser independientes;
4. mantener compatibilidad de URLs y de display público mientras se migra.

Eliminar `events_parent` de forma total requeriría una migración amplia de datos, rutas, vistas, hooks, ratings, recurrencia y SEO, con riesgo alto de regresión.
