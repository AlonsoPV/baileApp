# 🏷️ Perfil Marca - Documentación Completa

## 🎯 Descripción General
El perfil de Marca permite a empresas, tiendas y negocios relacionados con el baile mostrar sus productos, servicios y promociones. Es un perfil comercial enfocado en el marketing y ventas.

## 🛣️ Rutas Principales

### Rutas Públicas (Live)
- **`/marca/:brandId`** - Vista pública de la marca
- **`/profile/brand`** - Vista live del perfil propio

### Rutas de Edición (Protected)
- **`/profile/brand/edit`** - Editor principal del perfil
- **`/profile/brand`** - Editor alternativo del perfil

## 🧩 Componentes Principales

### Componentes de Perfil
- **`BrandProfileEditor.tsx`** - Editor principal del perfil
- **`BrandPublicScreen.tsx`** - Vista pública del perfil
- **`ProfileNavigationToggle.tsx`** - Navegación entre vista live/edit

### Componentes de Gestión de Contenido
- **`MediaUploader.tsx`** - Subida de archivos multimedia
- **`MediaGrid.tsx`** - Visualización de galería de medios
- **`PhotoManagementSection.tsx`** - Gestión de fotos por slots
- **`VideoManagementSection.tsx`** - Gestión de videos por slots
- **`SocialMediaSection.tsx`** - Gestión de redes sociales

### Componentes de UI
- **`Chip.tsx`** - Tags/chips para categorías y zonas
- **`ProfileToolbar.tsx`** - Barra de herramientas del perfil
- **`ProfileHero.tsx`** - Sección hero del perfil

## 🎨 Estructura y Diseño

### Vista de Edición (`BrandProfileEditor`)
```
┌─────────────────────────────────────────┐
│ ProfileNavigationToggle                  │
├─────────────────────────────────────────┤
│ ProfileHero (Logo + Info básica)         │
├─────────────────────────────────────────┤
│ Información de la Marca                  │
│ - Nombre de la marca                     │
│ - Descripción del negocio                │
│ - Categorías/Zonas (Chips)               │
├─────────────────────────────────────────┤
│ Redes Sociales                          │
│ - Instagram, Facebook, WhatsApp          │
│ - TikTok, YouTube                        │
├─────────────────────────────────────────┤
│ Gestión de Medios                       │
│ - PhotoManagementSection                 │
│ - VideoManagementSection                 │
├─────────────────────────────────────────┤
│ Información Comercial                   │
│ - Dirección                             │
│ - Teléfono                              │
│ - Horarios de atención                  │
│ - Servicios/productos ofrecidos         │
├─────────────────────────────────────────┤
│ Promociones y Ofertas                   │
│ - Promociones activas                   │
│ - Descuentos especiales                 │
│ - Eventos promocionales                  │
└─────────────────────────────────────────┘
```

### Vista Pública (`BrandPublicScreen`)
```
┌─────────────────────────────────────────┐
│ ProfileNavigationToggle                  │
├─────────────────────────────────────────┤
│ ProfileHero (Logo + Info básica)         │
├─────────────────────────────────────────┤
│ Información de la Marca                  │
│ - Nombre de la marca                     │
│ - Descripción del negocio                │
│ - Categorías/Zonas (Chips)                │
├─────────────────────────────────────────┤
│ Redes Sociales                          │
│ - Enlaces a redes sociales               │
├─────────────────────────────────────────┤
│ Galería de Productos                    │
│ - MediaGrid con productos                │
│ - Catálogo visual                        │
│ - Videos promocionales                   │
├─────────────────────────────────────────┤
│ Información de Contacto                  │
│ - Dirección completa                    │
│ - Teléfono y WhatsApp                   │
│ - Horarios de atención                  │
├─────────────────────────────────────────┤
│ Productos y Servicios                   │
│ - Catálogo de productos                 │
│ - Servicios ofrecidos                   │
│ - Precios y promociones                 │
├─────────────────────────────────────────┤
│ Promociones Activas                     │
│ - Ofertas especiales                     │
│ - Descuentos disponibles                │
│ - Eventos promocionales                  │
└─────────────────────────────────────────┘
```

