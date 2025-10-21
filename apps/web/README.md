# 💃 BaileApp Web - Documentación Completa

## 🎯 Descripción

BaileApp es una plataforma web moderna para conectar bailarines, encontrar eventos de baile, y organizar actividades. Inspirada en Tinder/Bumble, ofrece una experiencia visual inmersiva con perfiles dinámicos.

---

## 🚀 Quick Start

### **Instalación:**
```bash
# Desde la raíz del monorepo
pnpm install

# O desde apps/web
cd apps/web
npm install
```

### **Desarrollo:**
```bash
# Desde la raíz
pnpm run dev:web

# O desde apps/web
npm run dev
```

### **Build:**
```bash
pnpm run build:web
```

---

## 📁 Estructura del Proyecto

```
apps/web/
├── src/
│   ├── components/           # Componentes reutilizables
│   │   ├── profile/         # Componentes de perfil
│   │   │   ├── EventCardSmall.tsx
│   │   │   ├── GalleryGrid.tsx
│   │   │   ├── ProfileSwitchButton.tsx
│   │   │   └── Chip.tsx
│   │   ├── Navbar.tsx
│   │   ├── ProfileSwitcher.tsx
│   │   ├── TagChip.tsx
│   │   ├── TagMultiSelect.tsx
│   │   ├── Toast.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── RedirectIfAuthenticated.tsx
│   │
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useUserProfile.ts
│   │   ├── useOrganizer.ts
│   │   ├── useEvents.ts
│   │   ├── useTags.ts
│   │   └── useProfileSwitch.ts  ✨ Sprint 3
│   │
│   ├── screens/
│   │   ├── auth/            # Autenticación
│   │   │   ├── Login.tsx
│   │   │   └── Signup.tsx
│   │   │
│   │   ├── onboarding/      # Onboarding de usuario
│   │   │   ├── ProfileBasics.tsx
│   │   │   ├── PickRitmos.tsx
│   │   │   └── PickZonas.tsx
│   │   │
│   │   ├── app/             # Pantallas de app
│   │   │   └── Profile.tsx  (legacy)
│   │   │
│   │   ├── profile/         # ✨ Sprint 3 - Sistema de perfiles
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── UserProfileLive.tsx
│   │   │   ├── UserProfileEditor.tsx
│   │   │   ├── OrganizerProfileLive.tsx
│   │   │   ├── OrganizerProfileEditor.tsx
│   │   │   ├── EventEditor.tsx
│   │   │   └── EventDateEditor.tsx
│   │   │
│   │   └── events/          # Sprint 2 - Eventos públicos
│   │       ├── OrganizerEditScreen.tsx
│   │       ├── OrganizerPublicScreen.tsx
│   │       ├── EventParentEditScreen.tsx
│   │       ├── EventParentPublicScreen.tsx
│   │       ├── EventDateEditScreen.tsx
│   │       ├── EventDatePublicScreen.tsx
│   │       └── MyRSVPsScreen.tsx
│   │
│   ├── lib/                 # Librerías
│   │   ├── supabase.ts
│   │   └── queryClient.ts
│   │
│   ├── types/               # TypeScript types
│   │   ├── db.ts
│   │   └── events.ts
│   │
│   ├── utils/               # Utilidades
│   │   ├── validation.ts
│   │   ├── mergeProfile.ts
│   │   └── forms.ts
│   │
│   ├── theme/               # Tema y colores
│   │   └── colors.ts
│   │
│   ├── router.tsx           # Configuración de rutas
│   ├── main.tsx             # Entry point
│   └── App.tsx              # App wrapper
│
├── public/                  # Assets estáticos
├── .env                     # Variables de entorno
├── vite.config.ts           # Configuración de Vite
├── tsconfig.json            # TypeScript config
├── package.json
│
└── Documentación/
    ├── SPRINTS.md           # Sprint 1
    ├── SPRINT2.md           # Sprint 2
    ├── SPRINT3.md           # Sprint 3
    ├── PROFILE_REDESIGN.md
    ├── SETUP_INSTRUCTIONS.md
    └── DATABASE_SPRINT2.sql
```

---

## 🎨 Features por Sprint

### **Sprint 1: Fundación**
- ✅ Autenticación (Login/Signup)
- ✅ Onboarding (Basics, Ritmos, Zonas)
- ✅ Perfil de usuario básico
- ✅ Sistema de tags
- ✅ Toast notifications
- ✅ Route guards
- ✅ Validaciones

### **Sprint 2: Eventos**
- ✅ Perfiles de organizador
- ✅ Sistema de aprobación
- ✅ Eventos padre
- ✅ Fechas de eventos
- ✅ RSVP (Voy/Interesado/No Voy)
- ✅ Vistas públicas
- ✅ RLS policies
- ✅ Queries optimizadas

