# 🎨 Rediseño del Perfil - Estilo Tinder/Bumble

## ✅ **IMPLEMENTACIÓN COMPLETA**

Se ha implementado un diseño moderno e inmersivo para el perfil de usuario, inspirado en Tinder/Bumble.

---

## 🎨 **PALETA DE COLORES**

| Color | Uso | Código |
|-------|-----|--------|
| 🔴 Rojo Coral | Acciones primarias / Acento | `#FF3D57` |
| 🟠 Naranja Cálido | Hover / Microinteracción | `#FF8C42` |
| 🟡 Amarillo Suave | Detalles / Resaltes | `#FFD166` |
| 🔵 Azul Eléctrico | Confirmación / Links | `#1E88E5` |
| ⚫ Gris Carbón | Fondo neutro | `#121212` |
| ⚪ Blanco Humo | Texto sobre fondos oscuros | `#F5F5F5` |

---

## 📱 **COMPONENTES CREADOS**

### **1. ProfileCard.tsx**
**Ruta:** `apps/web/src/screens/profile/ProfileCard.tsx`

**Características:**
- ✅ Foto de portada fullscreen con gradiente overlay
- ✅ Información flotante en la parte inferior
- ✅ Nombre grande, bold, con sombra de texto
- ✅ Bio semitransparente
- ✅ Chips de ritmos y zonas con hover glow
- ✅ Botones de acción circulares con gradientes
- ✅ Animaciones con Framer Motion (fade-in, slide-up)
- ✅ Redes sociales como botones circulares coloridos
- ✅ Botón de configuración flotante (top-right)

**Props:**
```typescript
interface ProfileCardProps {
  profile: ProfileUser;
  isOwnProfile?: boolean;
  onEdit?: () => void;
}
```

---

### **2. EventCardSmall.tsx**
**Ruta:** `apps/web/src/components/profile/EventCardSmall.tsx`

**Características:**
- ✅ Card horizontal deslizable (280px min-width)
- ✅ Imagen de fondo con gradiente overlay
- ✅ Badge de fecha en esquina
- ✅ Nombre del evento y lugar
- ✅ Hover effect (scale + lift)
- ✅ Transiciones suaves

**Props:**
```typescript
interface EventCardSmallProps {
  event: {
    id: number;
    nombre: string;
    fecha: string;
    lugar?: string;
    imagen?: string;
  };
  onClick?: () => void;
}
```

---

### **3. ProfileSwitchButton.tsx**
**Ruta:** `apps/web/src/components/profile/ProfileSwitchButton.tsx`

**Características:**
- ✅ Botón flotante fijo (top-right)
- ✅ Gradiente dinámico según tipo de perfil
- ✅ Dropdown animado con glassmorphism
- ✅ 4 tipos de perfil:
  - 💃 Bailarín (Coral)
  - 🎓 Maestro (Azul)
  - 🎤 Organizador (Naranja)
  - 🏢 Marca (Amarillo)
- ✅ Solo visible para super admins

**Props:**
```typescript
interface ProfileSwitchButtonProps {
  currentType: 'bailarin' | 'maestro' | 'organizador' | 'marca';
  onSwitch: (type) => void;
}
```

---

### **4. GalleryGrid.tsx**
**Ruta:** `apps/web/src/components/profile/GalleryGrid.tsx`

**Características:**
- ✅ Grid 2 columnas responsive
- ✅ Lazy loading de imágenes
- ✅ Fade-in animation al cargar
- ✅ Hover overlay con icono de zoom
- ✅ Manejo de errores de carga
- ✅ Empty state

**Props:**
```typescript
interface GalleryGridProps {
  images: string[];
  onImageClick?: (index: number) => void;
}
```

---

### **5. Chip.tsx (Mejorado)**
**Ruta:** `apps/web/src/components/profile/Chip.tsx`

**Características:**
- ✅ Variantes: ritmo, zona, custom
- ✅ Glow effect en hover
- ✅ Estado activo/inactivo
- ✅ Backdropfilter (glassmorphism)
- ✅ Iconos opcionales

**Props:**
```typescript
interface ChipProps {
  label: string;
  icon?: string;
  variant?: 'ritmo' | 'zona' | 'custom';
  color?: string;
  onClick?: () => void;
  active?: boolean;
}
```

---

### **6. ProfileScreen.tsx**
**Ruta:** `apps/web/src/screens/profile/ProfileScreen.tsx`

**Características:**
- ✅ Integra todos los componentes
- ✅ Layout con fondo dark
- ✅ Sección de "Próximos Eventos" horizontal scroll
- ✅ Galería de fotos
- ✅ Loading state con animación
- ✅ Navegación a edición
- ✅ Switch de perfil (super admin)

---

## 🎯 **ANIMACIONES Y MICROINTERACCIONES**

### **Framer Motion Variants:**

**Hero Text Fade-in:**
```typescript
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};
```

**Chips Slide-up:**
```typescript
const chipVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 },
  },
};
```

