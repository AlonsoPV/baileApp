# 📅 Campos Obligatorios para Crear una Fecha de Evento

## ✅ Campos OBLIGATORIOS

### 1. **`fecha`** (Fecha del evento)
- **Tipo**: `string` (formato fecha: YYYY-MM-DD)
- **Descripción**: Fecha en que se realizará el evento
- **Validación**: No puede estar vacío
- **Ejemplo**: `"2025-02-15"`

---

## ⚠️ Campos OPCIONALES (pero recomendados)

### Relación con Evento Padre
- **`parent_id`**: ID del evento padre (`events_parent`) al que pertenece esta fecha
  - **Tipo**: `number | null`
  - **Descripción**: Si se proporciona, la fecha estará asociada a un evento padre. Si es `null`, la fecha será independiente.
  - **Ejemplo**: `123` o `null`

### Información Básica
- **`nombre`**: Nombre específico de esta fecha (si difiere del evento padre)
- **`biografia`**: Descripción adicional de esta fecha
- **`hora_inicio`**: Hora de inicio (formato HH:MM)
- **`hora_fin`**: Hora de finalización (formato HH:MM)

### Ubicación
- **`lugar`**: Nombre del lugar
- **`direccion`**: Dirección completa
- **`ciudad`**: Ciudad
- **`referencias`**: Referencias de ubicación
- **`zona`**: ID de zona (número)
- **`zonas`**: Array de IDs de zonas (múltiples zonas)

### Información Adicional
- **`djs`**: DJs que participarán
- **`telefono_contacto`**: Teléfono de contacto
- **`mensaje_contacto`**: Mensaje de contacto
- **`requisitos`**: Requisitos para asistir
- **`cronograma`**: Array con el cronograma de actividades
- **`costos`**: Array con información de costos
- **`estilos`**: Array de IDs de estilos
- **`ritmos_seleccionados`**: Array de slugs de ritmos
- **`flyer_url`**: URL del flyer/póster del evento
- **`estado_publicacion`**: Estado de publicación (`'borrador'` o `'publicado'`)
  - **Valor por defecto**: `'borrador'`

### Repetición Semanal (opcional)
- **`repetir_semanal`**: Boolean para indicar si se repite semanalmente
- **`dia_semana`**: Día de la semana (0-6, donde 0 = domingo)
- **`semanas_repetir`**: Número de semanas a repetir

---

## 📋 Ejemplo Mínimo de Creación

```typescript
const payload = {
  fecha: "2025-02-15",     // ✅ OBLIGATORIO
  estado_publicacion: "borrador"  // Opcional (tiene valor por defecto)
};

// O con parent_id (opcional):
const payloadConParent = {
  parent_id: 123,          // ⚠️ OPCIONAL
  fecha: "2025-02-15",     // ✅ OBLIGATORIO
  estado_publicacion: "borrador"
};
```

---

## 📋 Ejemplo Completo de Creación

```typescript
const payload = {
  // ✅ OBLIGATORIOS
  fecha: "2025-02-15",
  
  // ⚠️ OPCIONALES
  parent_id: 123,  // Opcional - puede ser null
  
  // ⚠️ OPCIONALES
  nombre: "Noche de Salsa - Edición Especial",
  biografia: "Una noche inolvidable de salsa...",
  hora_inicio: "20:00",
  hora_fin: "02:00",
  lugar: "Club de Baile XYZ",
  direccion: "Av. Principal 123",
  ciudad: "Ciudad de México",
  zona: 5,
  zonas: [5, 6],
  referencias: "Cerca del metro",
  requisitos: "Mayores de 18 años",
  djs: "DJ Juan, DJ María",
  telefono_contacto: "+52 55 1234 5678",
  mensaje_contacto: "Contacto para reservaciones",
  estilos: [1, 2, 3],
  ritmos_seleccionados: ["salsa", "bachata"],
  cronograma: [
    {
      titulo: "Clase de Salsa",
      inicio: "20:00",
      fin: "21:00",
      instructor: "Prof. Juan"
    }
  ],
  costos: [
    {
      tipo: "Entrada general",
      precio: 150
    }
  ],
  flyer_url: "https://...",
  estado_publicacion: "publicado"
};
```

---

## 🔍 Validaciones en el Código

### En `EventDateEditScreen.tsx`:
```typescript
if (!form.fecha) {
  showToast('La fecha es obligatoria', 'error');
  return;
}

// parent_id ya no es obligatorio - solo se requiere id para actualizar
if (!isNew && !id) {
  showToast('ID requerido para actualizar', 'error');
  return;
}
```

### En `OrganizerEventDateCreateScreen.tsx`:
```typescript
if (!dateForm.fecha) {
  showToast('La fecha es obligatoria', 'error');
  return;
}

// parent_id ya no es obligatorio - se puede crear fecha sin evento padre
```

### En `EventCreateScreen.tsx`:
```typescript
if (!date.fecha) {
  showToast('La fecha es obligatoria', 'error');
  return;
}
```

### En `OrganizerProfileEditor.tsx`:
```typescript
// Solo se valida que la fecha esté presente
disabled={
  createEventDate.isPending || 
  !dateForm.fecha
}
```

---

## 📝 Notas Importantes

1. **`fecha`** debe estar en formato `YYYY-MM-DD` y es el único campo obligatorio
2. **`parent_id`** es opcional - si se proporciona, debe corresponder a un `events_parent` existente. Si es `null`, la fecha será independiente.
3. Todos los demás campos son opcionales y pueden ser `null`
4. Si no se especifica `estado_publicacion`, se usa `'borrador'` por defecto
5. Los campos de texto se trimean (se eliminan espacios al inicio y final) antes de guardar
6. Se pueden crear fechas independientes sin necesidad de un evento padre

---

## 🗄️ Estructura en Base de Datos

La tabla `events_date` tiene estos campos principales:
- `id` (auto-generado)
- `parent_id` (NULLABLE) ⚠️ Opcional
- `fecha` (NOT NULL) ✅ Obligatorio
- `hora_inicio` (NULLABLE)
- `hora_fin` (NULLABLE)
- `lugar` (NULLABLE)
- `direccion` (NULLABLE)
- `ciudad` (NULLABLE)
- `zona` (NULLABLE)
- `estado_publicacion` (con valor por defecto)
- `created_at` (auto-generado)
- ... y otros campos opcionales

---

**Última actualización**: Enero 2025

