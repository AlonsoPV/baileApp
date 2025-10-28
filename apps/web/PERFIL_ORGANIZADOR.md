# 📋 Perfil Organizador - Documentación Completa

## 🎯 Descripción General
El perfil de Organizador permite a los usuarios crear y gestionar eventos de baile, incluyendo eventos padre (sociales) y fechas específicas. Es el perfil más completo del sistema con funcionalidades avanzadas de gestión de eventos.

## 🛣️ Rutas Principales

### Rutas Públicas (Live)
- **`/organizer/:id`** - Vista pública del organizador
- **`/organizador/:organizerId`** - Vista pública alternativa
- **`/profile/organizer`** - Vista live del perfil propio

### Rutas de Edición (Protected)
- **`/profile/organizer/edit`** - Editor principal del perfil
- **`/events/parent/new`** - Crear nuevo evento padre
- **`/events/parent/:id/edit`** - Editar evento padre existente
- **`/events/date/new/:parentId`** - Crear nueva fecha de evento
- **`/events/date/:id/edit`** - Editar fecha de evento existente
- **`/social/new`** - Crear nuevo evento social
- **`/social/:parentId/edit`** - Editar evento social
- **`/social/:parentId/fecha/nueva`** - Crear nueva fecha para evento social
- **`/social/fecha/:dateId/edit`** - Editar fecha de evento social

## 🧩 Componentes Principales

### Componentes de Perfil
- **`OrganizerProfileEditor.tsx`** - Editor principal del perfil
- **`OrganizerProfileLive.tsx`** - Vista pública del perfil
- **`OrganizerPublicScreen.tsx`** - Pantalla pública completa
- **`ProfileNavigationToggle.tsx`** - Navegación entre vista live/edit

### Componentes de Gestión de Contenido
- **`MediaUploader.tsx`** - Subida de archivos multimedia
- **`MediaGrid.tsx`** - Visualización de galería de medios
- **`PhotoManagementSection.tsx`** - Gestión de fotos por slots
- **`VideoManagementSection.tsx`** - Gestión de videos por slots
- **`SocialMediaSection.tsx`** - Gestión de redes sociales
- **`InvitedMastersSection.tsx`** - Gestión de maestros invitados

### Componentes de Eventos
- **`EventCardSmall.tsx`** - Cards pequeñas de eventos
- **`EventDateCard.tsx`** - Cards de fechas específicas
- **`EventScheduleEditor.tsx`** - Editor de cronogramas
- **`EventPriceEditor.tsx`** - Editor de precios

### Componentes de UI
- **`Chip.tsx`** - Tags/chips para estilos y zonas
- **`Breadcrumbs.tsx`** - Navegación breadcrumb
- **`ProfileToolbar.tsx`** - Barra de herramientas del perfil
- **`ProfileHero.tsx`** - Sección hero del perfil

## 🎨 Estructura y Diseño

### Vista de Edición (`OrganizerProfileEditor`)
```
┌─────────────────────────────────────────┐
│ ProfileNavigationToggle                  │
├─────────────────────────────────────────┤
│ ProfileHero (Avatar + Info básica)       │
├─────────────────────────────────────────┤
│ Información Básica                       │
│ - Nombre público                         │
│ - Bio                                   │
│ - Estilos/Zonas (Chips)                 │
├─────────────────────────────────────────┤
│ Redes Sociales                          │
│ - Instagram, Facebook, WhatsApp          │
├─────────────────────────────────────────┤
│ Gestión de Medios                       │
│ - PhotoManagementSection                 │
│ - VideoManagementSection                 │
├─────────────────────────────────────────┤
│ Eventos Padre                           │
│ - Lista de eventos sociales              │
│ - Botón "Crear Nuevo"                   │
├─────────────────────────────────────────┤
│ Maestros Invitados                      │
│ - InvitedMastersSection                  │
└─────────────────────────────────────────┘
```

### Vista Pública (`OrganizerProfileLive`)
```
┌─────────────────────────────────────────┐
│ ProfileNavigationToggle                  │
├─────────────────────────────────────────┤
│ ProfileHero (Avatar + Info básica)       │
├─────────────────────────────────────────┤
│ Información del Organizador              │
│ - Nombre público                         │
│ - Bio                                   │
│ - Estilos/Zonas (Chips)                  │
├─────────────────────────────────────────┤
│ Redes Sociales                          │
│ - Enlaces a redes sociales               │
├─────────────────────────────────────────┤
│ Galería de Medios                       │
│ - MediaGrid con fotos/videos            │
├─────────────────────────────────────────┤
│ Eventos Activos                         │
│ - Lista de eventos padre                │
│ - Cards con fechas próximas             │
├─────────────────────────────────────────┤
│ Maestros Colaboradores                  │
│ - Lista de maestros invitados            │
└─────────────────────────────────────────┘
```

