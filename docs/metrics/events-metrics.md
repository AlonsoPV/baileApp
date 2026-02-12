# Métricas de eventos por fecha y por instancia

## 1. Implementación actual

### 1.1 Endpoint / Hook

| Componente | Ubicación | Rol |
|------------|-----------|-----|
| Hook | `apps/web/src/hooks/useOrganizerEventMetrics.ts` | Consulta métricas de eventos por organizador |
| Panel UI | `apps/web/src/components/profile/OrganizerEventMetricsPanel.tsx` | Muestra métricas en perfil del organizador |
| RPC (stats por instancia) | `get_event_rsvp_stats(event_id)` | Cuenta RSVPs por `event_date_id` |

### 1.2 Inputs actuales

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `organizerId` | number | ID del organizador |
| `filters.dateFilter` | `"today" \| "this_week" \| "this_month" \| "all" \| "custom"` | Rango de fechas |
| `filters.from` | string (YYYY-MM-DD) | Fecha inicio (cuando `custom`) |
| `filters.to` | string (YYYY-MM-DD) | Fecha fin (cuando `custom`) |

### 1.3 Output actual

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `global` | GlobalFechaMetrics | Totales agregados (totalRsvps, porRol, zonas, ritmos, totalPurchases) |
| `porFecha` | FechaMetric[] | Métricas por instancia (event_date_id) |
| `byDate` | EventDateSummary[] | Resumen por instancia (eventDateId, totalRsvps, byRole, reservations) |
| `perRSVP` | EventRSVPMetric[] | Lista detallada de cada RSVP |

### 1.4 Fix aplicado: fuente de fecha

**Antes:** El filtro se aplicaba a `event_rsvp.created_at` (cuándo se hizo el RSVP).  
**Ahora:** Se filtra por `events_date.fecha` (cuándo ocurre el evento). Se obtienen solo instancias cuya `fecha` está en el rango; luego se consultan RSVPs/purchases para esas instancias (sin filtrar por created_at).

---

## 2. Unidad métrica: instancia del evento

### 2.1 Modelo actual (ya correcto)

| Tabla | Rol | Llave única |
|-------|-----|-------------|
| `events_parent` | Evento "padre" (nombre, estilos, sede) | `id` |
| `events_date` | **Instancia / ocurrencia** (cada fila = una fecha concreta) | `id` |
| `event_rsvp` | RSVP por instancia | `event_date_id` → `events_date.id` |

**`events_date.id` = instance_id.** No existe tabla `event_instances` separada; `events_date` es la tabla de instancias.

### 2.2 Atribución por ocurrencia

- `event_rsvp.event_date_id` apunta a `events_date.id`.
- Cada RSVP está correctamente atribuido a una instancia.
- Evento recurrente = N filas en `events_date`; cada una tiene métricas independientes.

---

## 3. Fuente de verdad para "fecha del evento"

| Campo | Tabla | Descripción |
|-------|-------|-------------|
| `fecha` | events_date | Fecha de la ocurrencia (YYYY-MM-DD, date) |
| `hora_inicio` | events_date | Hora de inicio (time) |

**`event_start_at`** (timestamp):
- Si `hora_inicio` existe: `(fecha::text || ' ' || hora_inicio::text)::timestamp`
- Si no: `fecha::timestamp` (medianoche)

**Timezone:** Ideal usar UTC en DB y convertir con `America/Mexico_City` para "día local" si aplica.

---

## 4. Modos de consulta

### Modo A — Rango por fecha del evento (agregado por día)

| Input | Tipo | Obligatorio |
|-------|------|-------------|
| `date_from` | YYYY-MM-DD | Sí |
| `date_to` | YYYY-MM-DD | Sí |
| `rol?` | string | No |
| `zonaId?` | number | No |
| `ritmoId?` | number | No |

**Output:**
- `series`: métricas agregadas por día `{ date, rsvps, purchases }[]`
- `totals`: suma total en el rango

### Modo B — Fecha específica (detalle por instancia)

| Input | Tipo | Obligatorio |
|-------|------|-------------|
| `event_date` | YYYY-MM-DD | Sí |
| `rol?`, `zonaId?`, `ritmoId?` | - | No |

**Output:**
- `date`: "2026-02-12"
- `items`: Array de instancias que ocurren ese día, cada una con métricas:
  - `event_id` (parent_id)
  - `instance_id` (events_date.id)
  - `start_at`, `title`, `zonaId`, `ritmoId`, etc.
  - `metrics: { rsvps, purchases, ... }`

---

## 5. Regla de inclusión por fecha

Para `event_date = YYYY-MM-DD`:
- Incluir instancias donde `events_date.fecha = event_date`
- O, si se usa timestamp: `start_at >= YYYY-MM-DD 00:00:00` y `< YYYY-MM-DD+1 00:00:00`

Para rango `[date_from, date_to]`:
- Incluir instancias donde `events_date.fecha >= date_from` y `<= date_to`

---

## 6. Tracking actual (sin gaps)

| Dato | Tabla | Atribución |
|------|-------|------------|
| RSVP | event_rsvp | `event_date_id` (por instancia) |
| Compras (pagado) | event_rsvp | `event_date_id` |
| Views / Clicks | No existe tabla específica | - |

RSVP y compras ya tienen atribución correcta por instancia.

---

## 7. Cambios aplicados

1. **useOrganizerEventMetrics:** Se filtra `events_date` por `fecha` en el rango; RSVP y purchases se consultan sin filtrar por `created_at`.
2. **Modo A:** Se expone `series: SeriesDay[]` (agregado por `date(events_date.fecha)`).
3. **Modo B:** Se expone `items: EventDateSummary[]` cuando `date_from === date_to` (fecha específica).
4. **Filtros rol/zona/ritmo:** Pendiente (opcional); la salida ya agrupa por rol y zona desde perfiles.

---

## 8. Validaciones recomendadas

| Caso | Modo B (event_date=2026-02-12) | Modo A (rango) |
|------|-------------------------------|----------------|
| Evento específico (1 instancia) 15/Feb | 1 item | Día 15/Feb con métricas de esa instancia |
| Evento recurrente (ocurrencias 12/Feb y 19/Feb) | 1 item (la del 12/Feb) | Días 12 y 19 con métricas independientes |
| Evento frecuente (2 instancias el 12/Feb) | 2 items | Día 12/Feb con suma de ambas instancias |
| RSVP a instancia A NO suma en instancia B | Cada item tiene métricas independientes | Serie diaria suma correcta por día |
