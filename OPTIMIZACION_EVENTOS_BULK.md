# Versión optimizada (accionable) — Bulk Events v1

## Objetivo

Reducir el tiempo de creación/edición de **10+ fechas** de ~10–20 min a **2–5 min**, evitando duplicados, bloqueos por flyers y errores silenciosos.

---

## Principios

- **Batch ≠ Upload** (nunca bloquear guardado por flyers)
- **Todo nace en borrador** (publicación es un paso aparte)
- **Errores por fila** (no “algo falló”)
- **Idempotencia** (doble click ≠ duplicar)

---

## Fase 1 — Quick wins (sin tocar back) ✅ (máximo impacto)

### 1) Tabla tipo “sheet” dentro de `OrganizerProfileEditor`

**Qué se construye**
- “Template común” arriba (aplica a todas)
- Tabla de filas con variaciones: `fecha`, `hora_inicio`, `hora_fin`, `flyer`, `estado`, `notas`

**Criterios de aceptación**
- Crear **10 fechas** en una sola pantalla sin navegación
- Editar inline una fila sin re-render de toda la tabla (performance)

**Riesgo**
- Performance en tablas grandes

**Mitigación**
- Row memoizada + estado por fila + “commit” al guardar

**Pantallas/archivos impactados**
- `apps/web/src/screens/profile/OrganizerProfileEditor.tsx`

---

### 2) Batch create siempre, con flyers desacoplados

**Regla**
El botón “Guardar fechas” solo hace **insert batch** de `events_date[]` con `flyer_url = null`.

**Qué se agrega**
- Panel “Flyers pendientes” (por parent)
- Estado por fila: `PENDING | UPLOADING | DONE | ERROR`

**Criterios de aceptación**
- El batch no tarda por uploads
- Se puede subir flyers después sin perder el trabajo

**Pantallas/archivos impactados**
- `apps/web/src/screens/profile/OrganizerProfileEditor.tsx`
- (uploader existente) `apps/web/src/components/events/DateFlyerUploader.tsx`

---

### 3) Publicación por lotes

**Qué se agrega**
- “Publicar todas” / “Publicar seleccionadas”
- Toggle por fila

**Criterios de aceptación**
- 10 fechas pasan de borrador a publicado en 1 click
- Filtro “ver solo borradores”

---

### 4) Vista previa antes de guardar (preview)

**Qué se agrega**
- Antes del batch: “Se crearán N fechas”
- Summary (primera/última, días, horas, lugar)

**Criterios de aceptación**
- Evitar crear 10 fechas equivocadas por un patrón mal configurado

---

### 5) Validación front “por fila”

**Reglas mínimas**
- `fecha` requerida
- `hora_inicio < hora_fin`
- campos requeridos si `estado_publicacion = publicado`
- timezone consistente (si se usa)

**Salida**
- `errors[{rowId, field, message}]` pintado en la tabla

---

## Fase 2 — Hardening (back ligero) 🧱

### 6) Constraint anti-duplicado en BD

**Recomendación**
- Unique `(parent_id, starts_at)` o `(parent_id, fecha, hora_inicio)`

**Criterio**
- Reintentar “guardar” no duplica

---

### 7) Idempotencia para batch

**Recomendación**
- `idempotency_key` por operación batch (cliente genera UUID)

**Criterio**
- Double click / refresh no duplica fechas

---

### 8) Respuesta con reporte por fila

En insert batch:
- `created: [{rowId, dateId}]`
- `errors: [{rowId, field, message}]`

**Criterio**
- Si 2 filas fallan, se crean 8 y se reportan 2 con precisión
  - (o si prefieres all-or-nothing, que sea explícito)

---

## Fase 3 — Escala (modelo) 🚀

### 9) Guardar `recurrence_rule` además de pre-generar

**Qué habilita**
- “Extender 10 semanas más”
- “Regenerar con nuevo patrón”

**Criterio**
- Botón “Extender” genera nuevas fechas sin re-llenar template

---

### 10) `starts_at`/`ends_at` UTC + timezone

**Criterio**
- Sin bugs por DST o por usuario con TZ distinta

---

### 11) Venues reutilizables

**Criterio**
- Crear evento con venue común toma segundos (autofill)

---

## Scope v1 (para no dispersarse)

**Dentro de scope v1**
- Sheet bulk + template + preview
- Guardar batch sin flyers
- Panel flyers pendientes
- Publish bulk
- Validación por fila

**Fuera de scope v1**
- RRULE completa (más allá de guardar/“extender”)
- venues
- background processing

---

## Métricas (para medir éxito)

- Tiempo promedio para crear 10 fechas
- Tasa de error (uploads fallidos / duplicados)
- % de fechas publicadas correctamente en primer intento

---

## Recomendaciones prácticas (quick wins que valen oro)

### A) “Modo borrador forzado” en bulk
- En bulk, por default: todas las fechas nacen como borrador
- Publicar es un paso separado

### B) “Aplicar cambios comunes” después
- Botón: “Aplicar a todas”
  - lugar/ciudad/zonas
  - requisitos
  - hora (si cambió)

### C) “Pegar lista de fechas” como super poder
Input multiline:
```
2026-02-01 21:00
2026-02-08 21:00
2026-02-15 21:00
```
Genera filas automáticamente.

---

## Para pasar de doc → código (lo siguiente)

Si la intención es revisar/optimizar **código real**, el archivo principal a intervenir suele ser:
- `apps/web/src/screens/profile/OrganizerProfileEditor.tsx`

Con ese archivo, la implementación típica se separa en:
- `useEventBulkPlanner()`
- `generateOccurrences()`
- `bulkCreateEventDates()`
- `uploadFlyerQueue(concurrency=3..5)`
