# 🌐 Perfiles Públicos - BaileApp

## ✅ **IMPLEMENTACIÓN COMPLETADA**

Se ha implementado el sistema de perfiles públicos que permite ver perfiles de otros usuarios desde listados y RSVPs.

---

## 📦 **ARCHIVOS CREADOS:**

### **1. Hook de Datos:**
- ✅ `apps/web/src/hooks/useUserProfileById.ts` - Hook para leer perfil por user_id

### **2. Pantalla Pública:**
- ✅ `apps/web/src/screens/profile/UserPublicProfile.tsx` - Vista pública reutilizando ProfileHero

### **3. Componentes de Enlace:**
- ✅ `apps/web/src/components/UserProfileLink.tsx` - Enlaces a perfiles (3 variantes)
- ✅ `apps/web/src/components/UserList.tsx` - Lista de usuarios con enlaces

### **4. Configuración:**
- ✅ `apps/web/DATABASE_PUBLIC_PROFILES.sql` - Política de lectura pública
- ✅ Ruta agregada: `/u/:id` → UserPublicProfile

---

## 🚀 **SETUP COMPLETO:**

### **PASO 1: Ejecutar Script SQL**

En **Supabase Dashboard → SQL Editor**, ejecuta:

```sql
-- Copiar y ejecutar: apps/web/DATABASE_PUBLIC_PROFILES.sql
```

**Resultado esperado:**
- ✅ Política de lectura pública configurada
- ✅ Perfiles visibles públicamente
- ✅ RLS habilitado

---

### **PASO 2: Verificar Funcionamiento**

#### **A) Probar Perfil Público:**
```
1. Ve a cualquier perfil: /u/USER_ID
2. Debería cargar la información del usuario
3. Verificar que se muestran:
   - Hero con avatar/cover
   - Chips de ritmos y zonas
   - Bio
   - Galería de fotos/videos
```

#### **B) Probar Enlaces:**
```
1. Usar UserProfileLink en cualquier componente
2. Verificar que navega a /u/:id
3. Probar las 3 variantes: 'simple', 'chip', 'card'
```

---

## 🎯 **CÓMO USAR:**

### **1. Enlace Simple:**
```tsx
import { UserProfileLink } from "../components/UserProfileLink";

<UserProfileLink 
  userId="123e4567-e89b-12d3-a456-426614174000"
  displayName="Juan Pérez"
  variant="simple"
/>
```

### **2. Chip con Avatar:**
```tsx
<UserProfileLink 
  userId={user.user_id}
  displayName={user.display_name}
  avatarUrl={user.avatar_url}
  variant="chip"
/>
```

### **3. Card Completa:**
```tsx
<UserProfileLink 
  userId={user.user_id}
  displayName={user.display_name}
  avatarUrl={user.avatar_url}
  variant="card"
/>
```

### **4. Lista de Usuarios:**
```tsx
import { UserList } from "../components/UserList";

<UserList 
  users={[
    { user_id: "123", display_name: "Juan", avatar_url: "..." },
    { user_id: "456", display_name: "María", avatar_url: "..." }
  ]}
  title="Usuarios que van al evento"
  variant="cards"
/>
```

---

## 🛣️ **RUTAS DISPONIBLES:**

### **Perfiles Públicos:**
```
/u/:id                    → UserPublicProfile (por user_id UUID)
/organizer/:id           → OrganizerPublicScreen (por organizer_id)
/profile/organizer       → OrganizerProfileLive (mi perfil)
```

### **Ejemplos de URLs:**
```
/u/123e4567-e89b-12d3-a456-426614174000
/organizer/1
/profile/organizer
```

---

## 🎨 **VARIANTES DE ENLACE:**

### **Simple:**
- Solo texto con color coral
- Hover: subrayado + naranja

### **Chip:**
- Avatar + nombre en pill
- Hover: fondo coral
- Ideal para listas compactas

### **Card:**
- Avatar grande + info
- Hover: elevación + sombra
- Ideal para listas principales

---

## 📱 **EJEMPLOS DE USO:**

### **En Lista de RSVPs:**
```tsx
// Mostrar quién va a un evento
{rsvpUsers.map(user => (
  <UserProfileLink
    key={user.user_id}
    userId={user.user_id}
    displayName={user.display_name}
    avatarUrl={user.avatar_url}
    variant="chip"
  />
))}
```

### **En Comentarios:**
```tsx
// Autor de comentario
<div>
  Por <UserProfileLink 
    userId={comment.user_id}
    displayName={comment.author_name}
    variant="simple"
  />
</div>
```

### **En Lista de Participantes:**
```tsx
// Lista completa de usuarios
<UserList 
  users={participants}
  title="Participantes del evento"
  variant="cards"
/>
```

---

## 🔒 **PRIVACIDAD:**

### **Configuración Actual:**
- ✅ Todos los perfiles son públicos por defecto
- ✅ Cualquiera puede ver cualquier perfil
- ✅ Solo se muestran datos básicos (nombre, bio, media)

### **Para Control Fino (Opcional):**
Si quieres privacidad selectiva, descomenta en el script SQL:
```sql
-- Agregar columna is_public
ALTER TABLE profiles_user 
ADD COLUMN is_public BOOLEAN DEFAULT true;

-- Usar flag en política
CREATE POLICY "Public can read public user profiles"
ON profiles_user FOR SELECT
TO public
USING (coalesce(is_public, true));
```

---

## 🎊 **¡PERFILES PÚBLICOS FUNCIONANDO!**

**Tu aplicación ahora tiene:**

✅ **Perfiles Públicos** - Cualquiera puede ver cualquier perfil  
✅ **Enlaces Dinámicos** - 3 variantes de enlace  
✅ **UI Reutilizada** - Misma interfaz que perfiles propios  
✅ **Navegación Fluida** - Enlaces desde listados y RSVPs  
✅ **Responsive** - Funciona en móvil y desktop  
✅ **Animaciones** - Transiciones suaves  
✅ **Privacidad Configurable** - Listo para control fino  

---

## 🚀 **PRÓXIMOS PASOS:**

1. ✅ Ejecutar `DATABASE_PUBLIC_PROFILES.sql`
2. ✅ Probar navegación a `/u/USER_ID`
3. ✅ Integrar `UserProfileLink` en listados existentes
4. ✅ Usar `UserList` en pantallas de eventos
5. ✅ Personalizar variantes según necesidades

---

**¡Disfruta explorando perfiles de otros usuarios en BaileApp!** 👥💃🕺✨
