# 📚 Componentes Disponibles - BaileApp

Este documento lista todos los componentes React disponibles en el proyecto BaileApp, organizados por categorías y con sus respectivas funcionalidades.

## 📁 Estructura de Componentes

```
src/components/
├── common/           # Componentes comunes reutilizables
├── events/          # Componentes específicos de eventos
├── explore/         # Componentes de exploración/búsqueda
├── profile/         # Componentes de perfiles
├── rsvp/           # Componentes de RSVP
└── [archivos raíz]  # Componentes generales
```

---

## 🔧 Componentes Comunes (`common/`)

### `ChipPicker.tsx`
**Propósito**: Selector de chips multi-selección para ritmos y zonas
- **Props**: `tipo`, `selected`, `onChange`, `label`, `placeholder`, `maxSelections`
- **Uso**: Selección de ritmos y zonas en formularios
- **Características**: Validación, límite de selecciones, chips visuales

### `FAQEditor.tsx`
**Propósito**: Editor de preguntas frecuentes (FAQ)
- **Props**: `faq`, `onChange`, `isEditable`
- **Uso**: Gestión de FAQ en perfiles y eventos
- **Características**: CRUD completo, validación, interfaz intuitiva

---

## 🎉 Componentes de Eventos (`events/`)

### `EventCreateForm.tsx`
**Propósito**: Formulario unificado para crear/editar eventos (padre y fecha)
- **Props**: `mode`, `parent/date`, `onSubmit`, `onSuccess`, `onCancel`
- **Modos**: `'parent'` (social) | `'date'` (fecha específica)
- **Características**: Formulario dual, validación, persistencia de borradores

### `EventCreateWizard.tsx`
**Propósito**: Wizard multi-paso para creación de eventos
- **Props**: `onSuccess`, `onCancel`, `showHeader`
- **Pasos**: Básico → Precios → Resumen
- **Características**: Navegación por pasos, validación progresiva

### `EventForm.tsx`
**Propósito**: Formulario base para eventos
- **Props**: `event`, `onSubmit`, `onCancel`, `isLoading`
- **Características**: Formulario completo con validación

### `EventDatesSection.tsx`
**Propósito**: Sección para gestionar fechas de eventos
- **Props**: `eventId`, `dates`, `onAdd`, `onEdit`, `onDelete`
- **Características**: Lista de fechas, acciones CRUD

### `EventPricingSection.tsx`
**Propósito**: Sección para gestionar precios de eventos
- **Props**: `eventId`, `prices`, `onAdd`, `onEdit`, `onDelete`
- **Características**: Gestión de precios y promociones

### `CostsEditor.tsx`
**Propósito**: Editor de costos y precios
- **Props**: `costs`, `onChange`, `isEditable`
- **Características**: CRUD de costos, validación de precios

### `ScheduleEditor.tsx`
**Propósito**: Editor de cronogramas/horarios
- **Props**: `schedule`, `onChange`, `isEditable`
- **Características**: Gestión de horarios, actividades

### `ShareButton.tsx`
**Propósito**: Botón para compartir eventos
- **Props**: `url`, `title`, `description`
- **Características**: Compartir en redes sociales, copiar enlace

### `RSVPCountsRow.tsx`
**Propósito**: Contador de RSVP para eventos
- **Props**: `eventId`, `counts`, `animated`
- **Características**: Contadores en tiempo real, animaciones

---

## 🔍 Componentes de Exploración (`explore/`)

### `FilterBar.tsx`
**Propósito**: Barra de filtros para búsqueda
- **Props**: `filters`, `onFiltersChange`, `onSearch`
- **Características**: Filtros por tipo, ritmos, zonas, fechas

### `FilterChips.tsx`
**Propósito**: Chips de filtros activos
- **Props**: `filters`, `onRemoveFilter`
- **Características**: Visualización de filtros activos, eliminación

### `InfiniteGrid.tsx`
**Propósito**: Grid infinito para listados
- **Props**: `items`, `renderItem`, `onLoadMore`, `hasMore`
- **Características**: Scroll infinito, renderizado optimizado

### `cards/EventCard.tsx`
**Propósito**: Tarjeta de evento para listados
- **Props**: `event`, `onClick`, `showActions`
- **Características**: Información del evento, acciones rápidas

### `cards/OrganizerCard.tsx`
**Propósito**: Tarjeta de organizador para listados
- **Props**: `organizer`, `onClick`, `showActions`
- **Características**: Información del organizador, enlaces

