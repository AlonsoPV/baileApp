# Sprint 3 - Sistema de Perfiles Dinámicos

## 📋 Resumen

Sprint 3 implementa el sistema completo de perfiles dinámicos con switch entre Usuario y Organizador, modos Live y Edit, y jerarquía completa de eventos.

---

## 🏗️ Arquitectura

### **Estado Global** (`useProfileSwitch`)

```typescript
activeRole: "usuario" | "organizador"
mode: "live" | "edit"
hasOrganizer: boolean
```

### **Matriz de Vistas**

```
                    LIVE                    EDIT
              ┌──────────────────────┬──────────────────────┐
    USUARIO   │ UserProfileLive      │ UserProfileEditor    │
              │ - Foto fullscreen    │ - Upload avatar      │
              │ - Chips visibles     │ - Multi-select tags  │
              │ - Redes sociales SVG │ - Input redes        │
              └──────────────────────┴──────────────────────┘
              ┌──────────────────────┬──────────────────────┐
 ORGANIZADOR  │ OrganizerProfileLive │ OrganizerProfileEditor│
              │ - Banner gradiente   │ - Nombre público     │
              │ - Tabs (Eventos)     │ - Bio, media         │
              │ - Lista de eventos   │ - Lista de eventos   │
              │ - Galería media      │ - Botón nuevo evento │
              └──────────────────────┴──────────────────────┘
```

---

## 🎣 Hooks

### **useProfileSwitch.ts**
```typescript
export function useProfileSwitch() {
  return {
    activeRole: "usuario" | "organizador",
    mode: "live" | "edit",
    hasOrganizer: boolean,
    organizer: Organizer | null,
    toggleRole: () => void,
    toggleMode: () => void,
    switchToRole: (role) => void,
    switchToMode: (mode) => void,
  };
}
```

**Lógica:**
- ✅ Solo permite switch a organizador si existe el perfil
- ✅ Mantiene estado sincronizado
- ✅ Integra con useAuth y useMyOrganizer

---

## 🧩 Componentes

### **1. ProfileSwitcher.tsx**

**Ubicación:** Fixed bottom-center

**Elementos:**
- **Role Toggle** (solo si hasOrganizer):
  - `[👤 Usuario]` `[🎤 Organizador]`
  - Gradiente según selección
  
- **Mode Toggle:**
  - `[✏️ Editar]` o `[👁️ Ver Live]`
  - Gradiente en modo edit

**Estilos:**
- Glassmorphism: `backdrop-filter: blur(20px)`
- Sombras dinámicas
- Animaciones de entrada

---

### **2. UserProfileLive.tsx**

**Características:**
- ✅ Foto de portada fullscreen (500px)
- ✅ Gradiente overlay (dark → transparent)
- ✅ Info flotante (nombre, bio, chips)
- ✅ Chips de ritmos (coral) y zonas (amarillo)
- ✅ Redes sociales con iconos SVG
- ✅ Secciones: Sobre mí, Tags expandidos
- ✅ Animaciones fade-in escalonadas

---

### **3. UserProfileEditor.tsx**

**Campos Editables:**
- ✅ Avatar (upload con preview)
- ✅ Display name
- ✅ Bio (textarea)
- ✅ Ritmos (multi-select toggle)
- ✅ Zonas (multi-select toggle)
- ✅ Redes sociales (Instagram, Facebook, WhatsApp)

**Funcionalidades:**
- ✅ Upload a Supabase Storage
- ✅ Cache busting de avatar
- ✅ Merge de perfil
- ✅ Toast notifications
- ✅ Loading state en botón

---

### **4. OrganizerProfileLive.tsx**

**Características:**
- ✅ Banner con gradiente blue-coral
- ✅ Nombre público grande
- ✅ Badge de estado de aprobación
- ✅ **Tabs:**
  - 📅 Eventos (lista de eventos)
  - 🖼️ Media (galería)
  - ℹ️ Info (biografía)
- ✅ Cards de eventos con hover
- ✅ Navegación a eventos
- ✅ Empty state con CTA

---

### **5. OrganizerProfileEditor.tsx**

**Campos Editables:**
- ✅ Nombre público
- ✅ Biografía
- ✅ Media URLs (textarea monospace)

**Acciones:**
- ✅ Guardar cambios
- ✅ Enviar a revisión (si borrador)
- ✅ Ver estado de aprobación

**Sección de Eventos:**
- ✅ Lista de eventos creados
- ✅ Botón "+ Nuevo Evento"
- ✅ Cards clickeables
- ✅ Navegación a cada evento

---

### **6. EventEditor.tsx**

**Jerarquía:** Organizador → **Evento Padre**

**Campos:**
- ✅ Nombre del evento (required)
- ✅ Descripción
- ✅ Sede general
- ✅ Ritmos/Estilos (multi-select)
- ✅ Media URLs