**Hover Effects:**
- Cards: `scale: 1.02`, `y: -4`
- Buttons: `scale: 1.05`
- Chips: `scale: 1.05`, glow shadow

---

## 🛣️ **RUTAS ACTUALIZADAS**

### **Nueva Ruta:**
```
/app/profile → ProfileScreen (nuevo diseño)
/app/profile/edit → Profile (formulario de edición existente)
```

---

## 📦 **DEPENDENCIAS INSTALADAS**

```bash
npm install framer-motion
```

**Versión:** `framer-motion@latest`

---

## 🎨 **ESTILOS Y UX**

### **Bordes Redondeados:**
- Cards grandes: `24px`
- Cards pequeños: `16px`
- Chips: `20px`
- Botones: `50px` (circular)

### **Sombras:**
- Cards: `0 20px 60px rgba(0,0,0,0.3)`
- Botones: `0 4px 15px rgba(255,61,87,0.4)`
- Hover: `0 8px 24px rgba(0,0,0,0.3)`

### **Glassmorphism:**
```css
backdrop-filter: blur(10px);
background: rgba(color, 0.2);
```

### **Gradientes:**
```css
/* Coral to Orange */
background: linear-gradient(135deg, #FF3D57, #FF8C42);

/* Blue to Coral */
background: linear-gradient(135deg, #1E88E5, #FF3D57);

/* Bottom to Top (Overlay) */
background: linear-gradient(to top, #121212, transparent);
```

---

## 🚀 **CÓMO USAR**

### **1. Ver el Nuevo Diseño:**
```bash
# Inicia el servidor
cd apps/web
npm run dev

# Abre el navegador
http://localhost:5173/app/profile
```

### **2. Editar el Perfil:**
- Clic en botón **"✏️ Editar Perfil"**
- O clic en **⚙️** (top-right)
- Te redirige a `/app/profile/edit`

### **3. Switch de Perfil (Super Admin):**
- Solo visible si `isSuperAdmin = true`
- Clic en botón flotante (top-right)
- Selecciona tipo de perfil
- **TODO:** Implementar lógica de guardado en BD

---

## 🔄 **PRÓXIMOS PASOS**

### **1. Variantes de Perfil por Tipo:**
Crear componentes especializados:
- `ProfileOrganizerView.tsx` → Muestra eventos organizados
- `ProfileMaestroView.tsx` → Muestra clases
- `ProfileMarcaView.tsx` → Muestra productos
- `ProfileDancerView.tsx` → Muestra RSVPs

### **2. Swipe Navigation:**
```typescript
// Usar framer-motion drag
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={(e, { offset, velocity }) => {
    if (offset.x > 100) {
      // Swipe right → Next profile
    } else if (offset.x < -100) {
      // Swipe left → Previous profile
    }
  }}
>
  <ProfileCard />
</motion.div>
```

### **3. Integrar Datos Reales:**
- Fetch eventos desde `/me/rsvps`
- Cargar galería desde `profile.media`
- Implementar verificación de super admin
- Guardar cambios de tipo de perfil en BD

### **4. Lightbox para Galería:**
```bash
npm install react-image-lightbox
```

### **5. Match Animation (Futuro):**
```bash
npm install lottie-react
```

---

## 🐛 **TROUBLESHOOTING**

### **Error: framer-motion not found**
```bash
cd apps/web
npm install framer-motion
```

### **Imágenes no cargan**
- Verificar que `profile.avatar_url` exista
- Agregar placeholder: `/public/placeholder-avatar.png`

### **Componentes no aparecen**
- Verificar imports en `ProfileScreen.tsx`
- Verificar ruta en `router.tsx`

---

## 📊 **ARCHIVOS CREADOS/MODIFICADOS**

### **Creados:**
1. ✅ `apps/web/src/screens/profile/ProfileCard.tsx`
2. ✅ `apps/web/src/screens/profile/ProfileScreen.tsx`
3. ✅ `apps/web/src/components/profile/EventCardSmall.tsx`
4. ✅ `apps/web/src/components/profile/ProfileSwitchButton.tsx`
5. ✅ `apps/web/src/components/profile/GalleryGrid.tsx`
6. ✅ `apps/web/src/components/profile/Chip.tsx`
7. ✅ `apps/web/PROFILE_REDESIGN.md`

### **Modificados:**
1. ✅ `apps/web/src/router.tsx` - Rutas actualizadas
2. ✅ `apps/web/package.json` - framer-motion agregado

---

## 🎉 **¡DISEÑO LISTO!**

Tu perfil ahora tiene:
- ✅ **Diseño moderno** tipo Tinder/Bumble
- ✅ **Animaciones fluidas** con Framer Motion
- ✅ **UI inmersiva** con foto de portada dominante
- ✅ **Microinteracciones** en todos los elementos
- ✅ **Responsive** mobile-first
- ✅ **Glassmorphism** y gradientes modernos
- ✅ **Componentes reutilizables** y escalables

---

**Desarrollado con ❤️ para BaileApp**
*Fecha: 21 de Octubre, 2025*