### `cards/TeacherCard.tsx`
**Propósito**: Tarjeta de maestro para listados
- **Props**: `teacher`, `onClick`, `showActions`
- **Características**: Información del maestro, especialidades

---

## 👤 Componentes de Perfil (`profile/`)

### `ProfileShell.tsx`
**Propósito**: Shell reutilizable para perfiles
- **Props**: `bannerGradient`, `avatar`, `title`, `subtitle`, `statusChip`, `chips`, `actions`, `children`
- **Características**: Layout consistente, personalizable

### `ProfileHero.tsx`
**Propósito**: Hero section de perfiles
- **Props**: `profile`, `isEditable`, `onEdit`
- **Características**: Banner, avatar, información básica

### `ProfileToolbar.tsx`
**Propósito**: Barra de herramientas de perfiles
- **Props**: `profile`, `isEditable`, `onEdit`, `onShare`
- **Características**: Acciones de perfil, navegación

### `ProfileNavigationToggle.tsx`
**Propósito**: Toggle de navegación entre vistas
- **Props**: `currentView`, `onViewChange`, `availableViews`
- **Características**: Cambio de vista, estados activos

### `SocialMediaSection.tsx`
**Propósito**: Sección de redes sociales
- **Props**: `data`, `onUpdate`, `isEditable`, `availablePlatforms`
- **Características**: Gestión de redes sociales, validación de URLs

### `InvitedMastersSection.tsx`
**Propósito**: Sección de maestros invitados
- **Props**: `masters`, `onInvite`, `onRemove`, `isEditable`
- **Características**: Gestión de invitaciones, estados

### `PhotoManagementSection.tsx`
**Propósito**: Gestión de fotos de perfil
- **Props**: `photos`, `onUpload`, `onRemove`, `onReorder`, `isEditable`
- **Características**: Upload, eliminación, reordenamiento

### `VideoManagementSection.tsx`
**Propósito**: Gestión de videos de perfil
- **Props**: `videos`, `onUpload`, `onRemove`, `onReorder`, `isEditable`
- **Características**: Upload, eliminación, reordenamiento

### `Chip.tsx`
**Propósito**: Chip visual reutilizable
- **Props**: `label`, `active`, `variant`, `onClick`
- **Variantes**: `'ritmo'`, `'zona'`
- **Características**: Estados visuales, interacciones

### `DefaultProfileSelector.tsx`
**Propósito**: Selector de perfil por defecto
- **Props**: `currentProfile`, `onProfileChange`, `availableProfiles`
- **Características**: Selección de perfil, persistencia

### `EventCardSmall.tsx`
**Propósito**: Tarjeta pequeña de evento
- **Props**: `event`, `onClick`, `showActions`
- **Características**: Vista compacta, acciones rápidas

### `GalleryGrid.tsx`
**Propósito**: Grid de galería de medios
- **Props**: `items`, `onItemClick`, `columns`
- **Características**: Grid responsivo, lightbox

---

## 🎫 Componentes de RSVP (`rsvp/`)

### `RSVPButtons.tsx`
**Propósito**: Botones de RSVP para eventos
- **Props**: `dateId`, `currentStatus`, `onStatusChange`
- **Estados**: `'voy'`, `'interesado'`, `'no_voy'`
- **Características**: Estados visuales, persistencia

---

## 🔧 Componentes Generales

### `AddToCalendarButton.tsx`
**Propósito**: Botón para agregar evento al calendario
- **Props**: `event`, `onAdd`
- **Características**: Generación de archivos .ics

### `Breadcrumbs.tsx`
**Propósito**: Navegación de migas de pan
- **Props**: `items`, `onItemClick`
- **Características**: Navegación jerárquica

### `EventDateCard.tsx`
**Propósito**: Tarjeta de fecha de evento
- **Props**: `date`, `onClick`, `showActions`
- **Características**: Información de fecha, acciones

### `EventInviteStrip.tsx`
**Propósito**: Strip de invitaciones de eventos
- **Props**: `invites`, `onAccept`, `onDecline`
- **Características**: Gestión de invitaciones

### `EventPriceEditor.tsx`
**Propósito**: Editor de precios de eventos
- **Props**: `prices`, `onChange`, `isEditable`
- **Características**: CRUD de precios, validación