**Funcionalidades:**
- ✅ Modo crear (sin id)
- ✅ Modo editar (con id)
- ✅ Pre-carga datos al editar
- ✅ Validaciones
- ✅ Navegación post-creación

---

### **7. EventDateEditor.tsx**

**Jerarquía:** Evento Padre → **Fecha de Evento**

**Campos:**
- ✅ Fecha (date input, required)
- ✅ Hora inicio / fin
- ✅ Lugar
- ✅ Dirección
- ✅ Ciudad
- ✅ Zona (select)
- ✅ Estilos (multi-select)
- ✅ Media URLs
- ✅ **Estado de publicación:**
  - 📝 Borrador (naranja)
  - ✅ Publicado (verde)

**Funcionalidades:**
- ✅ Modo crear (desde parentId)
- ✅ Modo editar (con id)
- ✅ Pre-carga datos al editar
- ✅ Toggle de estado visual
- ✅ Navegación automática

---

## 🛣️ Rutas Implementadas

### **Perfil Principal:**
```
/app/profile                        → ProfileScreen (con switch)
  ├─ Usuario + Live → UserProfileLive
  ├─ Usuario + Edit → UserProfileEditor
  ├─ Organizador + Live → OrganizerProfileLive
  └─ Organizador + Edit → OrganizerProfileEditor
```

### **Legacy (Compatibilidad):**
```
/app/profile/edit                   → Profile (formulario antiguo)
```

### **Editores de Eventos (Sprint 3):**
```
/profile/organizer/events/new       → EventEditor (crear)
/profile/organizer/events/:id       → EventEditor (editar)
/profile/organizer/date/new/:parentId → EventDateEditor (crear)
/profile/organizer/date/:id         → EventDateEditor (editar)
```

### **Rutas Públicas (Sprint 2):**
```
/events/parent/:id                  → EventParentPublicScreen
/events/date/:id                    → EventDatePublicScreen
/organizer/:id                      → OrganizerPublicScreen
/me/rsvps                          → MyRSVPsScreen
```

---

## 🎨 Paleta de Colores

| Color | Código | Uso |
|-------|--------|-----|
| 🔴 Coral | `#FF3D57` | Primario, ritmos, acciones |
| 🟠 Naranja | `#FF8C42` | Hover, borrador |
| 🟡 Amarillo | `#FFD166` | Zonas, resaltes |
| 🔵 Azul | `#1E88E5` | Organizador, confirmación |
| ⚫ Carbón | `#121212` | Fondo dark |
| ⚪ Blanco | `#F5F5F5` | Texto en dark |

---

## 🎭 Flujos de Usuario

### **Flujo 1: Usuario Normal**
```
1. Login → Onboarding → Profile
2. Por defecto: Usuario + Live
3. Clic "Editar" → Usuario + Edit
4. Modifica datos → Guarda
5. Clic "Ver Live" → Usuario + Live ✅
```

### **Flujo 2: Crear Organizador**
```
1. Usuario + Edit
2. Switch a "Organizador"
3. Si no existe → CTA "Crear Perfil de Organizador"
4. Clic → Crea organizador automáticamente
5. Completa datos (nombre, bio)
6. Guardar + "Enviar a Revisión"
7. Aprobar en SQL (manual)
8. Switch a "Organizador" + "Ver Live" ✅
```

### **Flujo 3: Crear Evento Completo**
```
1. Organizador + Edit
2. Clic "+ Nuevo Evento"
3. EventEditor → Llenar formulario
   - Nombre: "Festival de Salsa 2025"
   - Descripción: "..."
   - Sede: "Centro de Convenciones"
   - Ritmos: Salsa, Bachata
4. Guardar → Redirige a /events/parent/:id
5. Clic "+ Nueva Fecha" (desde vista pública)
6. EventDateEditor → Llenar formulario
   - Fecha: 2025-03-15
   - Hora: 20:00 - 02:00
   - Lugar, dirección, ciudad
   - Zona: Polanco
   - Estado: Publicado ✅
7. Guardar → Fecha visible públicamente
```

### **Flujo 4: Editar Evento Existente**
```
1. Organizador + Live
2. Tab "Eventos"
3. Clic en evento → /events/parent/:id
4. Clic "Editar Evento" → EventEditor
5. Formulario pre-llenado
6. Modifica campos
7. Guardar → Actualiza evento ✅
```

---

## 🎬 Animaciones

### **Framer Motion:**

**Entry Animations:**
```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
```

**Hover Effects:**
```typescript
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
```

**Chips:**
```typescript
whileHover={{ 
  scale: 1.05, 
  boxShadow: `0 0 20px ${color}aa` 
}}
```

**Switcher:**
```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
```

---

## 🔐 Seguridad

