# 🏫 Perfil Academia - Documentación Completa

## 🎯 Descripción General
El perfil de Academia permite a las escuelas de baile mostrar sus instalaciones, programas, maestros y servicios. Es un perfil institucional enfocado en la educación y formación de bailarines.

## 🛣️ Rutas Principales

### Rutas Públicas (Live)
- **`/academia/:academyId`** - Vista pública de la academia
- **`/profile/academy/live`** - Vista live del perfil propio

### Rutas de Edición (Protected)
- **`/profile/academy`** - Editor principal del perfil
- **`/profile/academy/edit`** - Editor alternativo del perfil

## 🧩 Componentes Principales

### Componentes de Perfil
- **`AcademyEditorScreen.tsx`** - Editor principal del perfil
- **`AcademyPublicScreen.tsx`** - Vista pública del perfil
- **`AcademyProfileLive.tsx`** - Vista live del perfil
- **`ProfileNavigationToggle.tsx`** - Navegación entre vista live/edit

### Componentes de Gestión de Contenido
- **`MediaUploader.tsx`** - Subida de archivos multimedia
- **`MediaGrid.tsx`** - Visualización de galería de medios
- **`PhotoManagementSection.tsx`** - Gestión de fotos por slots
- **`VideoManagementSection.tsx`** - Gestión de videos por slots
- **`SocialMediaSection.tsx`** - Gestión de redes sociales

### Componentes de UI
- **`Chip.tsx`** - Tags/chips para estilos y zonas
- **`ProfileToolbar.tsx`** - Barra de herramientas del perfil
- **`ProfileHero.tsx`** - Sección hero del perfil

## 🎨 Estructura y Diseño

### Vista de Edición (`AcademyEditorScreen`)
```
┌─────────────────────────────────────────┐
│ ProfileNavigationToggle                  │
├─────────────────────────────────────────┤
│ ProfileHero (Logo + Info básica)         │
├─────────────────────────────────────────┤
│ Información Básica                       │
│ - Nombre público                         │
│ - Bio                                   │
│ - Estilos/Zonas (Chips)                  │
├─────────────────────────────────────────┤
│ Redes Sociales                          │
│ - Instagram, Facebook, WhatsApp          │
├─────────────────────────────────────────┤
│ Gestión de Medios                       │
│ - PhotoManagementSection                 │
│ - VideoManagementSection                 │
├─────────────────────────────────────────┤
│ Información Institucional               │
│ - Dirección                             │
│ - Teléfono                              │
│ - Horarios de atención                  │
│ - Servicios ofrecidos                   │
├─────────────────────────────────────────┤
│ Programas y Cursos                      │
│ - Programas disponibles                 │
│ - Niveles de enseñanza                  │
│ - Precios y paquetes                    │
└─────────────────────────────────────────┘
```

### Vista Pública (`AcademyPublicScreen`)
```
┌─────────────────────────────────────────┐
│ ProfileNavigationToggle                  │
├─────────────────────────────────────────┤
│ ProfileHero (Logo + Info básica)         │
├─────────────────────────────────────────┤
│ Información de la Academia              │
│ - Nombre público                         │
│ - Bio                                   │
│ - Estilos/Zonas (Chips)                  │
├─────────────────────────────────────────┤
│ Redes Sociales                          │
│ - Enlaces a redes sociales               │
├─────────────────────────────────────────┤
│ Galería de Medios                       │
│ - MediaGrid con fotos/videos            │
│ - Instalaciones                         │
│ - Clases en acción                      │
├─────────────────────────────────────────┤
│ Información de Contacto                  │
│ - Dirección completa                    │
│ - Teléfono y WhatsApp                   │
│ - Horarios de atención                  │
├─────────────────────────────────────────┤
│ Programas y Servicios                   │
│ - Programas disponibles                 │
│ - Niveles y modalidades                 │
│ - Precios y promociones                 │
├─────────────────────────────────────────┤
│ Maestros de la Academia                 │
│ - Lista de instructores                 │
│ - Especialidades de cada maestro        │
└─────────────────────────────────────────┘
```

## 📊 Datos y Campos

