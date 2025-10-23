# 🖼️ Slot de Portada (Cover) Independiente

## 🎯 **Objetivo**

Separar la imagen de portada del banner de la foto de avatar, permitiendo a los usuarios tener:
- **Portada:** Imagen panorámica de fondo (slot `cover`)
- **Avatar:** Foto de perfil circular (slot `p1`)

---

## 📊 **Sistema de Slots Actualizado**

### **Nuevos Slots:**

| Slot | Tipo | Uso | Aspecto | Ubicación |
|------|------|-----|---------|-----------|
| **cover** | photo | Portada del banner | 21:9 | Fondo completo del banner |
| **p1** | photo | Avatar / Foto principal | 1:1 (circular) | Esquina superior izquierda del banner |
| **p2** | photo | Foto "Dato curioso" | 4:3 | Sección de pregunta 1 |
| **p3** | photo | Foto "Gusta bailar" | 4:3 | Sección de pregunta 2 |
| **p4-p6** | photo | Carrusel | 4:3 | Galería horizontal |
| **v1-v3** | video | Videos | 16:9 | Sección de videos |

---

## 🔧 **Implementación**

### **1️⃣ Actualización de `mediaSlots.ts`**

**Antes:**
```typescript
export const PHOTO_SLOTS = ["p1","p2","p3","p4","p5","p6"] as const;
export const VIDEO_SLOTS = ["v1","v2","v3"] as const;
```

**Después:**
```typescript
export const COVER_SLOT = "cover" as const;
export const PHOTO_SLOTS = ["p1","p2","p3","p4","p5","p6"] as const;
export const VIDEO_SLOTS = ["v1","v2","v3"] as const;

export type CoverSlot = typeof COVER_SLOT;
export type PhotoSlot = typeof PHOTO_SLOTS[number];
export type VideoSlot = typeof VIDEO_SLOTS[number];
export type MediaSlot = CoverSlot | PhotoSlot | VideoSlot;
```

### **2️⃣ UserProfileLive**

**Banner actualizado:**
```typescript
<div className="profile-banner" style={{
  background: getMediaBySlot(safeMedia, COVER_SLOT)?.url
    ? `url(${getMediaBySlot(safeMedia, COVER_SLOT)!.url})`  // ← Portada
    : colors.grad,  // ← Gradiente por defecto
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}}>
  {/* Avatar (p1) - Circular, esquina superior izquierda */}
  <div style={{ position: 'absolute', top: '2rem', left: '2rem' }}>
    <img src={getMediaBySlot(safeMedia, 'p1')?.url} ... />
  </div>
  
  {/* Nombre en la parte inferior */}
  <h1>{profile?.display_name}</h1>
</div>
```

### **3️⃣ UserProfileEditor**

**Nueva sección de portada:**
```typescript
{/* Sección de Foto de Portada */}
<div>
  <h2>🖼️ Foto de Portada del Banner</h2>
  
  {/* Preview 21:9 */}
  <div style={{ aspectRatio: '21/9' }}>
    {getMediaBySlot(media, COVER_SLOT) ? (
      <img src={...} />
    ) : (
      <div>Sin portada (gradiente por defecto)</div>
    )}
  </div>
  
  {/* Botones */}
  <button onClick={uploadCover}>📤 Subir Portada</button>
  <button onClick={removeCover}>🗑️ Eliminar</button>
</div>
```

**Ubicación:** Primera sección después del header (antes de Datos Básicos)

### **4️⃣ OrganizerProfileLive**

Mismo comportamiento que `UserProfileLive`:
```typescript
background: getMediaBySlot(media, COVER_SLOT)?.url
  ? `url(${getMediaBySlot(media, COVER_SLOT)!.url})`
  : `linear-gradient(135deg, ${colors.blue}, ${colors.coral})`
```

### **5️⃣ OrganizerProfileEditor**

Nueva sección idéntica a `UserProfileEditor`, con:
- Hook `useOrganizerMediaSlots`
- Funciones `uploadCover` y `removeCover`
- Preview con aspect ratio 21:9

---

## 🗄️ **Estructura de Datos**

```json
{
  "media": [
    {
      "slot": "cover",
      "kind": "photo",
      "url": "https://storage.supabase.co/.../portada.jpg",
      "title": "Foto de Portada"
    },
    {
      "slot": "p1",
      "kind": "photo",
      "url": "https://storage.supabase.co/.../avatar.jpg",
      "title": "Avatar Principal"
    },
    ...
  ]
}
```

---

## 🎨 **Diseño Visual**

### **Vista Live:**

```
┌─────────────────────────────────────────────────┐
│ BANNER (Foto de Portada - slot "cover")        │
│                                                 │
│  ┌────┐                                         │
│  │ p1 │ Avatar (circular)                       │
│  └────┘                                         │
│                                                 │
│                                                 │
│                                   Juan Pérez    │
│                    🎵 Salsa  📍 CDMX           │
└─────────────────────────────────────────────────┘
```

### **Vista Editor:**

```
┌─────────────────────────────────────┐
│  🖼️ Foto de Portada del Banner     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [Preview 21:9]              │   │
│  │ Portada o Gradiente         │   │
│  └─────────────────────────────┘   │
│                                     │
│  [📤 Subir Portada] [🗑️ Eliminar] │
└─────────────────────────────────────┘
```

---

## 🚀 **Uso del Sistema**