### **RLS Policies (ya implementadas en Sprint 2):**
- ✅ Solo el dueño puede editar su organizador
- ✅ Solo el dueño puede crear/editar eventos
- ✅ Solo fechas publicadas son visibles
- ✅ Solo organizadores aprobados son públicos

### **Validaciones:**
- ✅ Nombre de evento obligatorio
- ✅ Fecha obligatoria
- ✅ No permite switch a organizador sin perfil
- ✅ Toast de errores

---

## 📊 Estado del Proyecto

### ✅ **Completado**
- [x] Hook useProfileSwitch
- [x] ProfileSwitcher component
- [x] UserProfileLive
- [x] UserProfileEditor
- [x] OrganizerProfileLive
- [x] OrganizerProfileEditor
- [x] EventEditor
- [x] EventDateEditor
- [x] Router actualizado
- [x] Navegación integrada
- [x] Animaciones completas
- [x] Chips con nombres reales
- [x] Iconos SVG de redes sociales

### 🔄 **Opcional/Futuro**
- [ ] Swipe navigation entre perfiles
- [ ] Lightbox para galería
- [ ] Match animations (Lottie)
- [ ] Variantes: Maestro, Marca
- [ ] Panel de admin para aprobaciones
- [ ] Notificaciones en tiempo real

---

## 🛣️ Mapa de Rutas Completo

### **Autenticación:**
```
/auth/login                         → Login
/auth/signup                        → Signup
```

### **Onboarding:**
```
/onboarding/basics                  → ProfileBasics
/onboarding/ritmos                  → PickRitmos
/onboarding/zonas                   → PickZonas
```

### **Perfil (Sprint 3):**
```
/app/profile                        → ProfileScreen (switch dinámico)
/app/profile/edit                   → Profile (legacy)
/profile/organizer/events/new       → EventEditor (crear)
/profile/organizer/events/:id       → EventEditor (editar)
/profile/organizer/date/new/:parentId → EventDateEditor (crear)
/profile/organizer/date/:id         → EventDateEditor (editar)
```

### **Eventos Públicos (Sprint 2):**
```
/events/parent/:id                  → EventParentPublicScreen
/events/date/:id                    → EventDatePublicScreen
/organizer/:id                      → OrganizerPublicScreen
/me/rsvps                          → MyRSVPsScreen
```

### **Admin (Sprint 2):**
```
/organizer/edit                     → OrganizerEditScreen
/events/parent/new                  → EventParentEditScreen
/events/parent/:id/edit             → EventParentEditScreen
/events/date/new/:parentId          → EventDateEditScreen
/events/date/:id/edit               → EventDateEditScreen
```

---

## 🎨 Diseño y UX

