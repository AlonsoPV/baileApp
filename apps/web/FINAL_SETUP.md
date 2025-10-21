# 🎯 Configuración Final - BaileApp

## ✅ **IMPLEMENTACIÓN COMPLETA**

Se ha implementado el sistema completo de perfiles para Usuario y Organizador con UI compartida y gestión de media.

---

## 📦 **LO QUE SE IMPLEMENTÓ:**

### **1. Componentes Compartidos:**
- ✅ `ProfileHero.tsx` - Hero reutilizable con cover, título, chips
- ✅ `MediaGrid.tsx` - Grid de fotos/videos
- ✅ `MediaUploader.tsx` - Botón de upload
- ✅ `EventInviteStrip.tsx` - Franja de eventos

### **2. Hooks:**
- ✅ `useUserMedia.ts` - Media del usuario (bucket: user-media)
- ✅ `useOrganizerMedia.ts` - Media del organizador (bucket: org-media)
- ✅ `useMyRSVPs.ts` - RSVPs del usuario
- ✅ `useProfileSwitch.ts` - Switch Usuario ↔ Organizador

### **3. Perfiles:**
- ✅ `UserProfileLive.tsx` - Vista Live con hero + RSVPs + galería
- ✅ `UserProfileEditor.tsx` - Editor completo con upload
- ✅ `OrganizerProfileLive.tsx` - Vista Live con hero + eventos + galería
- ✅ `OrganizerProfileEditor.tsx` - Editor con upload + lista de eventos

### **4. Scripts SQL:**
- ✅ `DATABASE_SPRINT2.sql` - Tablas de eventos
- ✅ `DATABASE_STORAGE.sql` - Bucket user-media
- ✅ `DATABASE_ORG_STORAGE.sql` - Bucket org-media

---

## 🚀 **SETUP COMPLETO (Paso a Paso):**

### **PASO 1: Ejecutar Scripts SQL**

Abre **Supabase Dashboard → SQL Editor** y ejecuta en orden:

#### **1.1 Tablas de Eventos:**
```sql
-- Copiar y ejecutar: apps/web/DATABASE_SPRINT2.sql
-- Esto crea: profiles_organizer, events_parent, events_date, rsvp
```

#### **1.2 Storage Usuario:**
```sql
-- Copiar y ejecutar: apps/web/DATABASE_STORAGE.sql
-- Esto crea: bucket user-media + políticas + columna media en profiles_user
```

#### **1.3 Storage Organizador:**
```sql
-- Copiar y ejecutar: apps/web/DATABASE_ORG_STORAGE.sql
-- Esto crea: bucket org-media + políticas + columna media en profiles_organizer
```

---

### **PASO 2: Verificar Buckets**

Ve a **Supabase Dashboard → Storage**

Deberías ver:
```
✅ AVATARS (público)
✅ user-media (público)
✅ org-media (público)
```

---

### **PASO 3: Verificar Políticas**

Ejecuta en SQL Editor:

```sql
-- Ver políticas de user-media
SELECT policyname FROM pg_policies 
WHERE schemaname = 'storage' 
  AND policyname LIKE '%user%media%';

-- Ver políticas de org-media
SELECT policyname FROM pg_policies 
WHERE schemaname = 'storage' 
  AND policyname LIKE '%org%media%';
```

Deberías ver:
- **user-media:** 4 políticas
- **org-media:** 4 políticas

---

### **PASO 4: Probar el Flujo Completo**

#### **A) Perfil de Usuario:**

```
1. Login → http://localhost:5173/auth/login
2. Completar onboarding
3. Ir a /app/profile
4. Por defecto: Usuario + Live
5. Clic "Editar" (botón inferior)
6. Subir fotos/videos
7. Seleccionar ritmos y zonas
8. Guardar
9. Clic "Ver Live"
10. Verificar secciones:
    - Foto de portada con chips
    - Sobre mí
    - 🎫 Acompáñame a estos eventos (vacío si no hay RSVPs)
    - 📸 Galería
```

#### **B) Perfil de Organizador:**

```
1. Desde /app/profile
2. Clic "Organizador" (botón inferior)
3. Si no existe: CTA "Crear Perfil de Organizador"
4. Clic → Se crea automáticamente
5. Modo Edit activo
6. Completa datos:
   - Nombre público
   - Biografía
   - Subir fotos/videos
7. Guardar
8. Clic "Enviar a Revisión"
9. Aprobar en SQL:
   ```sql
   UPDATE profiles_organizer 
   SET estado_aprobacion = 'aprobado' 
   WHERE user_id = auth.uid();
   ```
10. Refresca → Badge "✅ aprobado"
11. Clic "+ Nuevo Evento"
12. Crear evento y fechas
13. Clic "Ver Live"
14. Verificar secciones:
    - Hero con cover
    - Sobre nosotros
    - 🎫 Acompáñame a estos eventos (sus eventos)
    - 📸 Galería
    - 📅 Todos los Eventos
```

---

## 🎨 **DISEÑO:**

### **Componentes Compartidos:**

