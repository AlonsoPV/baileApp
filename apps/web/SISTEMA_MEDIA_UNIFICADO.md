# 📸 Sistema de Media Unificado

## 🎯 **Objetivo**

Centralizar todo el manejo de fotos y videos del usuario en un solo sistema basado en **slots predefinidos**, eliminando la duplicación del campo `avatar_url` y simplificando la gestión de media.

---

## 📋 **Estructura de Slots**

### **Slots de Fotos (p1-p6)**

| Slot | Nombre | Uso | Ubicación en el Perfil |
|------|--------|-----|------------------------|
| **p1** | Avatar / Foto Principal | Avatar del usuario | Banner (esquina superior izquierda, circular) |
| **p2** | Foto Personal | Acompaña pregunta "Dato curioso" | Sección 1 - Row con foto y pregunta |
| **p3** | Foto de Baile | Acompaña pregunta "Gusta bailar" | Sección 2 - Row con pregunta y foto |
| **p4** | Carrusel 1 | Galería de fotos | Sección 3 - Carrusel horizontal |
| **p5** | Carrusel 2 | Galería de fotos | Sección 3 - Carrusel horizontal |
| **p6** | Carrusel 3 | Galería de fotos | Sección 3 - Carrusel horizontal |

### **Slots de Videos (v1-v3)**

| Slot | Nombre | Uso | Ubicación en el Perfil |
|------|--------|-----|------------------------|
| **v1** | Video Principal | Video destacado del usuario | Sección de videos (futuro) |
| **v2** | Video Secundario 1 | Videos adicionales | Sección de videos (futuro) |
| **v3** | Video Secundario 2 | Videos adicionales | Sección de videos (futuro) |

---

## 🗄️ **Estructura de Datos**

### **Campo `media` en `profiles_user`**

```json
{
  "media": [
    {
      "slot": "p1",
      "kind": "photo",
      "url": "https://storage.supabase.co/.../avatar.jpg",
      "title": "Avatar Principal"
    },
    {
      "slot": "p2",
      "kind": "photo",
      "url": "https://storage.supabase.co/.../dato-curioso.jpg",
      "title": "Foto Personal"
    },
    {
      "slot": "v1",
      "kind": "video",
      "url": "https://storage.supabase.co/.../video-principal.mp4",
      "title": "Video de Baile"
    }
  ]
}
```

### **Tipo TypeScript (`MediaItem`)**

```typescript
type MediaSlot = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'v1' | 'v2' | 'v3';
type MediaKind = 'photo' | 'video';

interface MediaItem {
  slot: MediaSlot;
  kind: MediaKind;
  url: string;
  title?: string;
  id?: string; // Para compatibilidad con otros hooks
}
```

---

## 🔧 **Implementación Frontend**

### **1️⃣ Hook: `useUserMediaSlots`**

**Ubicación:** `apps/web/src/hooks/useUserMediaSlots.ts`

**Funciones:**
- `media` → Array de `MediaItem[]` con todos los media del usuario
- `uploadToSlot(file, slot, kind)` → Sube un archivo al slot especificado
- `removeFromSlot(slot)` → Elimina el media del slot especificado
- `refetch()` → Recarga los datos de media

**Ejemplo de uso:**

```typescript
const { media, uploadToSlot, removeFromSlot } = useUserMediaSlots();

// Subir foto al slot p1 (avatar)
const handleUploadAvatar = async (file: File) => {
  await uploadToSlot.mutateAsync({ 
    file, 
    slot: 'p1', 
    kind: 'photo' 
  });
};

// Eliminar foto del slot p2
const handleRemovePhoto = async () => {
  await removeFromSlot.mutateAsync('p2');
};
```

### **2️⃣ Utilidades: `mediaSlots.ts`**

**Ubicación:** `apps/web/src/utils/mediaSlots.ts`

**Funciones:**
- `getMediaBySlot(media, slot)` → Obtiene el item de un slot específico
- `upsertMediaSlot(media, item)` → Agrega o actualiza un item en un slot
- `removeMediaSlot(media, slot)` → Elimina un item de un slot

**Ejemplo de uso:**

```typescript
import { getMediaBySlot } from '../utils/mediaSlots';

// Obtener el avatar
const avatar = getMediaBySlot(media, 'p1');

// Renderizar
{avatar?.url && (
  <img src={avatar.url} alt="Avatar" />
)}
```

### **3️⃣ Componente: `UserProfileEditor`**

**Ubicación:** `apps/web/src/screens/profile/UserProfileEditor.tsx`

**Secciones:**
1. **Datos Básicos** → Nombre, Biografía
2. **Redes Sociales** → Instagram, TikTok, YouTube, Facebook, WhatsApp
3. **Preguntas Personales** → Dato curioso, Gusta bailar
4. **Gestión de Fotos** → Slots p1-p6 con upload/remove
5. **Gestión de Videos** → Slots v1-v3 con upload/remove

**Características:**
- ✅ **Avatar (p1)** claramente marcado con nota
- ✅ **Upload directo a Supabase Storage** con paths organizados
- ✅ **Preview de imágenes** antes de subir
- ✅ **Botón unificado "Guardar Todo"** para todos los datos

### **4️⃣ Componente: `UserProfileLive`**

**Ubicación:** `apps/web/src/screens/profile/UserProfileLive.tsx`

