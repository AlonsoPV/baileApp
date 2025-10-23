# 🎨 Perfil Live Visual con Slots de Foto/Video

## 📋 Resumen

Sistema completo de perfil público (Live) con diseño visual moderno y gestión de media por slots individuales (6 fotos + 3 videos).

---

## 🎯 Características Implementadas

### **1. Vista Live (Pública)**
✅ Banner con gradiente y avatar circular recortado
✅ Chips de ritmos y zonas con colores distintivos
✅ Bio y enlaces a redes sociales
✅ Sección "Acompáñame a estos eventos" con RSVPs
✅ Galería de fotos (6 slots individuales)
✅ Galería de videos (3 slots individuales)
✅ Solo muestra contenido existente (sin placeholders)

### **2. Editor de Media**
✅ Subida individual por slot (p1-p6 para fotos, v1-v3 para videos)
✅ Vista previa de cada slot
✅ Botón de quitar por slot
✅ Integración con Supabase Storage
✅ Actualización automática del perfil

---

## 📁 Archivos Creados

### **Configuración y Utilidades**

#### `src/ui/theme.ts`
```typescript
export const colors = {
  bg: "#0B0F14",
  panel: "#121720",
  panelSoft: "#0F141C",
  text: "#EDEFF3",
  sub: "#AAB2C0",
  chip: { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)" },
  grad: "linear-gradient(135deg, #FF4D4D, #FFB200 35%, #2D9CDB 70%, #FFE056)",
  accent: "#FF6B6B",
};
export const avatarSize = 112;
```

#### `src/utils/mediaSlots.ts`
```typescript
export const PHOTO_SLOTS = ["p1","p2","p3","p4","p5","p6"];
export const VIDEO_SLOTS = ["v1","v2","v3"];

export type MediaItem = {
  slot: string;
  kind: "photo"|"video";
  url: string;
  thumb?: string;
  title?: string;
};

// Funciones: getMediaBySlot, upsertMediaSlot, removeMediaSlot
```

### **Componentes**

#### `src/components/ImageWithFallback.tsx`
Componente de imagen con fallback automático para manejar errores de carga.

### **Pantallas**

#### `src/screens/profile/UserProfileLive.tsx`
Vista pública del perfil con:
- Banner gradiente
- Avatar circular (112x112px)
- Chips de ritmos/zonas
- Bio y redes sociales
- Eventos donde asistirá
- Galería de fotos por slots
- Galería de videos por slots

#### `src/screens/profile/UserMediaEditor.tsx`
Editor de media con:
- Grid de 6 slots para fotos
- Grid de 3 slots para videos
- Subida individual por slot
- Vista previa
- Botón de eliminar

---

## 🎨 Diseño Visual

### **Paleta de Colores**
```
Background:      #0B0F14
Panel:           #121720
Panel Soft:      #0F141C
Text:            #EDEFF3
Subtitle:        #AAB2C0
Chip BG:         rgba(255,255,255,0.06)
Chip Border:     rgba(255,255,255,0.12)
Gradient:        #FF4D4D → #FFB200 → #2D9CDB → #FFE056
Accent:          #FF6B6B
```

### **Layout**

#### Vista Live
```
┌──────────────────────────────────────┐
│   Banner Gradiente (180px)          │
│                                       │
│        ┌───────┐                     │
│        │Avatar │ (sobresale)         │
└────────└───────┘─────────────────────┘
         Nombre
         🎵 Chips de Ritmos
         📍 Chips de Zonas
         Bio
         🔗 Redes Sociales
         
         📅 Acompáñame a estos eventos
         [Evento 1] [Evento 2] [Evento 3]
         
         📷 Fotos
         [p1] [p2] [p3]
         [p4] [p5] [p6]
         
         🎬 Videos
         [v1] [v2] [v3]
```

#### Editor
```
┌──────────────────────────────────────┐
│ Fotos                                │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ Slot P1 │ │ Slot P2 │ │ Slot P3 ││
│ │ [Image] │ │ [Image] │ │ [Empty] ││
│ │[Subir]  │ │[Subir]  │ │[Subir]  ││
│ │[Quitar] │ │[Quitar] │ │         ││
│ └─────────┘ └─────────┘ └─────────┘│
│                                      │
│ Videos                               │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ Slot V1 │ │ Slot V2 │ │ Slot V3 ││
│ │ [Video] │ │ [Empty] │ │ [Empty] ││
│ │[Subir]  │ │[Subir]  │ │[Subir]  ││
│ │[Quitar] │ │         │ │         ││
│ └─────────┘ └─────────┘ └─────────┘│
└──────────────────────────────────────┘
```

---

## 🔧 Configuración Requerida

### **1. Supabase Storage**

Crear bucket `media` (público):

```sql
-- En Supabase Dashboard → Storage → Create bucket
-- Name: media
-- Public: Yes
```

Configurar políticas RLS:

```sql
-- Policy: Cualquiera puede leer
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Policy: Usuario puede subir sus propias fotos
CREATE POLICY "Users can upload own media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Usuario puede actualizar sus propias fotos
CREATE POLICY "Users can update own media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Usuario puede eliminar sus propias fotos
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### **2. Assets Públicos**

Agregar en `public/`:
- `default-avatar.png` (200x200px) - Avatar por defecto
- `default-media.png` (600x400px) - Imagen placeholder

### **3. Integración en Rutas**

Actualizar `src/router.tsx`:

```typescript
// Vista pública (ya existe)
<Route path="/app/profile" element={<UserProfileLive />} />