### Campos Principales
- **`nombre_publico`** - Nombre visible públicamente
- **`bio`** - Descripción de la academia
- **`estilos`** - Array de IDs de estilos que enseñan
- **`zonas`** - Array de IDs de zonas donde operan
- **`redes_sociales`** - Objeto con redes sociales
- **`media`** - Objeto con slots de fotos/videos
- **`estado_aprobacion`** - Estado de aprobación del perfil
- **`direccion`** - Dirección física de la academia
- **`telefono`** - Número de contacto
- **`horarios`** - Horarios de atención
- **`servicios`** - Servicios ofrecidos

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
  avatar_url: string;        // Logo de la academia
  portada_url: string;       // Imagen de portada
  foto_1: string;           // Instalaciones
  foto_2: string;           // Clases en acción
  foto_3: string;           // Eventos especiales
  // ... más slots de fotos
  video_1: string;          // Video promocional
  video_2: string;          // Clases de muestra
  // ... más slots de videos
}
```

## 🔧 Funcionalidades Específicas

### Gestión Institucional
1. **Información Básica** - Nombre, descripción, especialidades
2. **Ubicación y Contacto** - Dirección, teléfono, horarios
3. **Servicios** - Programas y servicios ofrecidos
4. **Precios** - Tarifas y paquetes

### Gestión de Medios
1. **Slots de Fotos** - Sistema de slots predefinidos
2. **Slots de Videos** - Sistema de slots para videos
3. **Logo y Portada** - Imágenes principales del perfil
4. **Galería Institucional** - Visualización en vista live

### Gestión de Maestros
1. **Maestros de la Academia** - Lista de instructores
2. **Especialidades** - Especialidades de cada maestro
3. **Disponibilidad** - Horarios de cada maestro
4. **Programas** - Programas que enseña cada maestro

## 🎨 Paleta de Colores
```css
colors: {
  primary: '#1E88E5',
  secondary: '#7C4DFF',
  accent: '#FFD166',
  dark: '#121212',
  light: '#F5F5F5',
  success: '#4CAF50',
  orange: '#FF9800'
}
```

## 🔗 Hooks y Estado

### Hooks Principales
- **`useAcademyMy`** - Datos de la academia actual
- **`useAcademyPublic`** - Datos públicos de una academia específica
- **`useUpsertAcademy`** - Guardar cambios del perfil
- **`useSubmitAcademyForReview`** - Enviar para aprobación
- **`useAcademyMedia`** - Gestión de medios
- **`useHydratedForm`** - Formulario con borrador persistente
- **`useTags`** - Tags de estilos y zonas

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
1. Usuario se registra como academia
2. Completa información básica
3. Selecciona estilos y zonas de operación
4. Sube medios (logo, fotos, videos)
5. Configura redes sociales
6. Define servicios y precios
7. Envía para aprobación
8. Admin aprueba/rechaza
9. Perfil se vuelve público

### Gestión de Servicios
1. Define programas disponibles
2. Establece niveles de enseñanza
3. Configura precios y paquetes
4. Actualiza horarios de atención
5. Gestiona maestros asociados

## 📈 Métricas y Analytics
- **Vistas del Perfil** - Contador de visitas
- **Servicios Populares** - Programas más consultados
- **Maestros Asociados** - Número de instructores
- **Ubicaciones** - Zonas de mayor interés

## 🎓 Programas y Servicios

### Tipos de Programas
- Clases grupales
- Clases privadas
- Talleres especializados
- Cursos intensivos
- Eventos sociales
- Competencias

### Niveles de Enseñanza
- Principiantes
- Intermedio
- Avanzado
- Profesional
- Instructor

## 📍 Información de Ubicación

### Campos de Ubicación
- **Dirección completa** - Dirección física
- **Ciudad y zona** - Ubicación geográfica
- **Referencias** - Puntos de referencia
- **Transporte** - Acceso en transporte público
- **Estacionamiento** - Disponibilidad de parqueo

### Horarios de Atención
- **Días de la semana** - Días de operación
- **Horarios de clases** - Horarios específicos
- **Horarios administrativos** - Horarios de oficina
- **Días festivos** - Cierre en días especiales

## 🤝 Sistema de Maestros

### Gestión de Instructores
1. Registrar maestros asociados
2. Asignar especialidades
3. Definir horarios de cada maestro
4. Gestionar programas por maestro
5. Mostrar en perfil público

### Especialidades por Maestro
- Ritmos específicos
- Niveles de enseñanza
- Modalidades (grupal/privada)
- Experiencia y certificaciones

## 📋 Formularios y Validaciones

### Campos Requeridos
- Nombre público
- Bio (mínimo 100 caracteres)
- Al menos un estilo seleccionado
- Al menos una zona seleccionada
- Logo subido
- Dirección completa
- Teléfono de contacto

### Validaciones Específicas
- URLs de redes sociales válidas
- Formato de teléfono válido
- Dirección completa y válida
- Tamaño y formato de imágenes
- Duración máxima de videos

## 🏢 Información Institucional

### Datos Corporativos
- **Razón social** - Nombre legal
- **NIT/RUC** - Identificación fiscal
- **Representante legal** - Persona responsable
- **Años de experiencia** - Tiempo en el mercado

### Certificaciones
- **Certificaciones académicas** - Reconocimientos oficiales
- **Afiliaciones** - Asociaciones profesionales
- **Premios** - Reconocimientos recibidos
- **Acreditaciones** - Certificaciones de calidad

---

*Documentación actualizada: $(date)*
*Versión: 1.0*
