# 👤 Perfil Usuario - Documentación Completa

## 🎯 Descripción General
El perfil de Usuario es el perfil base para todos los bailarines en la plataforma. Permite mostrar información personal, preferencias de baile, fotos y videos, y gestionar RSVPs a eventos.

## 🛣️ Rutas Principales

### Rutas Públicas (Live)
- **`/u/:userId`** - Vista pública del usuario
- **`/profile`** - Vista live del perfil propio

### Rutas de Edición (Protected)
- **`/profile/edit`** - Editor principal del perfil
- **`/profile/settings`** - Configuraciones del perfil
- **`/profile/user/edit`** - Editor alternativo del perfil

### Rutas de Gestión
- **`/me/rsvps`** - Mis RSVPs a eventos
- **`/profile/roles`** - Selector de roles adicionales

## 🧩 Componentes Principales

### Componentes de Perfil
- **`UserProfileEditor.tsx`** - Editor principal del perfil
- **`UserProfileLive.tsx`** - Vista pública del perfil
- **`UserProfileLiveModern.tsx`** - Vista moderna del perfil
- **`ProfileScreen.tsx`** - Pantalla principal del perfil
- **`ProfileNavigationToggle.tsx`** - Navegación entre vista live/edit

### Componentes de Gestión de Contenido
- **`MediaUploader.tsx`** - Subida de archivos multimedia
- **`MediaGrid.tsx`** - Visualización de galería de medios
- **`PhotoManagementSection.tsx`** - Gestión de fotos por slots
- **`VideoManagementSection.tsx`** - Gestión de videos por slots
- **`SocialMediaSection.tsx`** - Gestión de redes sociales

### Componentes de Eventos
- **`MyRSVPsScreen.tsx`** - Pantalla de mis RSVPs
- **`EventCardSmall.tsx`** - Cards pequeñas de eventos
- **`RSVPCounter.tsx`** - Contador de RSVPs

### Componentes de UI
- **`Chip.tsx`** - Tags/chips para ritmos y zonas
- **`ProfileToolbar.tsx`** - Barra de herramientas del perfil
- **`ProfileHero.tsx`** - Sección hero del perfil
- **`DefaultProfileSelector.tsx`** - Selector de perfil por defecto

## 🎨 Estructura y Diseño

### Vista de Edición (`UserProfileEditor`)
```
┌─────────────────────────────────────────┐
│ ProfileNavigationToggle                  │
├─────────────────────────────────────────┤
│ ProfileHero (Avatar + Info básica)       │
├─────────────────────────────────────────┤
│ Información Personal                      │
│ - Nombre de usuario                       │
│ - Bio personal                           │
│ - Ritmos/Zonas preferidas (Chips)        │
├─────────────────────────────────────────┤
│ Redes Sociales                          │
│ - Instagram, TikTok, YouTube             │
│ - Facebook, WhatsApp                     │
├─────────────────────────────────────────┤
│ Gestión de Medios                       │
│ - PhotoManagementSection                 │
│ - VideoManagementSection                 │
├─────────────────────────────────────────┤
│ Información Adicional                   │
│ - Dato curioso                          │
│ - Por qué me gusta bailar               │
├─────────────────────────────────────────┤
│ Configuraciones                         │
│ - Perfil público/privado                │
│ - Notificaciones                        │
└─────────────────────────────────────────┘
```

### Vista Pública (`UserProfileLive`)
```
┌─────────────────────────────────────────┐
│ ProfileNavigationToggle                  │
├─────────────────────────────────────────┤
│ ProfileHero (Avatar + Info básica)       │
├─────────────────────────────────────────┤
│ Información del Usuario                  │
│ - Nombre de usuario                      │
│ - Bio personal                          │
│ - Ritmos/Zonas preferidas (Chips)        │
├─────────────────────────────────────────┤
│ Redes Sociales                          │
│ - Enlaces a redes sociales               │
├─────────────────────────────────────────┤
│ Galería de Medios                       │
│ - MediaGrid con fotos/videos            │
│ - Momentos de baile                     │
│ - Eventos participados                  │
├─────────────────────────────────────────┤
│ Información Personal                    │
│ - Dato curioso                          │
│ - Por qué me gusta bailar               │
├─────────────────────────────────────────┤
│ Actividad Reciente                      │
│ - RSVPs a eventos                       │
│ - Eventos favoritos                     │
│ - Logros y badges                       │
└─────────────────────────────────────────┘
```

## 📊 Datos y Campos

### Campos Principales
- **`display_name`** - Nombre visible públicamente
- **`bio`** - Biografía personal
- **`ritmos`** - Array de IDs de ritmos preferidos
- **`zonas`** - Array de IDs de zonas de interés
- **`redes_sociales`** - Objeto con redes sociales
- **`media`** - Objeto con slots de fotos/videos
- **`respuestas`** - Respuestas a preguntas personales

### Redes Sociales
```typescript
redes_sociales: {
  instagram: string;
  tiktok: string;
  youtube: string;
  facebook: string;
  whatsapp: string;
}
```

### Respuestas Personales
```typescript
respuestas: {
  redes: {
    instagram: string;
    tiktok: string;
    youtube: string;
    facebook: string;
    whatsapp: string;
  },
  dato_curioso: string;
  gusta_bailar: string;
}
```

### Media Slots
```typescript
media: {
  avatar_url: string;
  portada_url: string;
  foto_1: string;           // Foto de perfil principal
  foto_2: string;           // Momentos de baile
  foto_3: string;           // Eventos participados
  // ... más slots de fotos
  video_1: string;          // Video de baile
  video_2: string;          // Rutina favorita
  // ... más slots de videos
}
```

## 🔧 Funcionalidades Específicas