**Uso de Slots:**
- **p1** → Avatar circular en banner (esquina superior izquierda)
- **p2** → Foto en sección "Dato curioso"
- **p3** → Foto en sección "Gusta bailar"
- **p4-p6** → Carrusel de fotos

**Renderizado del Avatar:**

```typescript
{getMediaBySlot(safeMedia, 'p1')?.url ? (
  <ImageWithFallback
    src={getMediaBySlot(safeMedia, 'p1')!.url}
    alt="Avatar"
    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
  />
) : (
  <div>{profile?.display_name?.[0]?.toUpperCase() || '?'}</div>
)}
```

---

## 🔄 **Migración de Datos**

### **Script SQL: `MIGRAR_AVATAR_A_P1.sql`**

**Ubicación:** `apps/web/MIGRAR_AVATAR_A_P1.sql`

**¿Qué hace?**
1. Lee todos los usuarios con `avatar_url` no vacío
2. Crea un objeto de media en slot `p1` con la URL del avatar
3. Agrega este objeto al array `media` del usuario
4. (Opcional) Limpia el campo `avatar_url` después de migrar

**Cómo ejecutar:**
```sql
-- Ejecuta en Supabase SQL Editor
-- El script incluye:
-- 1. Migración automática de todos los avatares
-- 2. Verificación de usuarios migrados
-- 3. Estadísticas generales
```

**Resultado esperado:**
```
==========================================
RESUMEN DE MIGRACIÓN:
✅ Migrados exitosamente: 15
⏭️ Omitidos (ya tenían p1): 3
❌ Errores: 0
==========================================
```

---

## 📊 **Almacenamiento en Supabase**

### **Bucket: `media`**

**Estructura de paths:**
```
media/
  user-media/
    {user_id}/
      p1.jpg          → Avatar
      p2.jpg          → Foto dato curioso
      p3.jpg          → Foto gusta bailar
      p4.jpg          → Carrusel 1
      p5.jpg          → Carrusel 2
      p6.jpg          → Carrusel 3
      v1.mp4          → Video principal
      v2.mp4          → Video secundario 1
      v3.mp4          → Video secundario 2
```

**Políticas de Storage:**
- **Upload:** Solo el dueño (`user_id = auth.uid()`)
- **Read:** Público (para perfiles live)
- **Delete:** Solo el dueño

---

## ✅ **Ventajas del Sistema Unificado**

| Aspecto | Sistema Antiguo (avatar_url) | Sistema Nuevo (Slots) |
|---------|------------------------------|------------------------|
| **Gestión** | Dispersa (avatar_url + media) | Unificada (solo media) |
| **Escalabilidad** | Difícil de expandir | Fácil (solo agregar slots) |
| **Consistencia** | Dos formas de hacer lo mismo | Una sola fuente de verdad |
| **Mantenimiento** | Duplicado de lógica | Lógica centralizada |
| **Tipado** | Débil (string simple) | Fuerte (MediaItem type) |

---

## 🚀 **Próximos Pasos**

### **Opcional - Deprecar `avatar_url`**

Si todos los usuarios han migrado a slots, puedes:

1. **Remover el campo `avatar_url` de la tabla:**
```sql
ALTER TABLE public.profiles_user DROP COLUMN avatar_url;
```

2. **Actualizar tipos TypeScript:**
```typescript
// En types/db.ts
export interface ProfileUser {
  user_id: string;
  display_name?: string;
  bio?: string;
  // avatar_url?: string; ← REMOVER
  media?: MediaItem[];
  // ... resto de campos
}
```

3. **Limpiar imports obsoletos:**
- Buscar y reemplazar referencias a `avatar_url` en componentes
- Usar `getMediaBySlot(media, 'p1')` en su lugar

---

## 📚 **Referencias**

- **Hook Principal:** `apps/web/src/hooks/useUserMediaSlots.ts`
- **Utilidades:** `apps/web/src/utils/mediaSlots.ts`
- **Editor:** `apps/web/src/screens/profile/UserProfileEditor.tsx`
- **Vista Live:** `apps/web/src/screens/profile/UserProfileLive.tsx`
- **Migración:** `apps/web/MIGRAR_AVATAR_A_P1.sql`

---

## 🐛 **Troubleshooting**

### **Problema: Avatar no se muestra después de subirlo**

**Solución:**
1. Verifica que el archivo se subió correctamente a Supabase Storage
2. Revisa que el RPC `merge_profiles_user` se ejecutó sin errores
3. Confirma que `media` tiene un objeto con `slot: 'p1'`

```sql
-- Verificar media de un usuario
SELECT media FROM profiles_user WHERE user_id = auth.uid();
```

### **Problema: Error al subir archivo**

**Posibles causas:**
- Archivo demasiado grande (límite: 5MB recomendado)
- Formato no soportado (solo JPG, PNG, GIF, MP4, WEBM)
- Permisos de Storage incorrectos

**Solución:**
```sql
-- Verificar políticas de Storage
SELECT * FROM storage.policies WHERE bucket_id = 'media';
```

---

## 📝 **Notas Finales**

- ✅ **Sistema completamente funcional** desde v1.0
- ✅ **Migración automática** disponible para usuarios existentes
- ✅ **Documentación completa** para mantenimiento futuro
- ✅ **Escalable** para nuevos slots si se necesitan en el futuro

**¡Sistema unificado de media implementado exitosamente!** 🎉
