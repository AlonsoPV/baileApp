# 🧙‍♂️ Wizard de Creación de Eventos

## ✅ **Implementado**

Un wizard paso a paso para crear eventos completos desde el perfil de usuario.

---

## 🎯 **Flujo Completo**

```
1. Usuario ve botón "📅 Crear Evento" (flotante, bottom-right)
2. Click → Navega a /events/new
3. Wizard de 4 pasos:
   ├── Paso 1: Información del evento (padre)
   ├── Paso 2: Fecha y ubicación
   ├── Paso 3: Cronograma de actividades
   └── Paso 4: Costos y promociones
4. Al finalizar → Navega a vista pública del evento
```

---

## 📋 **Paso 1: Información del Evento**

### **Campos:**
- ✅ Nombre del evento * (requerido)
- ✅ Descripción
- ✅ Sede general
- ✅ Estilos de baile (chips multi-selección)

### **Acción:**
- Crea `events_parent` en Supabase
- Si no existe organizador → Crea uno mínimo ("Mi Social")
- Guarda `parentId` para siguiente paso

---

## 📋 **Paso 2: Fecha y Ubicación**

### **Campos:**
- ✅ Fecha * (requerido)
- ✅ Hora inicio
- ✅ Hora fin
- ✅ Lugar
- ✅ Ciudad
- ✅ Dirección
- ✅ Requisitos / Dresscode
- ✅ Checkbox "Publicado" (borrador vs publicado)

### **Acción:**
- Crea `events_date` en Supabase
- Asocia con `parent_id` del paso 1
- Guarda `eventDateId` para siguientes pasos

---

## 📋 **Paso 3: Cronograma**

### **Funcionalidad:**
- Usa componente `EventScheduleEditor`
- Permite agregar actividades:
  - **Tipo**: clase, show, social, otro
  - **Título**: Ej: "Clase de Bachata"
  - **Hora inicio** y **Hora fin**
  - **Descripción** (opcional)
  - **Ritmo** (opcional, selección de tags)

### **Extras:**
- ✅ Botón "📅 Agregar a mi calendario" (ICS download)

---

## 📋 **Paso 4: Costos y Promociones**

### **Funcionalidad:**
- Usa componente `EventPriceEditor`
- Permite agregar precios:
  - **Tipo**: preventa, taquilla, promo
  - **Nombre**: Ej: "Preventa General"
  - **Monto**: Cantidad en pesos
  - **Descripción** (opcional)
  - **Vigencia**: Hora inicio y fin (opcional)
  - **Descuento**: Porcentaje 0-100 (opcional)

### **Acción Final:**
- Botón "✅ Finalizar" → Navega a vista pública del evento

---

## 🎨 **UI/UX**

### **Indicador de Progreso**
```
████ □□□□  → Paso 1/4
████ ████ □□□□  → Paso 2/4
████ ████ ████ □□□□  → Paso 3/4
████ ████ ████ ████  → Paso 4/4 (Completo)
```

### **Navegación**
- **Botón "← Atrás"**: Vuelve al paso anterior (sin perder datos)
- **Botón "Guardar y continuar →"**: Guarda en BD y avanza
- **Botón "✅ Finalizar"**: Completa el proceso

### **Validaciones**
- ✅ Nombre del evento es obligatorio (Paso 1)
- ✅ Fecha es obligatoria (Paso 2)
- ✅ Si no hay organizador, se crea automáticamente
- ✅ Toast notifications para feedback

---

## 🔗 **Rutas**

### **Nueva Ruta:**
```typescript
<Route path="/events/new" element={<EventCreateWizard />} />
```

### **Botón de Acceso:**
- **Ubicación**: `UserProfileLive.tsx`
- **Estilo**: Botón flotante (fixed, bottom-right)
- **Acción**: `navigate('/events/new')`

---

## 📁 **Archivos Creados/Modificados**

### **Nuevos:**
- ✅ `apps/web/src/screens/events/EventCreateWizard.tsx` - Wizard completo

### **Modificados:**
- ✅ `apps/web/src/router.tsx` - Agregada ruta `/events/new`
- ✅ `apps/web/src/screens/profile/UserProfileLive.tsx` - Botón flotante

---

## 🔄 **Reutilización de Componentes**

El wizard reutiliza componentes existentes:

