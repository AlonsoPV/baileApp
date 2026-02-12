# RSVP Flow Map – Eventos (específicos, frecuentes, recurrentes)

## 1. Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `apps/web/src/hooks/useRSVP.ts` | Hooks de RSVP: `useEventRSVP`, `useUserRSVP`, `useUpdateRSVP`, `useRemoveRSVP`, `useUserRSVPEvents` |
| `apps/web/src/hooks/useMyRSVPs.ts` | Hook alternativo para "Mis RSVPs" (filtro por fechas futuras en query) |
| `apps/web/src/components/rsvp/RSVPButtons.tsx` | Botón "Me interesa" / toggle RSVP |
| `apps/web/src/components/SimpleInterestButton.tsx` | Botón simplificado para cards de eventos |
| `apps/web/src/components/RSVPButton.tsx` | Botón RSVP con estados voy/interesado/no_voy |
| `apps/web/src/screens/events/EventDatePublicScreen.tsx` | Pantalla detalle de evento (fecha) – dispara RSVP |
| `apps/web/src/screens/events/DateLiveScreen.tsx` | Pantalla live detalle – RSVP |
| `apps/web/src/screens/events/DateLiveScreenModern.tsx` | Pantalla live detalle – RSVP |
| `apps/web/src/screens/events/EventPublicScreen.tsx` | Pantalla pública evento – SimpleInterestButton |
| `apps/web/src/screens/events/MyRSVPsScreen.tsx` | Pantalla "Mis RSVPs" (`/me/rsvps`) |
| `apps/web/src/screens/profile/UserProfileLive.tsx` | Perfil propio – sección "Eventos de Interés" |
| `apps/web/src/screens/profile/UserPublicScreen.tsx` | Perfil público – sección "Eventos de Interés" |
| `apps/web/src/screens/profile/UserProfileEditor.tsx` | Enlace a Mis RSVPs |
| `supabase/migrations/2025xxxx_rsvp.sql` | Tabla `event_rsvp`, RPCs RSVP |
| `supabase/migrations/20250127_update_rsvp_stats_by_date.sql` | `get_event_rsvp_stats` filtra por fecha futura |

---

## 2. Secuencia de llamadas

### 2.1 Disparo del RSVP (toggle "Me interesa")

1. Usuario en **EventDatePublicScreen** o **DateLiveScreen** / **DateLiveScreenModern** hace clic en "Me interesa".
2. `RSVPButtons` llama `onStatusChange(isInterested ? null : 'interesado')`.
3. `useEventRSVP(dateId).toggleInterested()` → `handleRSVP(status)`:
   - Si `status === null` → `removeRSVP.mutateAsync(eventDateId)` → RPC `delete_event_rsvp(p_event_date_id)`.
   - Si `status === 'interesado'` → `updateRSVP.mutateAsync({ eventDateId, status })` → RPC `upsert_event_rsvp(p_event_date_id, p_status)`.
4. En `onSuccess` de la mutación: invalidación de React Query:
   - `["rsvp"]` (todos los prefijos)
   - `["rsvp", "user", eventDateId]`, `["rsvp", "stats", eventDateId]`
   - `["rsvp", "user-events"]`, `["events", "with-rsvp"]`, `["events", "live"]`
   - `["event", "date", eventDateId]`, `["event", "parent"]`

### 2.2 Lectura para perfil / Mis RSVPs

| Pantalla | Hook/Query | QueryKey | Filtro de fecha |
|----------|------------|----------|------------------|
| **MyRSVPsScreen** | `useUserRSVPEvents()` | `["rsvp", "user-events", status]` | Cliente: `isAvailableEventDate` |
| **UserProfileLive** | `useUserRSVPEvents('interesado')` | `["rsvp", "user-events", "interesado"]` | Cliente: `isAvailableEventDate` |
| **UserPublicScreen** | `useQuery(['user-rsvps', userId])` | `['user-rsvps', userId]` | Cliente: `isAvailableEventDate` |

**Nota:** `UserPublicScreen` usa la query `['user-rsvps', userId]`, que ahora **sí** se invalida al hacer RSVP (`queryClient.invalidateQueries({ queryKey: ["user-rsvps"] })`). Requiere la política RLS `rsvp_select_public` para leer RSVPs de otros usuarios (perfil público).

