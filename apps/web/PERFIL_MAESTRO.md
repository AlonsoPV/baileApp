# 👨‍🏫 Perfil Maestro - Documentación Completa

## 🎯 Descripción General
El perfil de Maestro permite a los instructores de baile mostrar su experiencia, especialidades y colaboraciones. Es un perfil profesional enfocado en la enseñanza y colaboración con organizadores.

## 🛣️ Rutas Principales

### Rutas Públicas (Live)
- **`/maestro/:teacherId`** - Vista pública del maestro
- **`/profile/teacher/live`** - Vista live del perfil propio

### Rutas de Edición (Protected)
- **`/profile/teacher`** - Editor principal del perfil
- **`/profile/teacher/edit`** - Editor alternativo del perfil

## 🧩 Componentes Principales

### Componentes de Perfil
- **`TeacherProfileEditor.tsx`** - Editor principal del perfil
- **`TeacherProfileLive.tsx`** - Vista pública del perfil
- **`ProfileNavigationToggle.tsx`** - Navegación entre vista live/edit

### Componentes de Gestión de Contenido
- **`MediaUploader.tsx`** - Subida de archivos multimedia
- **`MediaGrid.tsx`** - Visualización de galería de medios
- **`PhotoManagementSection.tsx`** - Gestión de fotos por slots
- **`VideoManagementSection.tsx`** - Gestión de videos por slots
- **`SocialMediaSection.tsx`** - Gestión de redes sociales

### Componentes de UI
- **`Chip.tsx`** - Tags/chips para ritmos y zonas
- **`ProfileToolbar.tsx`** - Barra de herramientas del perfil
- **`ProfileHero.tsx`** - Sección hero del perfil

## 🎨 Estructura y Diseño

### Vista de Edición (`TeacherProfileEditor`)
```
┌─────────────────────────────────────────┐
│ ProfileNavigationToggle                  │
├─────────────────────────────────────────┤
│ ProfileHero (Avatar + Info básica)       │
├─────────────────────────────────────────┤
│ Información Básica                       │
│ - Nombre público                         │
│ - Bio                                   │
│ - Ritmos/Zonas (Chips)                  │
├─────────────────────────────────────────┤
│ Redes Sociales                          │
│ - Instagram, Facebook, WhatsApp          │
├─────────────────────────────────────────┤
│ Gestión de Medios                       │
│ - PhotoManagementSection                 │
│ - VideoManagementSection                 │
├─────────────────────────────────────────┤
│ Información Profesional                 │
│ - Experiencia                           │
│ - Especialidades                        │
│ - Certificaciones                       │
└─────────────────────────────────────────┘
```

### Vista Pública (`TeacherProfileLive`)
```
┌─────────────────────────────────────────┐
│ ProfileNavigationToggle                  │
├─────────────────────────────────────────┤
│ ProfileHero (Avatar + Info básica)       │
├─────────────────────────────────────────┤
│ Información del Maestro                  │
│ - Nombre público                         │
│ - Bio                                   │
│ - Ritmos/Zonas (Chips)                   │
├─────────────────────────────────────────┤
│ Redes Sociales                          │
│ - Enlaces a redes sociales               │
├─────────────────────────────────────────┤
│ Galería de Medios                       │
│ - MediaGrid con fotos/videos            │
├─────────────────────────────────────────┤
│ Información Profesional                 │
│ - Experiencia y especialidades          │
│ - Certificaciones                       │
├─────────────────────────────────────────┤
│ Colaboraciones                          │
│ - Eventos donde ha participado          │
│ - Organizadores colaborados              │
└─────────────────────────────────────────┘
```

## 📊 Datos y Campos

### Campos Principales
- **`nombre_publico`** - Nombre visible públicamente
- **`bio`** - Biografía del maestro
- **`ritmos`** - Array de IDs de ritmos que enseña
- **`zonas`** - Array de IDs de zonas donde enseña
- **`redes_sociales`** - Objeto con redes sociales
- **`media`** - Objeto con slots de fotos/videos
- **`estado_aprobacion`** - Estado de aprobación del perfil
- **`experiencia`** - Años de experiencia
- **`especialidades`** - Especialidades específicas
- **`certificaciones`** - Certificaciones obtenidas

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

### Gestión de Perfil Profesional
1. **Información Básica** - Nombre, bio, especialidades
2. **Ritmos y Zonas** - Especialidades geográficas y musicales
3. **Experiencia** - Años de experiencia y logros
4. **Certificaciones** - Certificaciones profesionales

### Gestión de Medios
1. **Slots de Fotos** - Sistema de slots predefinidos
2. **Slots de Videos** - Sistema de slots para videos
3. **Avatar y Portada** - Imágenes principales del perfil
4. **Galería Pública** - Visualización en vista live

### Colaboraciones
1. **Eventos Participados** - Historial de colaboraciones
2. **Organizadores Colaborados** - Red de contactos
3. **Disponibilidad** - Estados de disponibilidad

## 🎨 Paleta de Colores
```css
colors: {
  primary: '#1E88E5',
  secondary: '#7C4DFF',
  accent: '#FFD166',
  dark: '#121212',
  light: '#F5F5F5',
  success: '#4CAF50'
}
```

## 🔗 Hooks y Estado

### Hooks Principales
- **`useTeacherMy`** - Datos del maestro actual
- **`useTeacherPublic`** - Datos públicos de un maestro específico
- **`useUpsertTeacher`** - Guardar cambios del perfil
- **`useTeacherMedia`** - Gestión de medios
- **`useHydratedForm`** - Formulario con borrador persistente
- **`useTags`** - Tags de ritmos y zonas

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
1. Usuario se registra como maestro
2. Completa información básica
3. Selecciona ritmos y zonas de especialidad
4. Sube medios (avatar, fotos, videos)
5. Configura redes sociales
6. Envía para aprobación
7. Admin aprueba/rechaza
8. Perfil se vuelve público

### Gestión de Colaboraciones
1. Organizadores invitan maestros
2. Maestros aceptan/rechazan invitaciones
3. Se registran colaboraciones
4. Se muestran en perfil público
5. Se generan métricas de colaboración

## 📈 Métricas y Analytics
- **Vistas del Perfil** - Contador de visitas
- **Colaboraciones** - Número de eventos participados
- **Organizadores Colaborados** - Red de contactos
- **Especialidades Populares** - Ritmos más solicitados

## 🎓 Especialidades y Ritmos

### Ritmos Disponibles
- Salsa, Bachata, Merengue
- Reggaeton, Hip Hop
- Tango, Vals
- Cumbia, Vallenato
- Y más...

### Zonas Geográficas
- Bogotá, Medellín, Cali
- Barranquilla, Cartagena
- Bucaramanga, Pereira
- Y más ciudades...

## 🤝 Sistema de Colaboraciones

### Invitaciones de Organizadores
1. Organizador busca maestros por especialidad
2. Envía invitación a evento específico
3. Maestro recibe notificación
4. Acepta/rechaza colaboración
5. Se registra en el sistema

### Gestión de Disponibilidad
1. Maestro marca disponibilidad
2. Organizadores ven maestros disponibles
3. Sistema de filtros por especialidad
4. Calendario de colaboraciones

## 📋 Formularios y Validaciones

### Campos Requeridos
- Nombre público
- Bio (mínimo 50 caracteres)
- Al menos un ritmo seleccionado
- Al menos una zona seleccionada
- Avatar subido

### Validaciones Específicas
- URLs de redes sociales válidas
- Formato de teléfono WhatsApp
- Tamaño y formato de imágenes
- Duración máxima de videos

---

*Documentación actualizada: $(date)*
*Versión: 1.0*
