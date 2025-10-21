# Sprint 2 - Sistema de Eventos y Organizadores

## 📋 Resumen

Sprint 2 implementa el sistema completo de gestión de eventos para BaileApp, permitiendo a los usuarios convertirse en organizadores y crear/gestionar eventos con múltiples fechas.

---

## 🏗️ Arquitectura

### **Tipos de Datos** (`src/types/events.ts`)

```typescript
- Aprobacion: 'borrador' | 'en_revision' | 'aprobado' | 'rechazado'
- PubEstado: 'borrador' | 'publicado'
- Organizer: Perfil de organizador con aprobación
- EventParent: Evento padre (puede tener múltiples fechas)
- EventDate: Fecha específica de un evento
- RSVPStatus: 'voy' | 'interesado' | 'no_voy'
```

---

## 🎣 Hooks de Datos

### **useOrganizer.ts**
- `useMyOrganizer()` - Obtener/gestionar mi perfil de organizador
- `upsertMyOrganizer()` - Crear/actualizar organizador
- `submitForReview()` - Enviar a revisión
- `useOrganizerPublic(id)` - Ver organizador público

### **useEvents.ts**
- **Event Parent:**
  - `useEventParentsByOrganizer()`
  - `useCreateEventParent()`
  - `useUpdateEventParent()`

- **Event Date:**
  - `useEventDatesByParent()`
  - `useCreateEventDate()`
  - `useUpdateEventDate()`

- **RSVP:**
  - `useRSVP()` - Responder a evento
  - `useMyRSVPs()` - Ver mis respuestas

### **useTags.ts (extendido)**
- `useRitmos()` - Obtener ritmos de baile
- `useZonas()` - Obtener zonas geográficas

---

## 🧩 Componentes UI

### **TagChip** (extendido)
```typescript
Props: {
  label: string;
  variant?: 'ritmo' | 'zona';
  color?: 'blue' | 'yellow' | 'red' | 'orange';
  onClick?: () => void;
  active?: boolean;
}
```

### **TagMultiSelect** (nuevo)
```typescript
Props: {
  options: {id: number, label: string}[];
  value: number[];
  onChange: (ids: number[]) => void;
  variant?: 'ritmo' | 'zona';
  color?: 'blue' | 'yellow' | 'red' | 'orange';
}
```

---

## 📱 Pantallas Implementadas

### **1. Organizador**

#### `/organizer/edit` - OrganizerEditScreen
- Crear/editar perfil de organizador
- Campos: nombre_publico, bio, media URLs
- Badge de estado de aprobación
- Botón "Enviar a Revisión"
- Link a "Crear Nuevo Evento" (si aprobado)

#### `/organizer/:id` - OrganizerPublicScreen
- Vista pública del organizador
- Tabs: Info | Eventos | Media
- Lista de eventos del organizador
- Galería de media

---

### **2. Evento Padre**

#### `/events/parent/new` - EventParentEditScreen (crear)
#### `/events/parent/:id/edit` - EventParentEditScreen (editar)
- Requiere ser organizador aprobado
- Campos:
  - nombre (requerido)
  - descripción
  - sede_general
  - ritmos/estilos (multi-select)
  - media URLs
- Validaciones y mensajes de error
- Navegación después de crear

#### `/events/parent/:id` - EventParentPublicScreen
- Muestra info del evento
- Lista de fechas publicadas
- Cards con detalles de cada fecha
- Links a fechas específicas

---

### **3. Fecha de Evento**

#### `/events/date/new/:parentId` - EventDateEditScreen (crear)
#### `/events/date/:id/edit` - EventDateEditScreen (editar)
- Campos:
  - fecha (date input, requerido)
  - hora_inicio, hora_fin
  - lugar, dirección, ciudad
  - zona (select de zonas)
  - estilos (multi-select de ritmos)
  - media URLs
  - estado_publicacion (borrador/publicado)
- Layout en grid para horas
- Validaciones
- Preview del estado de publicación

#### `/events/date/:id` - EventDatePublicScreen
- Detalles completos de la fecha
- Información formateada (fecha, hora, lugar)
- Tags de ritmos y zona
- **Sistema RSVP:**
  - 3 botones: Voy | Interesado | No Voy
  - Visual feedback (activo/hover)
  - Muestra respuesta actual del usuario
  - Requiere login
- Back link al evento padre

---

### **4. Mis RSVPs**

#### `/me/rsvps` - MyRSVPsScreen
- Lista de eventos a los que respondí
- Cards con:
  - Nombre del evento
  - Fecha formateada
  - Hora, lugar, ciudad
  - Badge de mi respuesta (Voy/Interesado/No Voy)
- Links a cada evento
- Empty state si no hay RSVPs

---

## 🎨 Diseño y UX

### **Paleta de Colores**
- Ritmos: Azul (`#3B82F6`)
- Zonas: Amarillo/Naranja (`#F59E0B`)
- Voy: Verde (`#10B981`)
- Interesado: Amarillo (`#F59E0B`)
- No Voy: Rojo (`#EF4444`)