### Gestión Personal
1. **Información Básica** - Nombre, bio, preferencias
2. **Ritmos y Zonas** - Preferencias musicales y geográficas
3. **Redes Sociales** - Enlaces a perfiles sociales
4. **Medios Personales** - Fotos y videos de baile

### Gestión de RSVPs
1. **RSVP a Eventos** - Confirmar asistencia
2. **Mis RSVPs** - Lista de eventos confirmados
3. **Historial** - Eventos pasados asistidos
4. **Favoritos** - Eventos marcados como favoritos

### Gestión de Roles
1. **Perfil Base** - Usuario estándar
2. **Roles Adicionales** - Organizador, Maestro, Academia, Marca
3. **Cambio de Roles** - Switch entre perfiles
4. **Perfil Principal** - Definir perfil por defecto

## 🎨 Paleta de Colores
```css
colors: {
  primary: '#1E88E5',
  secondary: '#7C4DFF',
  accent: '#FFD166',
  dark: '#121212',
  light: '#F5F5F5',
  success: '#4CAF50',
  coral: '#FF3D57',
  orange: '#FF8C42'
}
```

## 🔗 Hooks y Estado

### Hooks Principales
- **`useUserProfile`** - Datos del usuario actual
- **`useUserMediaSlots`** - Gestión de medios del usuario
- **`useHydratedForm`** - Formulario con borrador persistente
- **`useRoleChange`** - Cambio entre roles
- **`useTags`** - Tags de ritmos y zonas
- **`useAuth`** - Autenticación del usuario

### Estado de Perfil
- **`borrador`** - Perfil en edición
- **`activo`** - Perfil público visible
- **`privado`** - Perfil solo visible para el usuario

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
1. Usuario se registra en la plataforma
2. Completa onboarding básico
3. Selecciona ritmos y zonas preferidas
4. Sube avatar y fotos personales
5. Configura redes sociales
6. Completa preguntas personales
7. Perfil se vuelve público automáticamente

### Gestión de RSVPs
1. Explora eventos disponibles
2. Ve detalles del evento
3. Confirma asistencia (RSVP)
4. Recibe confirmación
5. Ve evento en "Mis RSVPs"
6. Asiste al evento
7. Evento se marca como completado

## 📈 Métricas y Analytics
- **Vistas del Perfil** - Contador de visitas
- **RSVPs Totales** - Eventos confirmados
- **Eventos Asistidos** - Eventos completados
- **Ritmos Populares** - Ritmos más bailados

## 🎵 Preferencias de Baile

### Ritmos Disponibles
- Salsa, Bachata, Merengue
- Reggaeton, Hip Hop
- Tango, Vals
- Cumbia, Vallenato
- Kizomba, Zouk
- Y más...

### Zonas Geográficas
- Bogotá, Medellín, Cali
- Barranquilla, Cartagena
- Bucaramanga, Pereira
- Y más ciudades...

## 🎭 Sistema de RSVPs

### Funcionalidades de RSVP
1. **Confirmar Asistencia** - RSVP a eventos
2. **Cancelar RSVP** - Cancelar asistencia
3. **Lista de Espera** - Si el evento está lleno
4. **Recordatorios** - Notificaciones antes del evento
5. **Check-in** - Confirmar asistencia en el evento

### Estados de RSVP
- **Confirmado** - RSVP activo
- **Cancelado** - RSVP cancelado
- **Lista de Espera** - Esperando cupo
- **Asistido** - Evento completado
- **No Asistió** - No asistió al evento

## 📋 Formularios y Validaciones

### Campos Requeridos
- Nombre de usuario
- Bio (mínimo 30 caracteres)
- Al menos un ritmo seleccionado
- Al menos una zona seleccionada
- Avatar subido

### Validaciones Específicas
- URLs de redes sociales válidas
- Formato de teléfono WhatsApp
- Tamaño y formato de imágenes
- Duración máxima de videos
- Contenido apropiado en medios

## 🏆 Sistema de Logros

### Badges Disponibles
- **Primer RSVP** - Primer evento confirmado
- **Bailarín Activo** - 10 eventos asistidos
- **Social Butterfly** - 50 eventos asistidos
- **Maestro del Baile** - 100 eventos asistidos
- **Explorador** - Eventos en 5 zonas diferentes
- **Especialista** - Eventos en 5 ritmos diferentes

### Progreso
- **Nivel de Bailarín** - Basado en eventos asistidos
- **Experiencia** - Puntos por participación
- **Reconocimientos** - Badges especiales
- **Ranking** - Posición entre usuarios

## 🔄 Sistema de Roles

### Roles Disponibles
- **Usuario** - Perfil base (siempre activo)
- **Organizador** - Puede crear eventos
- **Maestro** - Puede enseñar y colaborar
- **Academia** - Puede ofrecer servicios
- **Marca** - Puede promocionar productos

### Cambio de Roles
1. Acceder a selector de roles
2. Seleccionar rol deseado
3. Completar información adicional
4. Enviar para aprobación (si aplica)
5. Activar nuevo rol
6. Switch entre perfiles

## 📱 Notificaciones

### Tipos de Notificaciones
- **Nuevos Eventos** - Eventos en zonas/ritmos preferidos
- **Recordatorios** - Antes de eventos confirmados
- **Confirmaciones** - RSVP confirmado/cancelado
- **Mensajes** - Mensajes de organizadores
- **Logros** - Nuevos badges obtenidos

### Configuración
- **Frecuencia** - Diaria, semanal, mensual
- **Canales** - Email, push, in-app
- **Filtros** - Solo eventos confirmados
- **Silenciar** - Desactivar notificaciones

---

*Documentación actualizada: $(date)*
*Versión: 1.0*