### **Sprint 3: Perfiles Dinámicos** ✨
- ✅ Switch Usuario ↔ Organizador
- ✅ Modos Live y Edit
- ✅ Diseño tipo Tinder/Bumble
- ✅ Perfiles inmersivos
- ✅ Editores inline
- ✅ Jerarquía de eventos
- ✅ Animaciones con Framer Motion
- ✅ Chips con nombres reales
- ✅ Iconos SVG de redes sociales

---

## 🛠️ Stack Tecnológico

### **Frontend:**
- React 19
- TypeScript
- Vite
- React Router DOM
- Framer Motion
- date-fns

### **Backend:**
- Supabase (Auth + Database + Storage)
- PostgreSQL
- Row Level Security (RLS)

### **Estado:**
- React Query (TanStack Query)
- Custom hooks

### **Estilos:**
- Inline styles con theme
- Glassmorphism
- Gradientes CSS
- Dark mode

---

## 🎯 Uso

### **1. Usuario Normal:**
```
1. Signup → Onboarding → Profile
2. Ver perfil en modo Live
3. Editar información
4. Explorar eventos
5. Hacer RSVP
```

### **2. Organizador:**
```
1. Crear perfil de organizador
2. Enviar a revisión
3. Aprobar (SQL o admin panel)
4. Crear eventos
5. Publicar fechas
6. Ver RSVPs de usuarios
```

### **3. Switch Dinámico:**
```
[👤 Usuario] ↔ [🎤 Organizador]
[✏️ Editar] ↔ [👁️ Ver Live]
```

---

## 📊 Base de Datos

### **Tablas:**
```sql
-- Sprint 1
profiles_user       # Perfiles de usuarios
tags                # Ritmos y zonas

-- Sprint 2
profiles_organizer  # Perfiles de organizadores
events_parent       # Eventos padre
events_date         # Fechas de eventos
rsvp                # Respuestas de usuarios
```

### **Storage:**
```
AVATARS/            # Fotos de perfil
event-media/        # Media de eventos (opcional)
```

### **Setup:**
```bash
# Ejecutar en Supabase SQL Editor
1. apps/web/DATABASE_SPRINT2.sql
```

---

## 🎨 Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Coral | #FF3D57 | Primario, ritmos |
| Naranja | #FF8C42 | Hover, secundario |
| Amarillo | #FFD166 | Zonas, resaltes |
| Azul | #1E88E5 | Organizador, links |
| Carbón | #121212 | Fondo dark |
| Blanco | #F5F5F5 | Texto |

---

## 🧪 Testing

### **Flujo Completo:**
```bash
# 1. Login
http://localhost:5173/auth/login

# 2. Crear cuenta
Signup → email + password

# 3. Onboarding
Basics → Ritmos → Zonas

# 4. Perfil
Ver Live → Editar → Guardar

# 5. Organizador
Switch a Organizador → Crear evento

# 6. Aprobar (SQL)
UPDATE profiles_organizer SET estado_aprobacion = 'aprobado'...

# 7. Crear evento
+ Nuevo Evento → Formulario → Guardar

# 8. Publicar fecha
+ Nueva Fecha → Estado: Publicado → Guardar

# 9. RSVP
Ver fecha pública → Clic "Voy" → Ver en /me/rsvps
```

---

## 🚀 Scripts

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

---

## 📚 Documentación

- **SPRINTS.md** - Sprint 1 (fundación)
- **SPRINT2.md** - Sprint 2 (eventos)
- **SPRINT3.md** - Sprint 3 (perfiles dinámicos)
- **PROFILE_REDESIGN.md** - Rediseño tipo Tinder/Bumble
- **SETUP_INSTRUCTIONS.md** - Instrucciones de configuración
- **DATABASE_SPRINT2.sql** - Scripts de base de datos

---

## 🤝 Contribuir

### **Estilo de Código:**
- TypeScript estricto
- Inline styles con theme
- Framer Motion para animaciones
- React Query para data fetching
- Comentarios en español

### **Naming:**
- Components: PascalCase
- Hooks: use + PascalCase
- Files: PascalCase.tsx
- Variables: camelCase

---

## 📝 Notas

### **Supabase:**
- URL: Configurar en `.env`
- Políticas RLS: Ver `DATABASE_SPRINT2.sql`
- Buckets: `AVATARS` (público)

### **React:**
- Versión 19.2.0
- Dedupe configurado en Vite
- Hooks rules compliant

### **Rutas:**
- Protected routes con guards
- Public routes para eventos aprobados
- Redirects automáticos

---

## 🎉 **¡Disfruta BaileApp!**

Una plataforma moderna para la comunidad de baile. 💃🕺✨

---

**Versión:** 1.0.0  
**Última actualización:** 21 de Octubre, 2025  
**Tech Stack:** React 19 + TypeScript + Vite + Supabase + Framer Motion
