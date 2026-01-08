# Proceso de creación y edición de eventos (fechas específicas y “recurrentes”)

Este documento aterriza el flujo **actual** del proyecto para crear/editar eventos en la web, y cómo hacerlo de forma eficiente cuando necesitas cargar **10+ fechas** seguidas.

> Para el roadmap de optimización (wizard, tabla bulk, flyers en cola, idempotencia, etc.) ver: `OPTIMIZACION_EVENTOS_BULK.md`.

---

## Modelo actual (cómo se guarda en BD)

En la app, un “evento” se divide en 2 niveles:

- **`events_parent` (Evento padre)**: la “marca” del evento (nombre, descripción, estilos/ritmos del evento, sede general, etc.).
- **`events_date` (Fecha/edición)**: cada ocurrencia del evento (fecha, hora, lugar, ciudad, requisitos, `flyer_url`, `estado_publicacion`, etc.).

### “Fecha específica”
Una fecha específica es **una fila** en `events_date` con `fecha = YYYY-MM-DD`.

### “Recurrente” (semanal) en este proyecto
La recurrencia semanal se implementa como **N filas** en `events_date`, separadas por 7 días, creadas en batch.

> Importante: hoy “recurrente” = **pre-generar fechas** (no es una regla tipo RRULE que se calcula en runtime).

---

## Dónde se hace en el front (pantallas principales)

### Crear evento (flujo simple)
- Pantalla: `apps/web/src/screens/events/EventCreateScreen.tsx`
- UI: `apps/web/src/components/events/EventForm.tsx`
- Flyer: `apps/web/src/components/events/DateFlyerUploader.tsx`

Flujo:
1) **Guardar evento (padre)** → crea `events_parent`
2) **Guardar edición/fecha** → crea `events_date` (incluye `flyer_url`, zonas, estilos, etc.)
3) Finalizar y navegar a la vista correspondiente

### Editar evento (padre + fecha)
- Pantalla: `apps/web/src/screens/events/EventEditScreen.tsx`

Permite:
- **Guardar evento (padre)** → update a `events_parent`
- **Guardar edición/fecha** → update a `events_date`

### Editar/crear una fecha (pantalla dedicada)
- Pantalla: `apps/web/src/screens/events/EventDateEditScreen.tsx`

Útil para:
- Editar solo una fecha existente
- Crear una nueva fecha (cuando vienes con `parentId`)
- Gestionar flyer, horario (cronograma) y precios

### Crear muchas fechas (flujo optimizado)

Este flujo vive dentro del editor de organizador (perfil de organizador) y está pensado para ahorrar tiempo.

- Pantalla: `apps/web/src/screens/profile/OrganizerProfileEditor.tsx`
- Comportamiento: puede crear **1 fecha** o **N fechas semanales** en una sola operación (batch insert).

**Cómo funciona la recurrencia semanal aquí**
- Hay un flag UI tipo `repetir_semanal`
- Hay un campo `semanas_repetir` (ej. 4, 10, 20…)
- Al guardar, el front genera un arreglo con fechas separadas por 7 días y lo inserta en batch.

---

## Proceso recomendado: evento de fecha específica (rápido y seguro)

### 1) Crea el evento padre (1 sola vez)
1. Ve a “Crear evento”.
2. Llena:
   - Nombre (obligatorio)
   - Descripción (opcional)
   - Sede general (opcional)
   - Ritmos/estilos (recomendado)
3. Click **Guardar evento**

**Qué se guarda**
- Se crea una fila en `events_parent`.

### 2) Crea la fecha (edición)
1. Llena:
   - `fecha` (obligatorio)
   - `hora_inicio`, `hora_fin` (recomendado)
   - `lugar`, `ciudad`, `direccion`, `requisitos` (según aplique)
   - Zonas (si aplica)
2. (Opcional) Sube flyer
3. Elige `estado_publicacion`:
   - `borrador`: no se muestra en explore público
   - `publicado`: visible para todos
4. Click **Guardar edición**

**Qué se guarda**
- Se crea una fila en `events_date`.
- Se guarda `flyer_url` si subiste un flyer.

---

## Proceso recomendado: evento “recurrente” semanal (10+ fechas rápido)

Objetivo: crear 10+ fechas con el mínimo de clics y sin repetir trabajo.

### Preparación (para ahorrar tiempo)
- **Define el patrón**:
  - Día y hora (ej. todos los sábados 21:00)
  - Lugar fijo (si aplica)
  - Zonas fijas
- **Flyer**:
  - Si el flyer es el mismo para todas las fechas, úsalo como plantilla.
  - Si cambia cada semana, prepara los 10 flyers renombrados (ej. `2026-02-01.jpg`, `2026-02-08.jpg`, …).
- **Tamaño recomendado**:
  - 1080×1350 (4:5)
  - Ideal < 1–2MB por imagen (para subir rápido)

### Opción A (más rápida): crear N fechas en batch (semanas)
1. En el editor de organizador, abre el formulario de crear fecha.
2. Llena todos los campos “comunes” (lugar, ciudad, requisitos, zonas, etc.).
3. Activa **repetir semanal**.
4. Pon **semanas_repetir = 10** (o más).
5. Guarda.

**Resultado**
- Se crean 10 filas en `events_date` en **una sola operación**.

**Tiempo típico**
- Captura de datos: 1–2 min
- Guardado batch: segundos a decenas de segundos (depende de red)

### Opción B: duplicar una fecha y ajustar solo lo necesario
Útil cuando:
- No es estrictamente semanal, o
- Cada fecha tiene ligeras variaciones (DJs, requisitos, etc.)

Flujo sugerido:
1. Crea la primera fecha completa.
2. Usa “duplicar” (si está disponible en el editor del organizador) para clonar la fecha.
3. Solo cambia:
   - `fecha`
   - (opcional) flyer
   - (opcional) campos variables

---

## Upload de flyer: qué esperar (tiempos y mejores prácticas)

El flyer se sube al bucket `media` vía Supabase Storage, y la URL se guarda en `flyer_url`.

Mejoras ya aplicadas en el proyecto:
- Se hace resize/compresión antes de subir (para reducir MB).
- Se usa `getSession()` (evita request extra de auth).
- El resize usa `ObjectURL` (más rápido y con menos memoria que base64).

**Consejos para que sea rápido cuando subes 10 flyers**
- Evita PNGs enormes: usa JPG/WebP.
- Mantén el tamaño cerca de 1080px de ancho.
- Si tu red es lenta, primero crea todas las fechas (batch) y luego sube flyers en edición (para no “bloquear” la creación).

---

## Edición posterior (cuando ya publicaste)

### Editar solo una fecha
- Usa `EventDateEditScreen` (más directo).
- Cambios típicos:
  - Ajustar flyer
  - Cambiar hora/lugar
  - Cambiar `estado_publicacion`

### Editar el evento padre
- Cambia nombre, descripción, estilos del evento una sola vez.
- Esto no duplica fechas, solo ajusta el “contenedor” del evento.

---

## Checklist para crear 10+ fechas en el menor tiempo

- **1**: Crea el evento padre una sola vez.
- **2**: Define campos comunes (lugar/ciudad/zonas).
- **3**: Usa “repetir semanal” con `semanas_repetir=10` para batch.
- **4**: Publica solo cuando estés listo (primero `borrador`, luego `publicado`).
- **5**: Sube flyers:
  - Si es el mismo: reutiliza.
  - Si son distintos: sube después, en edición, para no frenar el batch.