### **Paleta:**
- Coral (#FF3D57) → Acciones, ritmos
- Naranja (#FF8C42) → Hover, borrador
- Amarillo (#FFD166) → Zonas
- Azul (#1E88E5) → Organizador
- Carbón (#121212) → Fondo
- Blanco (#F5F5F5) → Texto

### **Patrones UI:**
- Gradientes: `linear-gradient(135deg, color1, color2)`
- Glassmorphism: `backdrop-filter: blur(20px)`
- Bordes redondeados: 12px (inputs), 20px (chips), 50px (botones)
- Sombras con color: `0 8px 24px rgba(color, 0.5)`

### **Animaciones:**
- Fade-in + slide-up en entrada
- Scale en hover (1.02-1.05)
- Glow effect en chips
- Smooth transitions (0.3s ease)

---

## 🔧 Integraciones

### **Supabase:**
- ✅ Auth (useAuth)
- ✅ Storage (avatars en bucket AVATARS)
- ✅ Database (profiles_user, profiles_organizer, events_parent, events_date)
- ✅ RLS policies

### **React Query:**
- ✅ Cache automático
- ✅ Invalidación en mutations
- ✅ Loading/error states

### **Framer Motion:**
- ✅ Entry animations
- ✅ Hover/tap interactions
- ✅ AnimatePresence
- ✅ Motion variants

---

## 📝 Notas Técnicas

### **Upload de Avatar:**
```typescript
// En UserProfileEditor
1. Usuario selecciona archivo
2. Preview con FileReader
3. Upload a Supabase Storage (bucket AVATARS)
4. Cache busting: ?t=${Date.now()}
5. Actualiza profile.avatar_url
```

### **Multi-select de Tags:**
```typescript
// Toggle pattern
const toggleRitmo = (id: number) => {
  if (selected.includes(id)) {
    setSelected(selected.filter(r => r !== id));
  } else {
    setSelected([...selected, id]);
  }
};
```

### **Renderizado Condicional:**
```typescript
// ProfileScreen.tsx
{activeRole === 'usuario' && mode === 'live' && <UserProfileLive />}
{activeRole === 'usuario' && mode === 'edit' && <UserProfileEditor />}
{activeRole === 'organizador' && mode === 'live' && <OrganizerProfileLive />}
{activeRole === 'organizador' && mode === 'edit' && <OrganizerProfileEditor />}
```

---

## 🚀 Cómo Usar

### **1. Acceder al Perfil:**
```
http://localhost:5173/app/profile
```

### **2. Alternar Modos:**
- **Editar:** Clic en `[✏️ Editar]` (bottom)
- **Ver Live:** Clic en `[👁️ Ver Live]` (bottom)

### **3. Switch de Rol (si tienes organizador):**
- **Usuario:** Clic en `[👤 Usuario]`
- **Organizador:** Clic en `[🎤 Organizador]`

### **4. Crear Evento:**
```
1. Switch a "Organizador"
2. Clic "Editar"
3. Clic "+ Nuevo Evento"
4. Llenar formulario
5. Guardar
```

### **5. Aprobar Organizador (SQL):**
```sql
UPDATE profiles_organizer 
SET estado_aprobacion = 'aprobado' 
WHERE user_id = auth.uid();
```

---

## 🐛 Troubleshooting

### **No aparece el switch de organizador:**
- Verifica que tengas un perfil de organizador creado
- Ejecuta: `SELECT * FROM profiles_organizer WHERE user_id = auth.uid();`

### **Los chips muestran IDs en lugar de nombres:**
- Verifica que `useTags()` esté funcionando
- Revisa que la tabla `tags` tenga datos

### **Error al guardar avatar:**
- Verifica que el bucket `AVATARS` exista
- Revisa las políticas RLS del bucket

### **Eventos no aparecen:**
- Verifica que el organizador esté aprobado
- Verifica que las fechas estén publicadas

---

## 📚 Archivos del Sprint 3

### **Creados:**
1. `apps/web/src/hooks/useProfileSwitch.ts`
2. `apps/web/src/components/ProfileSwitcher.tsx`
3. `apps/web/src/screens/profile/UserProfileEditor.tsx`
4. `apps/web/src/screens/profile/UserProfileLive.tsx`
5. `apps/web/src/screens/profile/OrganizerProfileEditor.tsx`
6. `apps/web/src/screens/profile/OrganizerProfileLive.tsx`
7. `apps/web/src/screens/profile/EventEditor.tsx`
8. `apps/web/src/screens/profile/EventDateEditor.tsx`
9. `apps/web/SPRINT3.md`

### **Modificados:**
1. `apps/web/src/screens/profile/ProfileScreen.tsx`
2. `apps/web/src/router.tsx`

---

## 📈 Métricas del Sprint

- **Archivos Creados:** 9
- **Archivos Modificados:** 2
- **Líneas de Código:** ~2,000+
- **Componentes:** 8
- **Hooks:** 1
- **Vistas:** 6
- **Rutas:** 6 nuevas

---

## 🎯 Definition of Done

- [x] Hook useProfileSwitch funcional
- [x] Switch visual Usuario ↔ Organizador
- [x] Switch visual Live ↔ Edit
- [x] UserProfileLive con diseño moderno
- [x] UserProfileEditor con todos los campos
- [x] OrganizerProfileLive con tabs
- [x] OrganizerProfileEditor con lista de eventos
- [x] EventEditor (crear/editar)
- [x] EventDateEditor (crear/editar)
- [x] Jerarquía: Organizador → Evento → Fecha
- [x] Navegación integrada
- [x] Chips muestran nombres reales
- [x] Iconos SVG de redes sociales
- [x] Sin errores de linting
- [x] Documentación completa

---

## 🌟 Highlights

### **Diseño Moderno:**
- Inspirado en Tinder/Bumble
- Dark mode nativo
- Glassmorphism effects
- Gradientes vibrantes

### **UX Intuitiva:**
- Switch fácil entre roles y modos
- Preview en tiempo real
- Multi-select visual
- Toast notifications
- Loading states

### **Arquitectura Limpia:**
- Separación de Live y Edit
- Hooks reutilizables
- Componentes atómicos
- Router organizado

### **Performance:**
- React Query cache
- Lazy loading de imágenes
- Animaciones optimizadas
- HMR instantáneo

---

## 🎊 **¡SPRINT 3 COMPLETADO!**

Tu aplicación ahora tiene un sistema completo de perfiles dinámicos con:
- ✅ Switch Usuario ↔ Organizador
- ✅ Modos Live y Edit
- ✅ Diseño tipo Tinder/Bumble
- ✅ Jerarquía completa de eventos
- ✅ Editores inline modernos
- ✅ Animaciones fluidas
- ✅ Componentes reutilizables

---

**Desarrollado con ❤️ para BaileApp**
*Fecha: 21 de Octubre, 2025*