## 📊 Datos y Campos

### Campos Principales
- **`nombre_publico`** - Nombre visible públicamente
- **`bio`** - Biografía del organizador
- **`estilos`** - Array de IDs de estilos de baile
- **`zonas`** - Array de IDs de zonas geográficas
- **`redes_sociales`** - Objeto con redes sociales
- **`media`** - Objeto con slots de fotos/videos
- **`estado_aprobacion`** - Estado de aprobación del perfil

### Redes Sociales
```typescript
redes_sociales: {
  instagram: string;
  facebook: string;
  whatsapp: string;
}
```

### Media Slots
```typescript
media: {
  avatar_url: string;
  portada_url: string;
  foto_1: string;
  foto_2: string;
  // ... más slots de fotos
  video_1: string;
  video_2: string;
  // ... más slots de videos
}
```

## 🔧 Funcionalidades Específicas

### Gestión de Eventos
1. **Crear Evento Padre** - Evento social base
2. **Crear Fechas** - Fechas específicas del evento
3. **Editar Eventos** - Modificar eventos existentes
4. **Gestión de Cronogramas** - Horarios y actividades
5. **Gestión de Precios** - Costos y paquetes

### Gestión de Medios
1. **Slots de Fotos** - Sistema de slots predefinidos
2. **Slots de Videos** - Sistema de slots para videos
3. **Avatar y Portada** - Imágenes principales del perfil
4. **Galería Pública** - Visualización en vista live

### Gestión de Colaboradores
1. **Maestros Invitados** - Sistema de invitaciones
2. **Colaboradores** - Gestión de equipo
3. **Permisos** - Control de acceso

## 🎨 Paleta de Colores
```css
colors: {
  coral: '#FF3D57',
  orange: '#FF8C42', 
  yellow: '#FFD166',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5'
}
```

## 🔗 Hooks y Estado

### Hooks Principales
- **`useMyOrganizer`** - Datos del organizador actual
- **`useUpsertMyOrganizer`** - Guardar cambios del perfil
- **`useSubmitOrganizerForReview`** - Enviar para aprobación
- **`useOrganizerMedia`** - Gestión de medios
- **`useParentsByOrganizer`** - Eventos padre del organizador
- **`useDatesByParent`** - Fechas de eventos específicos
- **`useHydratedForm`** - Formulario con borrador persistente

### Estado de Aprobación
- **`borrador`** - Perfil en edición
- **`pendiente`** - Enviado para revisión
- **`aprobado`** - Perfil público visible
- **`rechazado`** - Requiere correcciones

## 📱 Responsive Design
- **Mobile First** - Diseño optimizado para móviles
- **Breakpoints** - Adaptación a diferentes pantallas
- **Touch Friendly** - Interacciones táctiles optimizadas
- **Grid Layout** - Sistema de grid responsivo

## 🔒 Permisos y Seguridad
- **Autenticación Requerida** - Solo usuarios autenticados
- **OnboardingGate** - Verificación de perfil completo
- **RLS (Row Level Security)** - Seguridad a nivel de fila
- **Validación de Datos** - Validación frontend y backend

## 🚀 Flujo de Trabajo

### Creación de Perfil
1. Usuario se registra como organizador
2. Completa información básica
3. Sube medios (avatar, fotos)
4. Configura redes sociales
5. Envía para aprobación
6. Admin aprueba/rechaza
7. Perfil se vuelve público

### Gestión de Eventos
1. Crear evento padre (social)
2. Configurar información básica
3. Crear fechas específicas
4. Configurar cronogramas y precios
5. Invitar maestros colaboradores
6. Publicar eventos
7. Gestionar RSVPs

## 📈 Métricas y Analytics
- **Vistas del Perfil** - Contador de visitas
- **Eventos Creados** - Estadísticas de eventos
- **RSVPs Totales** - Participación en eventos
- **Maestros Colaboradores** - Red de colaboración

---

*Documentación actualizada: $(date)*
*Versión: 1.0*