## 📊 Datos y Campos

### Campos Principales
- **`nombre_publico`** - Nombre visible públicamente
- **`bio`** - Descripción del negocio
- **`categorias`** - Array de IDs de categorías de productos
- **`zonas`** - Array de IDs de zonas de operación
- **`redes_sociales`** - Objeto con redes sociales
- **`media`** - Objeto con slots de fotos/videos
- **`estado_aprobacion`** - Estado de aprobación del perfil
- **`direccion`** - Dirección física del negocio
- **`telefono`** - Número de contacto
- **`horarios`** - Horarios de atención
- **`servicios`** - Servicios/productos ofrecidos

### Redes Sociales
```typescript
redes_sociales: {
  instagram: string;
  facebook: string;
  whatsapp: string;
  tiktok: string;
  youtube: string;
}
```

### Media Slots
```typescript
media: {
  avatar_url: string;        // Logo de la marca
  portada_url: string;       // Imagen de portada
  foto_1: string;           // Productos destacados
  foto_2: string;           // Instalaciones/tienda
  foto_3: string;           // Eventos promocionales
  // ... más slots de fotos
  video_1: string;          // Video promocional
  video_2: string;          // Catálogo de productos
  // ... más slots de videos
}
```

## 🔧 Funcionalidades Específicas

### Gestión Comercial
1. **Información Básica** - Nombre, descripción, categorías
2. **Ubicación y Contacto** - Dirección, teléfono, horarios
3. **Productos/Servicios** - Catálogo y servicios ofrecidos
4. **Promociones** - Ofertas y descuentos especiales

### Gestión de Medios
1. **Slots de Fotos** - Sistema de slots predefinidos
2. **Slots de Videos** - Sistema de slots para videos
3. **Logo y Portada** - Imágenes principales del perfil
4. **Galería Comercial** - Visualización en vista live

### Gestión de Promociones
1. **Ofertas Especiales** - Descuentos y promociones
2. **Eventos Promocionales** - Eventos de la marca
3. **Cupones** - Códigos de descuento
4. **Temporadas** - Promociones estacionales

## 🎨 Paleta de Colores
```css
colors: {
  primary: '#1E88E5',
  secondary: '#7C4DFF',
  accent: '#FFD166',
  dark: '#121212',
  light: '#F5F5F5',
  success: '#4CAF50',
  warning: '#FF9800',
  brand: '#E91E63'
}
```

## 🔗 Hooks y Estado

### Hooks Principales
- **`useBrandMy`** - Datos de la marca actual
- **`useBrandPublic`** - Datos públicos de una marca específica
- **`useUpsertBrand`** - Guardar cambios del perfil
- **`useBrandMedia`** - Gestión de medios
- **`useHydratedForm`** - Formulario con borrador persistente
- **`useTags`** - Tags de categorías y zonas

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
1. Usuario se registra como marca
2. Completa información básica
3. Selecciona categorías y zonas de operación
4. Sube medios (logo, fotos, videos)
5. Configura redes sociales
6. Define productos y servicios
7. Configura promociones
8. Envía para aprobación
9. Admin aprueba/rechaza
10. Perfil se vuelve público

### Gestión de Promociones
1. Define promociones activas
2. Establece descuentos y ofertas
3. Configura eventos promocionales
4. Actualiza catálogo de productos
5. Gestiona cupones de descuento

## 📈 Métricas y Analytics
- **Vistas del Perfil** - Contador de visitas
- **Productos Populares** - Productos más consultados
- **Promociones Activas** - Ofertas en curso
- **Conversiones** - Ventas generadas

## 🛍️ Categorías de Productos

### Tipos de Productos
- **Ropa de Baile** - Vestidos, zapatos, accesorios
- **Equipos de Sonido** - Altavoces, micrófonos, mezcladoras
- **Iluminación** - Luces LED, efectos especiales
- **Decoración** - Elementos decorativos para eventos
- **Accesorios** - Complementos y accesorios
- **Servicios** - Servicios de fotografía, video, etc.

