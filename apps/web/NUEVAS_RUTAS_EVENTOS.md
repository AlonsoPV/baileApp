# 🎯 Nuevas Rutas de Eventos - Sistema Unificado

## 📋 Resumen

Se ha implementado un sistema unificado para crear, editar y visualizar eventos con **paridad completa de campos** entre todas las vistas.

---

## 🛣️ Rutas Disponibles

### **1. Crear Evento (Nuevo Sistema)**
```
/events/create
```
- **Componente:** `EventCreateScreen`
- **Autenticación:** Requerida
- **Descripción:** Formulario unificado para crear eventos
- **Campos:** Todos los campos del evento padre, fecha, cronograma y precios
- **Flujo:** 
  1. Crear evento padre (nombre, descripción, sede, estilos)
  2. Crear fecha (fecha, hora, lugar, ciudad, dirección, requisitos, publicación)
  3. Añadir cronograma (actividades)
  4. Añadir precios (costos y promociones)

### **2. Editar Evento (Nuevo Sistema)**
```
/events/date/:dateId/edit
```
- **Componente:** `EventEditScreen`
- **Autenticación:** Requerida
- **Descripción:** Formulario unificado para editar eventos con datos pre-cargados
- **Campos:** Todos los campos del evento padre, fecha, cronograma y precios
- **Flujo:**
  1. Editar evento padre (nombre, descripción, sede, estilos)
  2. Editar fecha (fecha, hora, lugar, ciudad, dirección, requisitos, publicación)
  3. Editar cronograma (actividades) - Añadir, modificar o eliminar
  4. Editar precios (costos y promociones) - Añadir, modificar o eliminar
- **Características:**
  - ✅ Carga datos existentes automáticamente con `useEventFullByDateId`
  - ✅ Guardado independiente de evento padre y fecha
  - ✅ Integra `EventScheduleEditor` para editar cronograma
  - ✅ Integra `EventPriceEditor` para editar precios
  - ✅ Invalidación de caché React Query para actualización inmediata
  - ✅ Estados de carga y validaciones
  - ✅ Mensajes de confirmación con toast
  - ✅ Navegación a vista pública al finalizar

### **3. Ver Evento Público (Nuevo Sistema)**
```
/events/date/:id
```
- **Componente:** `EventPublicScreen`
- **Autenticación:** NO requerida (público)
- **Descripción:** Vista pública moderna con diseño mejorado
- **Características:**
  - Hero con gradiente y chips de estilos
  - Cronograma tipo timeline con iconos
  - Precios en cards organizados
  - Responsive design

---

## 🔄 Rutas Existentes (Sistema Anterior)

### **Wizard de Creación**
```
/events/new
```
- **Componente:** `EventCreateWizard`
- **Descripción:** Wizard paso a paso (4 pasos)
- **Estado:** Activo, pero el nuevo sistema es más flexible

### **Editar Evento Padre**
```
/events/parent/:id/edit
```
- **Componente:** `EventParentEditScreen`
- **Descripción:** Editar solo datos del evento padre
- **Estado:** Activo

### **Editar Fecha**
```
/events/date/:id/edit
```
- **Componente:** `EventDateEditScreen`
- **Descripción:** Editar solo datos de la fecha
- **Estado:** Reemplazado por `/events/date/:dateId/edit` (nuevo sistema)

---

## 🎨 Componentes Nuevos

### **1. EventForm**
```tsx
<EventForm
  mode="create" | "edit"
  parent={parentData}
  date={dateData}
  onChangeParent={(patch) => ...}
  onChangeDate={(patch) => ...}
  onSaveParent={async () => ...}
  onSaveDate={async () => ...}
  dateId={number | null}
  onFinish={() => ...}
  isLoading={boolean}
/>
```
- **Ubicación:** `components/events/EventForm.tsx`
- **Descripción:** Formulario reutilizable con TODOS los campos
- **Características:**
  - Campos de evento padre (nombre, descripción, sede, estilos)
  - Campos de fecha (fecha, hora, lugar, ciudad, dirección, requisitos)
  - Integración de `EventScheduleEditor` y `EventPriceEditor`
  - Estados de carga
  - Validaciones básicas

### **2. useEventFull**
```tsx
const { data, isLoading, error } = useEventFullByDateId(dateId);
// data = { parent, date, schedules, prices }
```
- **Ubicación:** `hooks/useEventFull.ts`
- **Descripción:** Hook para cargar datos completos del evento
- **Retorna:**
  - `parent`: EventParent
  - `date`: EventDate
  - `schedules`: EventSchedule[]
  - `prices`: EventPrice[]

---

## 🔧 Tipos Actualizados

### **EventSchedule**
```typescript
export type EventSchedule = {
  id?: number;
  event_date_id: number;
  tipo: "clase" | "show" | "social" | "otro";
  titulo: string;
  descripcion?: string;
  hora_inicio: string;
  hora_fin?: string;
  ritmo?: number;
};
```

### **EventPrice**
```typescript
export type EventPrice = {
  id?: number;
  event_date_id: number;
  tipo: "preventa" | "taquilla" | "promo";
  nombre: string;
  monto?: number;
  descripcion?: string;
  hora_inicio?: string;
  hora_fin?: string;
  descuento?: number;
};
```

