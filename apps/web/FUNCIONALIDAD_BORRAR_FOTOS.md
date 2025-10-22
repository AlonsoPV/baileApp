# 🗑️ Funcionalidad de Borrar Fotos/Videos

## 📋 Resumen

Sistema completo para eliminar fotos y videos de los perfiles de usuario y organizador, con confirmación de seguridad y feedback visual.

---

## ✅ Componentes Actualizados

### **1. MediaGrid.tsx**
Botón de eliminar mejorado:

**Características:**
- 🗑️ **Icono circular:** Botón redondo con emoji de papelera
- ✅ **Confirmación:** Diálogo "¿Estás seguro de eliminar esta foto/video?"
- 🎨 **Animaciones:** Hover scale 1.05, tap scale 0.95
- 👁️ **Visible siempre:** `opacity: 0.7` inicial (antes solo visible en hover)
- 🎯 **Tooltip:** `title="Eliminar"` para accesibilidad
- 🛡️ **Stop propagation:** `e.stopPropagation()` para evitar clicks accidentales

**Código del botón:**
```tsx
<motion.button
  initial={{ opacity: 0.7 }}
  whileHover={{ opacity: 1, scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  onClick={(e) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de eliminar esta foto/video?')) {
      onRemove(m.id);
    }
  }}
  style={{
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: colors.coral,
    fontSize: '1.2rem',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: `2px solid ${colors.light}`,
    boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
  }}
>
  🗑️
</motion.button>
```

---

### **2. useUserMedia.ts**
Hook mejorado para gestión de media de usuarios:

**Mejoras:**
- ✅ Usa `supabase.rpc("merge_profiles_user")` para actualizaciones seguras
- 📝 Logging detallado en cada paso
- ⚠️ Manejo de errores robusto con try-catch
- 🔄 Invalidación de queries automática

**Flujo de eliminación:**
1. Eliminar archivo de Supabase Storage (`removeUserFile`)
2. Filtrar el ID de la lista local
3. Actualizar la lista en DB usando RPC merge
4. Invalidar queries para refrescar UI

**Logging:**
```
[useUserMedia] Removing media: {id}
[useUserMedia] File removed from storage
[useUserMedia] Media list updated in DB
[useUserMedia] Invalidating queries after media removal
```

---

### **3. useOrganizerMedia.ts**
Hook para gestión de media de organizadores:

**Mejoras:**
- 📝 Logging detallado similar a `useUserMedia`
- ⚠️ Manejo de errores mejorado
- 🔄 Invalidación de queries para organizer y media

**Flujo de eliminación:**
```
1. removeOrgFile(path) → Elimina de org-media bucket
2. filter(m => m.id !== path) → Remueve de lista local
3. save(next) → UPDATE en profiles_organizer
4. invalidateQueries → Refresca UI
```

---

## 🎯 Cómo Funciona

### **Flujo Completo (Usuario):**

```
Usuario hace click en 🗑️
       ↓
Aparece confirmación
"¿Estás seguro de eliminar esta foto/video?"
       ↓
Usuario confirma (OK)
       ↓
removeMedia.mutateAsync(id)
       ↓
┌─────────────────────────────┐
│ 1. Eliminar de Storage      │
│    supabase.storage.remove  │
└─────────────────────────────┘
       ↓
┌─────────────────────────────┐
│ 2. Filtrar ID de lista      │
│    filter(m => m.id !== id) │
└─────────────────────────────┘
       ↓
┌─────────────────────────────┐
│ 3. Actualizar DB            │
│    rpc("merge_profiles...")│
└─────────────────────────────┘
       ↓
┌─────────────────────────────┐
│ 4. Invalidar queries        │
│    React Query refetch      │
└─────────────────────────────┘
       ↓
✅ UI actualizada
Toast: "Media eliminada"
```

---

### **Flujo Completo (Organizador):**

Idéntico al de usuario, pero:
- Usa bucket `org-media` en lugar de `user-media`
- Actualiza `profiles_organizer` en lugar de `profiles_user`
- Invalida queries de organizer

---

## 🧪 Testing

### **Test 1: Eliminar foto de usuario**
```
1. Login como usuario
2. Ve a /app/profile/edit
3. Sube una foto
4. Verifica que aparece en la galería
5. Hover sobre la foto → ver botón 🗑️
6. Click en 🗑️
7. Confirma en el diálogo
8. ✅ Foto desaparece
9. ✅ Toast "Media eliminada"
10. ✅ Consola muestra logs detallados
```

### **Test 2: Eliminar video de organizador**
```
1. Login como usuario
2. Switch a rol "Organizador"
3. Ve a perfil de organizador (edit)
4. Sube un video
5. Verifica que aparece en la galería
6. Click en 🗑️ del video
7. Confirma en el diálogo
8. ✅ Video desaparece
9. ✅ Toast "Media eliminada"
```