### Servicios Disponibles
- **Alquiler de Equipos** - Sonido, iluminación, decoración
- **Servicios de Eventos** - Organización, catering, fotografía
- **Clases Especializadas** - Talleres, cursos, capacitaciones
- **Consultoría** - Asesoría en organización de eventos

## 📍 Información de Ubicación

### Campos de Ubicación
- **Dirección completa** - Dirección física
- **Ciudad y zona** - Ubicación geográfica
- **Referencias** - Puntos de referencia
- **Transporte** - Acceso en transporte público
- **Estacionamiento** - Disponibilidad de parqueo

### Horarios de Atención
- **Días de la semana** - Días de operación
- **Horarios comerciales** - Horarios de atención
- **Horarios especiales** - Horarios extendidos
- **Días festivos** - Cierre en días especiales

## 🎯 Sistema de Promociones

### Tipos de Promociones
1. **Descuentos por Porcentaje** - % de descuento
2. **Descuentos Fijos** - Cantidad fija de descuento
3. **Compras Mínimas** - Descuento por compra mínima
4. **Productos Gratis** - Productos incluidos
5. **Envío Gratis** - Sin costo de envío

### Gestión de Cupones
1. **Códigos de Descuento** - Códigos únicos
2. **Cupones de Uso Único** - Un solo uso
3. **Cupones de Múltiples Usos** - Usos limitados
4. **Cupones por Tiempo** - Válidos por período
5. **Cupones por Usuario** - Específicos por usuario

## 📋 Formularios y Validaciones

### Campos Requeridos
- Nombre de la marca
- Bio (mínimo 100 caracteres)
- Al menos una categoría seleccionada
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
- Precios válidos para productos

## 🏢 Información Comercial

### Datos Corporativos
- **Razón social** - Nombre legal
- **NIT/RUC** - Identificación fiscal
- **Representante legal** - Persona responsable
- **Años de experiencia** - Tiempo en el mercado

### Certificaciones
- **Certificaciones comerciales** - Reconocimientos oficiales
- **Afiliaciones** - Asociaciones comerciales
- **Premios** - Reconocimientos recibidos
- **Acreditaciones** - Certificaciones de calidad

## 💰 Sistema de Precios

### Gestión de Precios
1. **Precios Regulares** - Precios estándar
2. **Precios Promocionales** - Precios con descuento
3. **Precios por Volumen** - Descuentos por cantidad
4. **Precios Estacionales** - Precios por temporada
5. **Precios por Zona** - Precios según ubicación

### Monedas Soportadas
- **Pesos Colombianos (COP)** - Moneda principal
- **Dólares Americanos (USD)** - Para productos importados
- **Euros (EUR)** - Para productos europeos

## 📊 Sistema de Inventario

### Gestión de Stock
1. **Productos Disponibles** - Stock actual
2. **Productos Agotados** - Sin stock
3. **Productos Próximos** - Próximos a llegar
4. **Productos Descontinuados** - Ya no disponibles

### Alertas de Stock
1. **Stock Bajo** - Alerta cuando queda poco
2. **Stock Agotado** - Notificación de agotamiento
3. **Nuevos Productos** - Notificación de llegada
4. **Promociones de Liquidación** - Para productos próximos a vencer

## 🎪 Eventos Promocionales

### Tipos de Eventos
- **Lanzamientos de Productos** - Nuevos productos
- **Ferias Comerciales** - Participación en ferias
- **Eventos de Demostración** - Demos de productos
- **Talleres Especializados** - Capacitaciones
- **Eventos de Networking** - Networking comercial

### Gestión de Eventos
1. **Crear Evento** - Definir evento promocional
2. **Configurar Promociones** - Ofertas especiales
3. **Gestionar Asistentes** - Lista de invitados
4. **Seguimiento** - Métricas del evento
5. **Follow-up** - Seguimiento post-evento

---

*Documentación actualizada: $(date)*
*Versión: 1.0*