---

## 📊 Comparación de Sistemas

| Característica | Sistema Anterior | Nuevo Sistema |
|----------------|------------------|---------------|
| **Paridad de campos** | ❌ Campos dispersos | ✅ Todos los campos en un lugar |
| **Pérdida de datos** | ⚠️ Posible al editar | ✅ Guardado independiente |
| **Diseño público** | 📄 Básico | 🎨 Moderno con hero y timeline |
| **Reutilización** | ❌ Componentes separados | ✅ EventForm reutilizable |
| **Carga de datos** | ⚠️ Múltiples queries | ✅ useEventFull unificado |
| **Mantenimiento** | ⚠️ Más archivos | ✅ Centralizado |

---

## 🚀 Migración Recomendada

### **Paso 1: Actualizar Enlaces**
Cambiar enlaces de edición para usar el nuevo sistema:
```tsx
// Antes
navigate(`/events/date/${id}/edit`)

// Después (nuevo sistema)
navigate(`/events/date/${dateId}/edit`)
```

### **Paso 2: Vista Pública**
La ruta `/events/date/:id` ya usa el nuevo `EventPublicScreen` automáticamente.

### **Paso 3: Crear Eventos**
Usar `/events/create` para la nueva experiencia o mantener `/events/new` para el wizard.

---

## 🎯 Ventajas del Nuevo Sistema

1. ✅ **Sin pérdida de datos**: Guardado independiente de padre y fecha
2. ✅ **Paridad completa**: Mismos campos en crear, editar y ver
3. ✅ **Código reutilizable**: Un solo componente `EventForm`
4. ✅ **Vista moderna**: Diseño público mejorado
5. ✅ **Mejor UX**: Estados de carga, validaciones, mensajes claros
6. ✅ **Fácil mantenimiento**: Código centralizado y logging detallado

---

## 🐛 Debugging

Los componentes incluyen logging detallado:
```
[EventCreateScreen] onSaveParent called
[EventEditScreen] Data loaded: { hasParent, hasDate, ... }
[useEventFullByDateId] Fetching data for dateId: 123
```

Busca estos mensajes en la consola para diagnosticar problemas.

---

## 📝 Notas Importantes

1. **EventCreateScreen** requiere que el usuario tenga un organizador. Si no existe, lo crea automáticamente.
2. **EventEditScreen** carga todos los datos con `useEventFullByDateId` antes de mostrar el formulario.
3. **EventPublicScreen** funciona sin autenticación y muestra todos los datos públicos.
4. **React Query** invalida la caché automáticamente después de cada edición.

---

## ✅ Verificación de Requisitos - EventEditScreen

### **Requisitos Cumplidos:**

| Requisito | Estado | Detalles |
|-----------|--------|----------|
| **Autenticación Requerida** | ✅ | Protegido por `OnboardingGate` en router |
| **Formulario Unificado** | ✅ | Usa `EventForm` con todos los campos |
| **Editar Evento Padre** | ✅ | Campos: nombre, descripción, sede, estilos |
| **Editar Fecha** | ✅ | Campos: fecha, hora inicio/fin, lugar, ciudad, dirección, requisitos, publicación |
| **Editar Cronograma** | ✅ | Integra `EventScheduleEditor` con CRUD completo |
| **Editar Precios** | ✅ | Integra `EventPriceEditor` con CRUD completo |
| **Carga Automática** | ✅ | `useEventFullByDateId` carga todos los datos |
| **Guardado Independiente** | ✅ | `onSaveParent()` y `onSaveDate()` separados |
| **Estados de Carga** | ✅ | `isLoading` durante operaciones |
| **Validaciones** | ✅ | Nombre y fecha requeridos |
| **Mensajes Usuario** | ✅ | Toast para éxito/error |
| **Navegación** | ✅ | Botón finalizar → vista pública |

### **Flujo de Edición Verificado:**

```
Usuario navega a /events/date/{dateId}/edit
         ↓
EventEditScreen carga datos con useEventFullByDateId
         ↓
Muestra EventForm con datos pre-cargados:
  - Evento Padre (nombre, descripción, sede, estilos)
  - Fecha (fecha, hora, lugar, ciudad, dirección, requisitos)
  - Cronograma (lista de actividades editables)
  - Precios (lista de costos editables)
         ↓
Usuario edita campos necesarios
         ↓
Usuario hace clic en "Guardar evento" → onSaveParent()
         ↓
Usuario hace clic en "Guardar edición" → onSaveDate()
         ↓
EventScheduleEditor y EventPriceEditor manejan sus propios CRUD
         ↓
Usuario hace clic en "Finalizar"
         ↓
Navega a vista pública: /events/date/{dateId}
```

---

## 🔮 Futuras Mejoras

- [ ] Migrar completamente del wizard al nuevo sistema
- [ ] Añadir subida de media en EventForm
- [ ] Implementar vista previa antes de publicar
- [ ] Añadir validaciones avanzadas (fechas en el futuro, etc.)
- [ ] Implementar edición de múltiples fechas para un mismo evento