### **Test 3: Cancelar eliminación**
```
1. Click en 🗑️
2. Aparece confirmación
3. Click en "Cancelar"
4. ✅ Foto NO se elimina
5. ✅ Diálogo se cierra
```

---

## 🔍 Debugging

### **Logs en Consola (F12):**

**Eliminación exitosa:**
```
[useUserMedia] Removing media: abc123-uuid.jpg
[Storage] Removing file from storage...
[useUserMedia] File removed from storage
[useUserMedia] Updating media array: 2 items
[useUserMedia] Media updated successfully
[useUserMedia] Media list updated in DB
[useUserMedia] Invalidating queries after media removal
```

**Error al eliminar:**
```
[useUserMedia] Removing media: abc123-uuid.jpg
[useUserMedia] Error removing media: {error details}
Toast: "Error al eliminar"
```

---

## 🛡️ Seguridad

### **1. Confirmación de Usuario**
- `window.confirm()` previene eliminaciones accidentales
- Mensaje claro: "¿Estás seguro de eliminar esta foto/video?"

### **2. Stop Propagation**
- `e.stopPropagation()` evita clicks en el contenedor padre
- Solo el botón 🗑️ activa la eliminación

### **3. RLS (Row Level Security)**
Ya configurado en Supabase:

**Storage RLS:**
```sql
-- user-media
DELETE: auth.uid() = (storage.foldername(name))[1]::uuid

-- org-media
DELETE: 
  EXISTS (
    SELECT 1 FROM profiles_organizer
    WHERE id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
  )
```

---

## 📊 Estados del Botón

| Estado | Opacity | Scale | Cursor | Descripción |
|--------|---------|-------|--------|-------------|
| **Inicial** | 0.7 | 1.0 | pointer | Visible pero discreto |
| **Hover** | 1.0 | 1.05 | pointer | Destacado |
| **Tap** | 1.0 | 0.95 | pointer | Feedback táctil |
| **Confirmando** | 1.0 | 1.0 | default | Diálogo de confirmación |

---

## 🎨 Diseño Visual

### **Antes (oculto en hover):**
- Solo visible al hacer hover
- Texto "Eliminar"
- Rectángulo pequeño

### **Después (siempre visible):**
- ✅ Siempre visible (`opacity: 0.7`)
- 🗑️ Emoji de papelera
- ⭕ Círculo con borde blanco
- 🎯 Posición: top-right (8px)
- 🌈 Color coral (#FF3D57)
- ✨ Sombra pronunciada

**Screenshot imaginario:**
```
┌─────────────────┐
│                🗑️│ ← Botón siempre visible
│                 │
│   [📷 Imagen]   │
│                 │
│                 │
└─────────────────┘
```

---

## 💡 Mejoras Futuras (Opcional)

### **1. Confirmación Personalizada**
Reemplazar `window.confirm()` con un modal custom:
```tsx
<ConfirmDialog
  title="Eliminar foto"
  message="Esta acción no se puede deshacer"
  onConfirm={() => removeMedia(id)}
/>
```

### **2. Undo (Deshacer)**
Toast con botón "Deshacer" para recuperar:
```tsx
showToast(
  <div>
    Media eliminada
    <button onClick={undo}>Deshacer</button>
  </div>,
  'success',
  10000 // 10 seg para deshacer
);
```

### **3. Animación de Salida**
Animación fade-out antes de remover:
```tsx
<motion.div
  exit={{ opacity: 0, scale: 0.8 }}
  transition={{ duration: 0.3 }}
>
  {/* MediaItem */}
</motion.div>
```

### **4. Eliminación Múltiple**
Modo selección para borrar varias fotos a la vez:
```tsx
const [selectedIds, setSelectedIds] = useState<string[]>([]);

<button onClick={() => removeMultiple(selectedIds)}>
  Eliminar {selectedIds.length} fotos
</button>
```

---

## ✅ Checklist de Funcionalidad

- [x] Botón visible en MediaGrid
- [x] Confirmación antes de eliminar
- [x] Elimina de Storage (Supabase)
- [x] Actualiza lista en DB
- [x] Invalidación de queries
- [x] Toast de éxito/error
- [x] Logging detallado
- [x] Funciona en perfil de usuario
- [x] Funciona en perfil de organizador
- [x] RLS configurado
- [x] Animaciones Framer Motion
- [x] Stop propagation
- [x] Manejo de errores robusto

---

## 🎉 Resultado Final

✅ **Sistema completo de eliminación de fotos/videos**  
✅ **Confirmación de seguridad integrada**  
✅ **Feedback visual con toast y animaciones**  
✅ **Logging detallado para debugging**  
✅ **Funciona en todos los tipos de perfil**  
✅ **RLS para seguridad en Storage**  

**¡Los usuarios ahora pueden gestionar sus fotos completamente!** 📸✨