### **Para Usuarios:**

1. **Ir al editor:** Perfil → Toggle "Editar"
2. **Primera sección:** "🖼️ Foto de Portada del Banner"
3. **Subir imagen:** Click en "📤 Subir Portada"
4. **Resultado:** La imagen se muestra en el banner (21:9)
5. **Avatar separado:** Sección de fotos → P1 (circular)

### **Para Organizadores:**

Mismo proceso:
1. Perfil Organizador → Toggle "Editar"
2. Primera sección: Foto de Portada
3. Subir imagen de portada
4. Resultado: Portada independiente del avatar

---

## 🔄 **Hooks Creados**

### **`useUserMediaSlots`**
**Archivo:** `apps/web/src/hooks/useUserMediaSlots.ts`

```typescript
const { media, uploadToSlot, removeFromSlot } = useUserMediaSlots();

// Subir portada
await uploadToSlot.mutateAsync({ 
  file, 
  slot: COVER_SLOT, 
  kind: 'photo' 
});

// Eliminar portada
await removeFromSlot.mutateAsync(COVER_SLOT);
```

### **`useOrganizerMediaSlots`** (Nuevo)
**Archivo:** `apps/web/src/hooks/useOrganizerMediaSlots.ts`

```typescript
const { media, uploadToSlot, removeFromSlot } = useOrganizerMediaSlots();

// Funcionalidad idéntica a useUserMediaSlots
// Pero trabaja con profiles_organizer
```

---

## 📏 **Aspect Ratios**

| Slot | Aspect Ratio | Uso |
|------|--------------|-----|
| **cover** | 21:9 | Panorámico (portada banner) |
| **p1** | 1:1 | Cuadrado (avatar circular) |
| **p2-p6** | 4:3 | Estándar (fotos de perfil) |
| **v1-v3** | 16:9 | Video estándar |

---

## 🗂️ **Almacenamiento en Supabase**

### **Bucket: `media` (Usuarios)**

```
media/
  user-media/
    {user_id}/
      cover.jpg       ← Portada del banner
      p1.jpg          ← Avatar circular
      p2.jpg          ← Foto dato curioso
      p3.jpg          ← Foto gusta bailar
      p4-p6.jpg       ← Carrusel
      v1-v3.mp4       ← Videos
```

### **Bucket: `org-media` (Organizadores)**

```
org-media/
  {org_id}/
    cover.jpg       ← Portada del banner
    (otros slots si se implementan en el futuro)
```

---

## ✅ **Ventajas del Sistema**

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Portada** | No existía o era `p1` | Slot dedicado `cover` ✅ |
| **Avatar** | Mezclado con portada | Independiente en `p1` ✅ |
| **Aspect Ratio** | Inconsistente | Específico por uso ✅ |
| **Edición** | Confusa | Secciones claras ✅ |
| **Visual** | Limitado | Profesional ✅ |

---

## 🐛 **Troubleshooting**

### **Problema: La portada no se muestra**

**Solución:**
1. Verifica que se subió correctamente:
   ```sql
   SELECT media FROM profiles_user WHERE user_id = auth.uid();
   -- Busca: { "slot": "cover", ... }
   ```
2. Confirma que el URL es público
3. Revisa la consola del navegador

### **Problema: El avatar sigue mezclado con la portada**

**Causa:** Código antiguo aún usando `avatar_url` o `p1` para portada.

**Solución:**
1. Verifica que `UserProfileLive` usa `COVER_SLOT` para background
2. Verifica que `p1` solo se usa para el avatar circular

---

## 📝 **Migración (Opcional)**

Si ya tienes datos en `p1` que quieres usar como portada:

```sql
-- Duplicar p1 como cover (una sola vez)
UPDATE profiles_user
SET media = media || jsonb_build_array(
  jsonb_build_object(
    'slot', 'cover',
    'kind', 'photo',
    'url', (
      SELECT elem->>'url'
      FROM jsonb_array_elements(media) elem
      WHERE elem->>'slot' = 'p1'
      LIMIT 1
    ),
    'title', 'Foto de Portada'
  )
)
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(media) elem
  WHERE elem->>'slot' = 'p1'
)
AND NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements(media) elem
  WHERE elem->>'slot' = 'cover'
);
```

---

## 📚 **Referencias**

- **Utilidades:** `apps/web/src/utils/mediaSlots.ts`
- **Hook Usuario:** `apps/web/src/hooks/useUserMediaSlots.ts`
- **Hook Organizador:** `apps/web/src/hooks/useOrganizerMediaSlots.ts`
- **Editor Usuario:** `apps/web/src/screens/profile/UserProfileEditor.tsx`
- **Editor Organizador:** `apps/web/src/screens/profile/OrganizerProfileEditor.tsx`

---

## ✅ **Resultado Final**

**¡Slot de portada independiente implementado!** 🎉

Los usuarios y organizadores ahora pueden:
- ✅ Subir una **portada panorámica** para el banner
- ✅ Subir un **avatar circular** independiente
- ✅ Ver **preview** antes de guardar
- ✅ **Eliminar** cualquiera de las dos imágenes
- ✅ **Fallback automático** a gradiente si no hay portada

**Beneficios:**
- 🎨 Diseño más profesional y personalizable
- 🖼️ Separación clara de propósitos
- 📱 Responsive con aspect ratios específicos
- 🚀 Fácil de usar y mantener