```
┌────────────────────800px─────────────────┐
│  ProfileHero                              │
│  - Cover image                            │
│  - Título (nombre/nombre público)         │
│  - Subtitle (bio)                         │
│  - Chips (ritmos/zonas o estado)          │
└───────────────────────────────────────────┘

┌────────────────────800px─────────────────┐
│  EventInviteStrip                         │
│  - Header con gradiente                   │
│  - Cards horizontales deslizables         │
│  - Usuario: RSVPs                         │
│  - Organizador: Próximos eventos          │
└───────────────────────────────────────────┘

┌────────────────────800px─────────────────┐
│  MediaGrid                                │
│  - Grid responsive                        │
│  - Imágenes y videos                      │
│  - Hover para eliminar (en edit)          │
└───────────────────────────────────────────┘
```

---

### **Diferencias:**

| Aspecto | Usuario | Organizador |
|---------|---------|-------------|
| **Hero Title** | Display Name | Nombre Público |
| **Hero Subtitle** | Bio personal | Bio del organizador |
| **Chips** | Ritmos + Zonas | Estado de aprobación |
| **"Acompáñame..."** | RSVPs (eventos donde voy) | Eventos que organiza |
| **Sección extra** | - | "📅 Todos los Eventos" |

---

## 🛣️ **RUTAS FINALES:**

### **Usuario:**
```
/app/profile                          → ProfileScreen (switch)
  ├─ Usuario + Live → UserProfileLive
  └─ Usuario + Edit → UserProfileEditor
```

### **Organizador:**
```
/app/profile                          → ProfileScreen (switch)
  ├─ Organizador + Live → OrganizerProfileLive
  └─ Organizador + Edit → OrganizerProfileEditor

/profile/organizer                    → OrganizerProfileLive (directo)
/organizer/:id                        → OrganizerPublicScreen (público)
```

### **Editores de Eventos:**
```
/profile/organizer/events/new         → EventEditor (crear)
/profile/organizer/events/:id         → EventEditor (editar)
/profile/organizer/date/new/:parentId → EventDateEditor (crear)
/profile/organizer/date/:id           → EventDateEditor (editar)
```

---

## 🎮 **CONTROLES:**

```
┌─────────────────────────────────────┐
│  Fixed Bottom Center                │
│                                     │
│  [👤 Usuario] [🎤 Organizador]     │
│  (solo si hasOrganizer)            │
│                                     │
│      [✏️ Editar] o [👁️ Ver Live]  │
└─────────────────────────────────────┘
```

---

## 📊 **ARCHIVOS CREADOS/MODIFICADOS:**

### **Nuevos (Sprint 3 - Organizador):**
1. ✅ `apps/web/src/components/profile/ProfileHero.tsx`
2. ✅ `apps/web/src/hooks/useOrganizerMedia.ts`
3. ✅ `apps/web/src/components/MediaGrid.tsx`
4. ✅ `apps/web/src/components/MediaUploader.tsx`
5. ✅ `apps/web/src/components/EventInviteStrip.tsx`
6. ✅ `apps/web/DATABASE_ORG_STORAGE.sql`
7. ✅ `apps/web/FINAL_SETUP.md`

### **Reescritos:**
1. ✅ `apps/web/src/screens/profile/OrganizerProfileEditor.tsx`
2. ✅ `apps/web/src/screens/profile/OrganizerProfileLive.tsx`

### **Modificados:**
1. ✅ `apps/web/src/router.tsx`

---

## 🔐 **SEGURIDAD:**

### **Storage Policies:**

**user-media:**
- Path: `userId/archivo.ext`
- Control: Solo el usuario puede subir/editar/eliminar sus archivos
- Lectura: Pública

**org-media:**
- Path: `orgId/archivo.ext`
- Control: Solo el organizador (via user_id) puede subir/editar/eliminar
- Lectura: Pública

---

## 🎯 **DEFINITION OF DONE:**

- [x] ProfileHero component compartido
- [x] MediaGrid, MediaUploader, EventInviteStrip reutilizables
- [x] useOrganizerMedia hook
- [x] OrganizerProfileEditor con upload
- [x] OrganizerProfileLive con hero
- [x] Bucket org-media creado
- [x] Políticas RLS configuradas
- [x] Rutas actualizadas
- [x] Switch funcional entre Usuario y Organizador
- [x] Misma UI para ambos perfiles
- [x] "Acompáñame a estos eventos" para ambos
- [x] Galería para ambos

---

## 🎊 **¡SISTEMA COMPLETO!**

**Tu aplicación ahora tiene:**

✅ **Perfiles Unificados** - Misma UI para Usuario y Organizador  
✅ **Componentes DRY** - Reutilizables entre perfiles  
✅ **Media Management** - Upload/delete para ambos  
✅ **Storage Separado** - user-media y org-media  
✅ **Switch Dinámico** - Usuario ↔ Organizador  
✅ **Modos Live/Edit** - Para ambos perfiles  
✅ **EventInviteStrip** - RSVPs (usuario) y Eventos (organizador)  
✅ **Hero Consistente** - Cover + título + chips  
✅ **Galería Completa** - Fotos y videos para ambos  

---

## 🚀 **PRÓXIMOS PASOS:**

1. ✅ Ejecutar los 3 scripts SQL
2. ✅ Verificar buckets en Storage
3. ✅ Probar upload de fotos (usuario)
4. ✅ Crear organizador
5. ✅ Aprobar organizador (SQL)
6. ✅ Probar upload de fotos (organizador)
7. ✅ Crear eventos
8. ✅ Ver ambos perfiles en Live

---

**¡Disfruta BaileApp con perfiles unificados!** 💃🕺✨