// En tu editor de perfil existente, agregar:
import UserMediaEditor from "./UserMediaEditor";

<section className="mt-10">
  <h2 className="text-xl font-semibold mb-3">Tus fotos y videos</h2>
  <UserMediaEditor />
</section>
```

---

## 📊 Modelo de Datos

### **Estructura de `profiles_user.media`**

```typescript
media: MediaItem[] = [
  {
    slot: "p1",
    kind: "photo",
    url: "https://..../user-media/{user_id}/p1.jpg",
    title: "Mi primera foto",  // opcional
  },
  {
    slot: "v1",
    kind: "video",
    url: "https://..../user-media/{user_id}/v1.mp4",
  },
  // ... más slots
]
```

### **Slots Disponibles**

**Fotos:** `p1`, `p2`, `p3`, `p4`, `p5`, `p6` (6 slots)
**Videos:** `v1`, `v2`, `v3` (3 slots)

---

## 🎯 Funcionalidades

### **Vista Live**

**Renderizado Condicional:**
- Solo muestra slots con contenido
- Si no hay fotos: muestra "Sin fotos por ahora"
- Si no hay videos: muestra "Sin videos por ahora"
- Si no hay eventos RSVP: muestra "Sin eventos por ahora"

**Chips de Tags:**
- Ritmos: Color coral (#FF3D57) con icono 🎵
- Zonas: Color amarillo (#FFD166) con icono 📍

**Eventos RSVP:**
- Filtra solo eventos con status 'asistire'
- Muestra fecha formateada (locale español)
- Link directo al evento público

### **Editor**

**Subida de Archivos:**
1. Usuario selecciona archivo
2. Se sube a `user-media/{user_id}/{slot}.{ext}`
3. Se obtiene URL pública
4. Se actualiza array `media` en `profiles_user`
5. Vista se actualiza automáticamente

**Eliminación:**
1. Usuario hace click en "Quitar"
2. Se filtra el slot del array `media`
3. Se actualiza `profiles_user`
4. Vista se actualiza automáticamente

---

## ✨ Características Especiales

### **1. Fallback de Imágenes**
Si una imagen falla al cargar, automáticamente muestra el placeholder.

### **2. Avatar Sobresaliente**
El avatar se posiciona con `-bottom-14` para sobresalir del banner.

### **3. Gradiente Dinámico**
Banner con gradiente de 4 colores que crea un efecto visual moderno.

### **4. Responsive**
- Mobile: 1 columna
- Tablet: 2 columnas  
- Desktop: 3 columnas

### **5. Performance**
Solo carga y renderiza slots con contenido, optimizando el rendimiento.

---

## 🚀 Uso

### **Ver Perfil Público**
```
/app/profile
```

### **Editar Media**
Integrar `UserMediaEditor` en tu pantalla de edición existente.

---

## 📝 Notas Importantes

1. **Bucket Media**: Debe estar configurado como público en Supabase
2. **RLS Policies**: Solo el dueño puede subir/modificar/eliminar
3. **Formato de URLs**: `user-media/{user_id}/{slot}.{ext}`
4. **Límites**: 6 fotos + 3 videos por usuario
5. **Upsert**: Subir al mismo slot reemplaza el archivo anterior

---

## 🎨 Personalización

### **Cambiar Colores**
Editar `src/ui/theme.ts`

### **Cambiar Número de Slots**
Editar `src/utils/mediaSlots.ts`:
```typescript
export const PHOTO_SLOTS = ["p1","p2","p3","p4","p5","p6","p7","p8"];
export const VIDEO_SLOTS = ["v1","v2","v3","v4"];
```

### **Cambiar Tamaño de Avatar**
Editar `src/ui/theme.ts`:
```typescript
export const avatarSize = 128; // o el tamaño deseado
```

---

## ✅ Checklist de Implementación

- [x] Crear `src/ui/theme.ts`
- [x] Crear `src/utils/mediaSlots.ts`
- [x] Crear `src/components/ImageWithFallback.tsx`
- [x] Actualizar `src/screens/profile/UserProfileLive.tsx`
- [x] Crear `src/screens/profile/UserMediaEditor.tsx`
- [ ] Crear bucket `media` en Supabase Storage
- [ ] Configurar RLS policies
- [ ] Agregar `default-avatar.png` en `public/`
- [ ] Agregar `default-media.png` en `public/`
- [ ] Integrar `UserMediaEditor` en pantalla de edición

---

## 🐛 Troubleshooting

**Problema: Imágenes no se muestran**
- Verificar que el bucket `media` sea público
- Verificar las políticas RLS
- Verificar la URL pública en Supabase

**Problema: No se puede subir**
- Verificar que el usuario esté autenticado
- Verificar las políticas RLS de INSERT
- Verificar el tamaño del archivo (límites de Supabase)

**Problema: Avatar/media muestra placeholder**
- Verificar la URL en la base de datos
- Verificar que el archivo exista en Storage
- Agregar `default-avatar.png` y `default-media.png` en `public/`

---

¡Sistema de Perfil Live Visual implementado! 🎉

