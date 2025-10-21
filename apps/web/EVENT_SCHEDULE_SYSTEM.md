# 🎉 Sistema de Eventos con Cronograma, Costos y Calendario

## 📋 Resumen

Se ha implementado un sistema completo para gestionar eventos con:
- **Cronograma detallado** por hora
- **Costos dinámicos** y promociones
- **Botón "Agregar a calendario"** para descargar archivos .ics

## 🗄️ Base de Datos

### Tablas Creadas

#### `event_schedules` - Cronograma de Actividades
```sql
- id: BIGINT (PK, auto-increment)
- event_date_id: BIGINT (FK a events_date)
- tipo: TEXT ('clase', 'show', 'social', 'otro')
- titulo: TEXT (nombre de la actividad)
- descripcion: TEXT (descripción opcional)
- hora_inicio: TIME (hora de inicio)
- hora_fin: TIME (hora de fin, opcional)
- ritmo: BIGINT (FK a tag ritmo, opcional)
- created_at: TIMESTAMPTZ
```

#### `event_prices` - Costos y Promociones
```sql
- id: BIGINT (PK, auto-increment)
- event_date_id: BIGINT (FK a events_date)
- tipo: TEXT ('preventa', 'taquilla', 'promo')
- nombre: TEXT (nombre del precio)
- monto: NUMERIC(10,2) (precio en MXN)
- descripcion: TEXT (descripción opcional)
- hora_inicio: TIME (hora de inicio del precio, opcional)
- hora_fin: TIME (hora de fin del precio, opcional)
- descuento: NUMERIC(5,2) (descuento en %, opcional)
- created_at: TIMESTAMPTZ
```

### Políticas RLS
- **Lectura**: Todos pueden ver cronograma y precios
- **Edición**: Solo el organizador dueño del evento puede editar

## 🔧 Hooks de Datos

### `useEventSchedules(eventDateId)`
```typescript
const { data, upsert, remove, isLoading } = useEventSchedules(eventDateId);
```

**Funciones:**
- `data`: Lista de actividades del evento
- `upsert(payload)`: Crear/actualizar actividad
- `remove(id)`: Eliminar actividad
- `isLoading`: Estado de carga

### `useEventPrices(eventDateId)`
```typescript
const { data, upsert, remove, isLoading } = useEventPrices(eventDateId);
```

**Funciones:**
- `data`: Lista de precios del evento
- `upsert(payload)`: Crear/actualizar precio
- `remove(id)`: Eliminar precio
- `isLoading`: Estado de carga

## 🎨 Componentes UI

### `EventScheduleEditor`
Editor para gestionar el cronograma de actividades:
- Lista de actividades existentes
- Formulario para agregar nuevas actividades
- Selector de tipo (clase, show, social, otro)
- Campos de hora de inicio y fin
- Botón de eliminar para cada actividad

### `EventPriceEditor`
Editor para gestionar costos y promociones:
- Lista de precios existentes
- Formulario para agregar nuevos precios
- Selector de tipo (preventa, taquilla, promo)
- Campo de monto en MXN
- Soporte para descuentos
- Formato de moneda mexicana

### `AddToCalendarButton`
Botón para descargar evento como archivo .ics:
- Genera archivo compatible con Google Calendar, Outlook, Apple Calendar
- Incluye título, descripción, fecha, hora, lugar
- Descarga automática del archivo
- Diseño atractivo con gradiente

## 📱 Integración en Pantallas

### `EventDateEditScreen`
Los componentes se integran automáticamente:
- **Solo para eventos existentes** (no en modo creación)
- Se muestran después de los datos básicos del evento
- Antes del botón de guardar
- Condicionales basados en `!isNew && id`

## 🚀 Cómo Usar

### 1. Ejecutar Script SQL
```sql
-- Ejecutar en Supabase SQL Editor
-- Contenido de: SCRIPT_6_EVENT_SCHEDULES_PRICES.sql
```

### 2. Crear un Evento
1. Ve a `/profile/organizer/edit`
2. Crea un nuevo evento padre
3. Crea una fecha para ese evento
4. Edita la fecha creada

### 3. Configurar Cronograma
1. En la pantalla de edición de fecha
2. Sección "📅 Cronograma del Evento"
3. Selecciona tipo de actividad
4. Ingresa título y horarios
5. Agrega múltiples actividades

### 4. Configurar Precios
1. Sección "💰 Costos y Promociones"
2. Selecciona tipo de precio
3. Ingresa nombre y monto
4. Configura promociones y descuentos

### 5. Agregar a Calendario
1. Botón "📅 Agregar a mi calendario"
2. Descarga archivo .ics
3. Importa en tu calendario favorito

## 📦 Dependencias Instaladas

```bash
npm install ics file-saver @types/file-saver
```

- **`ics`**: Genera archivos de calendario .ics
- **`file-saver`**: Descarga archivos desde el navegador
- **`@types/file-saver`**: Tipos TypeScript para file-saver

## 🔒 Seguridad

### RLS (Row Level Security)
- Solo el organizador dueño puede editar cronograma y precios
- Todos pueden leer la información pública
- Políticas basadas en la relación: `events_date → events_parent → profiles_organizer`

### Validaciones
- Campos requeridos: `titulo`, `hora_inicio` (cronograma)
- Campos requeridos: `nombre`, `monto > 0` (precios)
- Tipos validados con CHECK constraints en la base de datos

## 🎯 Casos de Uso

### Cronograma Típico de Evento
```
20:00 - 21:00: 🎓 Clase de Bachata (Nivel Intermedio)
21:00 - 21:15: ☕ Break
21:15 - 22:00: 🎭 Show de Baile
22:00 - 23:59: 💃 Social Dance
```

### Precios Típicos
```
🎫 Preventa General: $200 MXN
🎫 Preventa VIP: $350 MXN
🎪 Taquilla General: $250 MXN
🎁 Promoción Estudiantes: $150 MXN (25% descuento)
```

## 🔄 Flujo de Trabajo

1. **Organizador crea evento padre**
2. **Organizador crea fecha específica**
3. **Organizador edita la fecha y configura:**
   - Datos básicos (fecha, hora, lugar)
   - Cronograma de actividades
   - Precios y promociones
4. **Publica el evento**
5. **Usuarios ven el evento público**
6. **Usuarios pueden agregar a su calendario**

## 📈 Beneficios

- **Para Organizadores**: Gestión completa de eventos con detalles
- **Para Usuarios**: Información detallada y fácil integración con calendarios
- **Para la App**: Sistema robusto y escalable para eventos complejos

## 🐛 Solución de Problemas

### Error: "Bucket not found" en org-media
- Ejecutar `SCRIPT_3_BUCKET_ORG_MEDIA.sql`

### Error: "Permission denied" en cronograma/precios
- Verificar que el usuario es el organizador dueño del evento

### Error: "File download failed" en calendario
- Verificar que las dependencias `ics` y `file-saver` están instaladas
- Revisar permisos del navegador para descargas

---

¡El sistema está listo para usar! 🎉