1. **`EventScheduleEditor`** → Paso 3
2. **`EventPriceEditor`** → Paso 4
3. **`AddToCalendarButton`** → Paso 3 (exportar ICS)
4. **`useMyOrganizer`** → Verifica/crea organizador
5. **`useCreateParent`** → Crea evento padre
6. **`useCreateDate`** → Crea fecha del evento
7. **`useTags("ritmo")`** → Chips de estilos

---

## 🧪 **Cómo Probar**

### **Test 1: Crear evento completo**
```
1. Login como usuario
2. Ve a perfil (/app/profile)
3. Click botón flotante "📅 Crear Evento"
4. Completa Paso 1 (nombre, estilos)
5. Click "Guardar y continuar"
6. Completa Paso 2 (fecha, lugar)
7. Click "Guardar y continuar"
8. Agrega cronograma (opcional)
9. Click "Continuar a costos"
10. Agrega precios (opcional)
11. Click "✅ Finalizar"
12. ✅ Debe navegar a vista pública del evento
```

### **Test 2: Usuario sin organizador**
```
1. Usuario nuevo (sin organizador)
2. Click "Crear Evento"
3. ✅ Debe crear organizador automáticamente
4. Toast: "Perfil de organizador creado"
5. Continuar flujo normal
```

### **Test 3: Validaciones**
```
1. Paso 1: Dejar nombre vacío → Toast "obligatorio"
2. Paso 2: Dejar fecha vacía → Toast "obligatoria"
3. Validaciones deben impedir avanzar
```

### **Test 4: Navegación atrás**
```
1. Completar Paso 1 y avanzar
2. Click "← Atrás"
3. ✅ Datos del Paso 1 deben persistir
4. Modificar y avanzar nuevamente
```

---

## 📊 **Estructura de Datos**

### **Evento Padre (events_parent)**
```typescript
{
  id: number,
  organizer_id: number,
  nombre: string,
  descripcion?: string,
  sede_general?: string,
  estilos: number[],  // IDs de tags tipo='ritmo'
  estado_aprobacion: 'pendiente' | 'aprobado' | 'rechazado'
}
```

### **Fecha de Evento (events_date)**
```typescript
{
  id: number,
  parent_id: number,
  fecha: date,
  hora_inicio?: time,
  hora_fin?: time,
  lugar?: string,
  ciudad?: string,
  direccion?: string,
  requisitos?: string,
  estado_publicacion: 'borrador' | 'publicado'
}
```

### **Cronograma (event_schedules)**
```typescript
{
  id: number,
  event_date_id: number,
  tipo: 'clase' | 'show' | 'social' | 'otro',
  titulo: string,
  descripcion?: string,
  hora_inicio: time,
  hora_fin?: time,
  ritmo?: number  // ID de tag
}
```

### **Precios (event_prices)**
```typescript
{
  id: number,
  event_date_id: number,
  tipo: 'preventa' | 'taquilla' | 'promo',
  nombre: string,
  monto?: number,
  descripcion?: string,
  hora_inicio?: timestamptz,
  hora_fin?: timestamptz,
  descuento?: number  // 0-100
}
```

---

## 💡 **Mejoras Futuras (Opcional)**

1. **Validación de horarios**: Verificar que hora_fin > hora_inicio
2. **Prevista en vivo**: Mostrar cómo se verá el evento en cada paso
3. **Autoguardado**: Guardar draft en localStorage si sale sin completar
4. **Imágenes**: Agregar upload de banner/cover en Paso 1
5. **Múltiples fechas**: Permitir crear varias fechas para mismo evento padre
6. **Clonar evento**: Crear nuevo evento basado en uno anterior

---

## ✅ **Checklist de Verificación**

- [ ] Botón "Crear Evento" visible en perfil de usuario
- [ ] Ruta `/events/new` funciona correctamente
- [ ] Paso 1: Crea evento padre en Supabase
- [ ] Paso 2: Crea fecha en Supabase
- [ ] Paso 3: Cronogramas se guardan correctamente
- [ ] Paso 4: Precios se guardan correctamente
- [ ] Usuario sin organizador → Se crea automáticamente
- [ ] Navegación "Atrás" mantiene datos
- [ ] Toast notifications funcionan
- [ ] Al finalizar → Navega a vista pública

---

**Fecha**: 2025-01-22
**Status**: ✅ IMPLEMENTADO
**Archivos**: 3 (1 nuevo, 2 modificados)
