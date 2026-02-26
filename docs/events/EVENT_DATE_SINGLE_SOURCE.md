## Objetivo

Garantizar que **EventCard (ExploreHomeScreenModern)** y **EventDatePublicScreen (detalle)** muestren la **misma fecha** 1:1 y que la navegación use siempre un `events_date.id` real.

Este documento resume:

- Cómo se infiere el “tipo” hoy (específico/frecuente/recurrente).
- Cuál es la **fuente única de verdad** para la fecha que se muestra.
- Cómo correr el **checker** y cuándo se requiere **backfill/migración**.

---

## A) Diagnóstico: inventario de “fuentes de verdad”

### ¿Cómo se infiere el tipo?

En el código actual la inferencia es principalmente por campos:

- **Específico / Frecuente**: `events_date.fecha` presente (y `dia_semana` normalmente null).
- **Recurrente semanal (legacy)**: `events_date.dia_semana` presente **y** `events_date.fecha` puede venir vacía/null.

**Importante**: `dia_semana != null` por sí solo NO debe implicar “expandir ocurrencias” en frontend.

### Puntos donde se resolvía/calculaba fecha

- **Explore**: `apps/web/src/hooks/useExploreQuery.ts`
  - Antes: fabricaba 4 ocurrencias y generaba IDs string tipo `"123_1"`.
  - Ahora: NO fabrica IDs; **solo** calcula “next occurrence” si `fecha` está vacía (fallback legacy).

- **Cards**: `apps/web/src/components/explore/cards/EventCard.tsx`
  - Usa `resolveEventDateYmd(item)` y navega con un `id` numérico real.

- **Detalle**: `apps/web/src/screens/events/EventDatePublicScreen.tsx`
  - Usa `resolveEventDateYmd(date)` para:
    - header (`formatHeaderDate`)
    - SEO (`formattedDate`)
    - calendario (`calendarStart/calendarEnd`)

- **Formateo**:
  - `formatHeaderDate` (`apps/web/src/components/events/EventDetail/helpers.ts`) **solo formatea**, no resuelve recurrencia.
  - `fmtDate` (`apps/web/src/utils/format.ts`) solo formatea.

---

## B) Regla única de fecha (Single Source of Truth)

Helper único:

- `apps/web/src/utils/eventDateDisplay.ts`
  - `resolveEventDateYmd(eventOrDate): string | null`

Reglas:

1) **Si existe `fecha` válida** (ISO o `YYYY-MM-DD`) ⇒ **usar esa siempre**.
2) **Solo si `fecha` NO existe**:
   - si `dia_semana` existe ⇒ calcular próxima ocurrencia (solo display) y devolver `YYYY-MM-DD`.
3) **Nunca recalcular por `dia_semana` si `fecha` existe**.

Uso:

- **EventCard**: usa `resolveEventDateYmd(item)` para el tag de fecha.
- **EventDatePublicScreen**: usa `resolveEventDateYmd(date)` para header/SEO/calendario.

---

## C) Checker / diagnóstico de inconsistencias

Utilidad:

- `apps/web/src/utils/eventDateConsistency.ts`

Qué detecta (por `parent_id`):

- **rows sin fecha** (`missing_fecha`)
- **fechas duplicadas** por parent (`duplicate_fecha`)
- **mismatch** entre `dia_semana` y el weekday real de `fecha` (`weekday_mismatch`)
- **fecha inválida** (`invalid_fecha`)

### Cómo verlo rápido (DEV)

En `OrganizerDashboardDates` (por parent):

- `apps/web/src/screens/profile/OrganizerDashboardDates.tsx`
- En modo DEV, si hay issues, muestra una tarjeta “Auditoría (DEV)”.

Para auditoría masiva (todos los parents del organizador):

- Usar `auditEventDatesByParent(dates)` con una lista de `events_date` (ej. proveniente de `useEventDatesByOrganizer` o `useEventDatesBulk`) y renderizar/loguear el resultado.

---

## D) Pregunta clave: ¿el arreglo se ve en eventos ya creados?

### Opción 1: Fix solo frontend (se ve inmediatamente)

Aplica si **los eventos ya creados ya tienen `events_date.fecha` confiable** por ocurrencia.

En ese caso:

- `resolveEventDateYmd` + uso consistente en card/detalle
  - ✅ arregla al instante sin tocar DB.

### Opción 2: Se requiere backfill/migración

Se requiere si el checker detecta:

- `events_date.fecha` **null/vacía** en rows que deberían ser ocurrencias reales
- `events_date.fecha` **duplicada** entre múltiples rows del mismo `parent_id`
- `dia_semana` no coincide con el weekday de `fecha`

Motivo:

- El frontend no puede “inventar” una fecha histórica/específica para un `events_date.id` si la DB no la tiene.

Recomendación:

- Backfill que asegure que **cada ocurrencia** tenga:
  - `id` distinto
  - `parent_id` igual
  - `fecha` real (YYYY-MM-DD)
  - opcional: `dia_semana` (si se conserva, el frontend NO debe depender de él para expandir)

### Índice/constraint para evitar duplicados

- **Recomendado**: índice único por `(parent_id, fecha)` para evitar duplicar ocurrencias.
- En esta rama la migración lo crea **solo si no hay duplicados existentes**; si tu BD ya tiene duplicados, primero corre un cleanup/backfill y después aplica el índice.

---

## E) Criterios de aceptación (operativos)

- Abrir un evento desde Explore: **card y detalle muestran la misma fecha**.
- “Hoy” muestra eventos aunque ya haya pasado su hora de inicio (regla por día, no por hora).
- Recurrentes: cada ocurrencia conserva **su `events_date.id` y su `fecha` real**.