### `EventScheduleEditor.tsx`
**Propósito**: Editor de horarios de eventos
- **Props**: `schedule`, `onChange`, `isEditable`
- **Características**: Gestión de horarios, actividades

### `FilterBar.tsx`
**Propósito**: Barra de filtros general
- **Props**: `filters`, `onFiltersChange`
- **Características**: Filtros múltiples, búsqueda

### `ImageWithFallback.tsx`
**Propósito**: Imagen con fallback
- **Props**: `src`, `alt`, `fallback`, `style`
- **Características**: Manejo de errores, fallbacks

### `LiveLink.tsx`
**Propósito**: Enlace a vista live
- **Props**: `to`, `asCard`, `children`
- **Características**: Navegación a vistas públicas

### `MediaGrid.tsx`
**Propósito**: Grid de medios
- **Props**: `items`, `onItemClick`, `columns`
- **Características**: Grid responsivo, lightbox

### `MediaUploader.tsx`
**Propósito**: Uploader de medios
- **Props**: `onUpload`, `accept`, `multiple`
- **Características**: Drag & drop, validación de tipos

### `Navbar.tsx`
**Propósito**: Barra de navegación principal
- **Props**: `user`, `onMenuToggle`
- **Características**: Navegación, menú de usuario

### `ProtectedRoute.tsx`
**Propósito**: Ruta protegida por autenticación
- **Props**: `children`, `requireAuth`
- **Características**: Protección de rutas

### `RedirectIfAuthenticated.tsx`
**Propósito**: Redirección si está autenticado
- **Props**: `children`, `redirectTo`
- **Características**: Redirección condicional

### `RSVPButton.tsx`
**Propósito**: Botón de RSVP individual
- **Props**: `eventId`, `status`, `onStatusChange`
- **Características**: Estado único, persistencia

### `RSVPCounter.tsx`
**Propósito**: Contador de RSVP
- **Props**: `eventId`, `counts`, `animated`
- **Características**: Contadores en tiempo real

### `ShareLink.tsx`
**Propósito**: Enlace de compartir
- **Props**: `url`, `title`, `description`
- **Características**: Compartir en redes sociales

### `SimpleInterestButton.tsx`
**Propósito**: Botón de interés simple
- **Props**: `eventId`, `interested`, `onToggle`
- **Características**: Toggle de interés

### `TagChip.tsx`
**Propósito**: Chip de etiqueta
- **Props**: `tag`, `active`, `onClick`
- **Características**: Visualización de etiquetas

### `TagMultiSelect.tsx`
**Propósito**: Selector múltiple de etiquetas
- **Props**: `tags`, `selected`, `onChange`
- **Características**: Selección múltiple, validación

### `Toast.tsx`
**Propósito**: Sistema de notificaciones toast
- **Props**: `message`, `type`, `duration`
- **Tipos**: `'success'`, `'error'`, `'info'`, `'warning'`
- **Características**: Notificaciones temporales

### `UserList.tsx`
**Propósito**: Lista de usuarios
- **Props**: `users`, `onUserClick`, `showActions`
- **Características**: Lista interactiva

### `UserProfileLink.tsx`
**Propósito**: Enlace a perfil de usuario
- **Props**: `userId`, `userName`, `showAvatar`
- **Características**: Navegación a perfiles

---

## 🎨 Características Generales

### **Diseño Consistente**
- Todos los componentes siguen el sistema de colores de BaileApp
- Uso de `framer-motion` para animaciones
- Diseño responsivo y mobile-first

### **Accesibilidad**
- Componentes accesibles con ARIA labels
- Navegación por teclado
- Contraste adecuado

### **Reutilización**
- Componentes modulares y reutilizables
- Props tipadas con TypeScript
- Documentación clara de uso

### **Estado y Datos**
- Integración con React Query para datos
- Hooks personalizados para lógica
- Persistencia de estado local

---

## 📝 Notas de Uso

1. **Importación**: Todos los componentes están en `src/components/`
2. **Props**: Todos los componentes tienen props tipadas
3. **Estilos**: Usan el sistema de colores consistente
4. **Animaciones**: Integran `framer-motion` para transiciones
5. **Responsive**: Diseño adaptativo para móvil y desktop

---

## 🔄 Actualizaciones

Este documento se actualiza automáticamente cuando se agregan o modifican componentes en el proyecto. Para mantener la documentación actualizada, ejecuta el script de generación de documentación.

---

*Última actualización: $(date)*
*Total de componentes: 50+*