---

## 3. Esquema de datos

### 3.1 Tablas

| Tabla | Rol |
|-------|-----|
| `events_parent` | Evento "padre" (nombre, descripción, estilos, sede, etc.). |
| `events_date` | Instancia/fecha concreta (fecha, hora, lugar, ciudad, flyer, `parent_id`, `dia_semana`). |
| `event_rsvp` | RSVP del usuario a una fecha concreta. |

### 3.2 `event_rsvp`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid | PK |
| `event_date_id` | bigint | FK → `events_date.id` |
| `user_id` | uuid | FK → `auth.users.id` |
| `status` | text | `'interesado'` (único valor permitido) |
| `created_at` | timestamptz | DEFAULT now() |
| UNIQUE | (event_date_id, user_id) | Evita duplicados |

### 3.3 `events_date` (campos clave para RSVP)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | bigint | PK |
| `parent_id` | bigint | FK → `events_parent.id` |
| `fecha` | date | Fecha de la instancia (YYYY-MM-DD). |
| `hora_inicio` | time | Hora de inicio |
| `dia_semana` | int | 0–6 (domingo–sábado). NULL = fecha específica; NOT NULL = recurrente semanal. |

---

## 4. Modelo de eventos (específico vs frecuente vs recurrente)

Según `PROCESO_EVENTOS_FECHAS.md`:

- **Específico:** una fila en `events_date` con `fecha = YYYY-MM-DD`, `dia_semana = NULL`.
- **Recurrente:** N filas en `events_date` (pre-generadas, separadas por 7 días). Cada fila tiene `fecha` concreta y opcionalmente `dia_semana`.
- **Frecuente:** múltiples instancias similares; mismo modelo que específico (varias filas en `events_date`).

**RSVP es siempre por instancia:** `event_rsvp.event_date_id` apunta a una fila concreta de `events_date`. No hay RSVP a nivel "padre".

---

## 5. Regla "quitar del perfil al pasar la fecha"

### Opción implementada: filtrado al leer (cliente)

- Los RSVP **no** se borran de la DB al pasar la fecha.
- El filtrado ocurre en cliente con `isAvailableEventDate(evento)`:

```ts
// Lógica (MyRSVPsScreen, UserProfileLive, UserPublicScreen)
// 1) Si tiene fecha: verificar fecha >= today (incluye recurrentes con fecha)
if (evento.fecha) return parseDate(evento.fecha) >= today;
// 2) Sin fecha pero dia_semana: slot recurrente sin fecha específica - mantener visible
if (typeof evento.dia_semana === 'number') return true;
return false;
```

### Variantes por pantalla

| Pantalla | Criterio `isAvailableEventDate` |
|----------|--------------------------------|
| MyRSVPsScreen, UserProfileLive | `dia_semana` → true; `fecha >= today` en resto |
| UserPublicScreen | Igual |
| useMyRSVPs | Filtro en query: `fd > today` (no incluye hoy) |

### En servidor (RPC `get_event_rsvp_stats`)

- Cuenta solo RSVPs cuya `fecha` del evento sea futura (con timezone `America/Mexico_City`).
- Si la fecha ya pasó, devuelve 0 para el contador (los registros siguen en DB).

---

## 6. Invalidación de caché

| Acción | Queries invalidadas |
|--------|----------------------|
| RSVP ON/OFF (useUpdateRSVP, useRemoveRSVP) | `["rsvp"]`, `["rsvp", "user", dateId]`, `["rsvp", "stats", dateId]`, `["rsvp", "user-events"]`, `["events", "with-rsvp"]`, `["events", "live"]`, `["event", "date", dateId]`, `["event", "parent"]` |
| RSVP ON/OFF | También `["user-rsvps"]` (perfil público UserPublicScreen) |

---

## 7. Rutas relevantes

| Ruta | Pantalla | RSVP |
|------|----------|------|
| `/social/fecha/:dateId` | EventDatePublicScreen | RSVP ON/OFF |
| `/me/rsvps` | MyRSVPsScreen | Lista RSVPs |
| `/profile/user` | UserProfileLive | Eventos de Interés |
| `/u/:id` | UserPublicScreen | Eventos de Interés (perfil público) |