### **Patrones UI**
- Cards con hover effects
- Badges de estado con colores semánticos
- Formularios con validación inline
- Loading states en botones
- Empty states informativos
- Navegación breadcrumb

---

## 🛣️ Rutas

### **Protegidas** (requieren login)
```
/organizer/edit
/events/parent/new
/events/parent/:id/edit
/events/date/new/:parentId
/events/date/:id/edit
/me/rsvps
```

### **Públicas** (con lógica de acceso)
```
/organizer/:id          # Solo si aprobado o es el dueño
/events/parent/:id      # Público
/events/date/:id        # Público (fechas publicadas)
```

---

## 🔐 Lógica de Negocio

### **Flujo de Organizador**
1. Usuario crea perfil de organizador (borrador)
2. Completa info y envía a revisión
3. Admin aprueba/rechaza
4. Si aprobado → puede crear eventos

### **Flujo de Evento**
1. Organizador crea evento padre (borrador)
2. Agrega fechas específicas
3. Cada fecha puede ser borrador o publicada
4. Solo fechas publicadas son visibles

### **Flujo RSVP**
1. Usuario ve fecha pública
2. Hace clic en Voy/Interesado/No Voy
3. Respuesta se guarda y actualiza
4. Puede cambiar respuesta en cualquier momento
5. Ve sus RSVPs en /me/rsvps

---

## 🛠️ Utilidades

### **Validaciones** (`src/utils/forms.ts`)
- `required(value)` - Campo obligatorio
- `asDateInput(date)` - Formatea fecha para input

### **Formateo de Fechas**
- `date-fns` con locale español
- Formatos: "d de MMM, yyyy", "EEEE, d de MMMM de yyyy"

---

## ⚙️ Configuración Base de Datos

### **Tablas Requeridas** (pendiente)

```sql
-- profiles_organizer
CREATE TABLE profiles_organizer (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  nombre_publico TEXT NOT NULL,
  bio TEXT,
  media JSONB DEFAULT '[]',
  estado_aprobacion TEXT DEFAULT 'borrador',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- events_parent
CREATE TABLE events_parent (
  id SERIAL PRIMARY KEY,
  organizer_id INT REFERENCES profiles_organizer NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  estilos INT[] DEFAULT '{}',
  sede_general TEXT,
  media JSONB DEFAULT '[]',
  estado_aprobacion TEXT DEFAULT 'borrador',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- events_date
CREATE TABLE events_date (
  id SERIAL PRIMARY KEY,
  parent_id INT REFERENCES events_parent NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,
  lugar TEXT,
  direccion TEXT,
  ciudad TEXT,
  zona INT REFERENCES tags,
  estilos INT[] DEFAULT '{}',
  media JSONB DEFAULT '[]',
  estado_publicacion TEXT DEFAULT 'borrador',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- rsvp
CREATE TABLE rsvp (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  event_date_id INT REFERENCES events_date NOT NULL,
  status TEXT NOT NULL, -- 'voy', 'interesado', 'no_voy'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_date_id)
);
```

### **RLS Policies** (pendiente)
- Organizadores: solo dueño puede editar
- Eventos: solo organizador dueño puede editar
- RSVP: solo dueño puede crear/editar su respuesta
- Lecturas públicas según estado de aprobación/publicación

---

## 📊 Estado del Proyecto

### ✅ **Completado**
- [x] Tipos de datos
- [x] Hooks de React Query
- [x] Rutas y navegación
- [x] Componentes UI (TagChip, TagMultiSelect)
- [x] Pantallas CRUD completas
- [x] Sistema RSVP
- [x] Diseño y estilos
- [x] Validaciones
- [x] Empty states
- [x] Loading states

### 🔄 **Pendiente**
- [ ] Configurar tablas en Supabase
- [ ] Configurar RLS policies
- [ ] Fetch real de datos (actualmente usa placeholders)
- [ ] Upload de imágenes a Storage
- [ ] Búsqueda y filtros de eventos
- [ ] Contador de RSVPs
- [ ] Notificaciones
- [ ] Panel de admin para aprobaciones

---

## 🚀 Próximos Pasos

1. **Configurar Base de Datos**
   - Ejecutar scripts SQL en Supabase
   - Configurar RLS policies
   - Probar inserts/updates

2. **Integrar Datos Reales**
   - Actualizar hooks para fetch real
   - Quitar placeholders
   - Manejar errores de red

3. **Mejorar UX**
   - Agregar búsqueda de eventos
   - Filtros por ritmo/zona/fecha
   - Mapa de ubicaciones
   - Galería de imágenes mejorada

4. **Admin Panel**
   - Dashboard de aprobaciones
   - Gestión de organizadores
   - Moderación de contenido

---

## 📝 Notas Técnicas

- Todas las fechas se almacenan en formato ISO (YYYY-MM-DD)
- Los arrays de IDs (estilos, zonas) se almacenan como INT[]
- Media se almacena como JSONB array de URLs
- Estados de aprobación/publicación son TEXT (considerar ENUM)
- React Query invalida caches automáticamente en mutations
- Toast notifications para feedback de usuario

---

**Sprint 2 - Completado** ✅
Fecha: 21 de Octubre, 2025
