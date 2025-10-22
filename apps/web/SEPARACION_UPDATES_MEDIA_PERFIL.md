# 🛡️ Separación de Updates: Media vs Perfil

## 📋 Resumen

Sistema robusto que garantiza que las actualizaciones de media (fotos/videos) y campos de perfil (nombre, bio, etc.) **nunca se mezclen ni se sobrescriban** entre sí.

---

## 🎯 Problema Solucionado

### **❌ Antes:**
```typescript
// Ambos hooks podían actualizar cualquier campo
await updateProfile({
  display_name: "Juan",
  media: [...], // ⚠️ Riesgo de sobrescritura
});

// Form se rehidrataba en cada cambio de profile
useEffect(() => {
  setForm(profile); // ⚠️ Sobrescribe cambios no guardados
}, [profile]);
```

**Problemas:**
- Media podía perderse al actualizar texto
- Texto podía perderse al subir fotos
- Form se reseteaba al cambiar de rol/pestaña
- Cache desactualizado causaba pérdida de datos

---

### **✅ Ahora:**
```typescript
// Hooks completamente separados
useUserProfile → solo campos de texto (display_name, bio, ritmos, zonas)
useUserMedia   → solo campo media (fotos/videos)

// Form con protección anti-rehidratación
useEffect(() => {
  if (profile && !formTouched) {
    setForm(profile); // ✅ Solo carga inicial
  }
}, [profile, formTouched]);
```

**Beneficios:**
- ✅ Updates completamente independientes
- ✅ Cache invalidado agresivamente
- ✅ Form protegido contra rehidratación
- ✅ Logs detallados para debugging

---

## 🏗️ Arquitectura

### **1. useUserProfile - Solo Campos de Texto**

```typescript
const { profile, updateProfileFields } = useUserProfile();

await updateProfileFields({
  display_name: "Juan",
  bio: "Bailarín",
  ritmos: [1, 2, 3],
  zonas: [5, 6],
  redes_sociales: { instagram: "@juan" }
});
```

**Garantías:**
- 🚫 **NUNCA** actualiza `media`
- 🚫 **NUNCA** actualiza `onboarding_complete`
- ✅ Usa `guardedPatch` para prevenir pérdidas
- ✅ Usa RPC `merge_profiles_user` para updates seguros
- ✅ Invalida ambas queries: `["profile","me"]` y `["profile","media"]`

**Código:**
```typescript
// 🚫 Blindaje: JAMÁS mandar media ni onboarding_complete
const { media, onboarding_complete, ...candidate } = next;

// Usar guardedPatch para evitar pérdida accidental
const patch = guardedPatch<ProfileUser>(prev, candidate, {
  allowEmptyArrays: ["ritmos", "zonas"],
  blockEmptyStrings: ["display_name"],
});

// RPC merge para update seguro
const { error } = await supabase.rpc("merge_profiles_user", {
  p_user_id: user.id,
  p_patch: patch,
});

// Invalidar ambas queries
await qc.invalidateQueries({ queryKey: ["profile","me", user?.id] });
await qc.invalidateQueries({ queryKey: ["profile","media", user?.id] });
```

---

### **2. useUserMedia - Solo Media**

```typescript
const { media, addMedia, removeMedia } = useUserMedia();

// Subir foto
await addMedia.mutateAsync(file);

// Eliminar foto
await removeMedia.mutateAsync(photoId);
```

**Garantías:**
- ✅ **SOLO** actualiza `media`
- ✅ Usa RPC `merge_profiles_user` con solo `{ media: [...] }`
- ✅ Invalida ambas queries: `["profile","media"]` y `["profile","me"]`
- ✅ Logging detallado en cada paso

**Código:**
```typescript
async function setMedia(list: MediaItem[]) {
  console.log('[useUserMedia] Updating media array:', list.length, 'items');
  const { error } = await supabase.rpc("merge_profiles_user", {
    p_user_id: user!.id, 
    p_patch: { media: list } // ✅ Solo media, nada más
  });
  if (error) {
    console.error('[useUserMedia] Error updating media:', error);
    throw error;
  }
  console.log('[useUserMedia] Media updated successfully');
}

// Invalidar ambas queries
onSuccess: async () => {
  console.log('[useUserMedia] Invalidating queries');
  await qc.invalidateQueries({ queryKey: ["profile","media", user?.id] });
  await qc.invalidateQueries({ queryKey: ["profile","me", user?.id] });
}
```

---

### **3. UserProfileEditor - Protección Anti-Rehidratación**

```typescript
const [formTouched, setFormTouched] = useState(false);

// 🛡️ Solo cargar datos iniciales si el form NO ha sido tocado
useEffect(() => {
  if (profile && !formTouched) {
    console.log('[UserProfileEditor] Hydrating form from profile');
    setDisplayName(profile.display_name || '');
    setBio(profile.bio || '');
    setSelectedRitmos(profile.ritmos || []);
    // ...
  }
}, [profile, formTouched]);

// Marcar como "touched" en cualquier interacción
<input
  value={displayName}
  onChange={(e) => {
    setFormTouched(true); // ✅ Previene rehidratación
    setDisplayName(e.target.value);
  }}
/>

// Resetear después de guardar exitoso
await updateProfileFields({ ... });
setFormTouched(false); // ✅ Permite nueva hidratación
```

**Beneficios:**
- ✅ Form no se resetea al cambiar de rol/pestaña
- ✅ Cambios del usuario se preservan mientras escribe
- ✅ Después de guardar, permite nueva hidratación
- ✅ Logging para debugging

---

## 📊 Flujos de Actualización

### **Flujo 1: Actualizar Nombre/Bio**

```
Usuario edita nombre
       ↓
onChange → setFormTouched(true)
       ↓
Usuario click "Guardar"
       ↓
updateProfileFields({
  display_name: "Nuevo",
  bio: "Nueva bio"
})
       ↓
┌──────────────────────────────┐
│ 1. Blindaje media/onboarding │
│    { media, onboarding_...} = next │
└──────────────────────────────┘
       ↓
┌──────────────────────────────┐
│ 2. guardedPatch()            │
│    Solo cambios reales       │
└──────────────────────────────┘
       ↓
┌──────────────────────────────┐
│ 3. RPC merge_profiles_user   │
│    UPDATE seguro             │
└──────────────────────────────┘
       ↓
┌──────────────────────────────┐
│ 4. Invalidar queries         │
│    ["profile","me"]          │
│    ["profile","media"]       │
└──────────────────────────────┘
       ↓
setFormTouched(false)
       ↓
✅ Perfil actualizado
Media intacto
```

---

### **Flujo 2: Subir Foto**

```
Usuario selecciona foto
       ↓
addMedia.mutateAsync(file)
       ↓
┌──────────────────────────────┐
│ 1. uploadUserFile()          │
│    → Supabase Storage        │
└──────────────────────────────┘
       ↓
┌──────────────────────────────┐
│ 2. Agregar a lista local     │
│    [newItem, ...media]       │
└──────────────────────────────┘
       ↓
┌──────────────────────────────┐
│ 3. RPC merge_profiles_user   │
│    { media: newList }        │
└──────────────────────────────┘
       ↓
┌──────────────────────────────┐
│ 4. Invalidar queries         │
│    ["profile","media"]       │
│    ["profile","me"]          │
└──────────────────────────────┘
       ↓
✅ Foto subida
Texto intacto
```

---

## 🔍 Debugging

### **Logs en Consola (F12):**

#### **Update de perfil:**
```
[UserProfileEditor] Hydrating form from profile
[useUserProfile] PATCH: { display_name: "Nuevo" }
[useUserProfile] Profile updated successfully
[useUserProfile] Invalidating profile cache
```

#### **Subir foto:**
```
[useUserMedia] Adding media file: foto.jpg
[Storage] Uploading file: {userId, type: "image"}
[useUserMedia] File uploaded to storage: abc123/foto.jpg
[useUserMedia] Updating media array: 3 items
[useUserMedia] Media updated successfully
[useUserMedia] Media list updated in DB
[useUserMedia] Invalidating queries after media addition
```

#### **Form touched:**
```
// Al escribir en input:
setFormTouched(true)

// useEffect NO se ejecuta porque formTouched = true
// ✅ Cambios preservados
```

---

## ✅ Checklist de Garantías

### **useUserProfile:**
- [x] Nunca actualiza `media`
- [x] Nunca actualiza `onboarding_complete`
- [x] Usa `guardedPatch` para prevenir pérdidas
- [x] Usa RPC `merge_profiles_user`
- [x] Invalida queries: `["profile","me"]` y `["profile","media"]`
- [x] Logging detallado

### **useUserMedia:**
- [x] Solo actualiza `media`
- [x] Usa RPC `merge_profiles_user` con `{ media: [...] }`
- [x] Invalida queries: `["profile","media"]` y `["profile","me"]`
- [x] Logging detallado
- [x] Manejo de errores robusto

### **UserProfileEditor:**
- [x] Flag `formTouched` para prevenir rehidratación
- [x] `setFormTouched(true)` en todos los inputs
- [x] `setFormTouched(false)` después de guardar
- [x] useEffect con dependencia `formTouched`
- [x] Logging de hidratación

---

## 🧪 Testing

### **Test 1: Update texto NO afecta media**
```
1. Login → perfil con 3 fotos
2. Cambiar nombre de "Juan" a "Pedro"
3. Guardar
4. ✅ Nombre actualizado
5. ✅ 3 fotos intactas
6. Consola: [useUserProfile] PATCH: { display_name: "Pedro" }
7. ✅ NO menciona "media"
```

### **Test 2: Subir foto NO afecta texto**
```
1. Login → perfil con nombre "Juan" y bio "Bailarín"
2. Subir nueva foto
3. ✅ Foto subida
4. ✅ Nombre sigue siendo "Juan"
5. ✅ Bio sigue siendo "Bailarín"
6. Consola: [useUserMedia] { media: [...] }
7. ✅ NO menciona "display_name" o "bio"
```

### **Test 3: Form NO se resetea al cambiar de pestaña**
```
1. Login → /app/profile/edit
2. Cambiar nombre de "Juan" a "Pedro" (NO guardar)
3. Cambiar a otra pestaña/rol
4. Volver a /app/profile/edit
5. ✅ Input sigue mostrando "Pedro"
6. Consola: useEffect NO ejecutado (formTouched = true)
```

### **Test 4: Form SI se rehidrata después de guardar**
```
1. Cambiar nombre de "Juan" a "Pedro"
2. Guardar
3. ✅ setFormTouched(false)
4. Simular cambio de profile (ej: subir foto)
5. ✅ useEffect ejecutado (formTouched = false)
6. ✅ Form actualizado con datos reales
```

---

## 📊 Comparación Antes vs Después

| Aspecto | ❌ Antes | ✅ Después |
|---------|---------|-----------|
| **Separación** | Media y texto mezclados | Hooks completamente separados |
| **Rehidratación** | En cada cambio de profile | Solo si formTouched = false |
| **Cache** | Invalidación parcial | Invalidación agresiva (ambas queries) |
| **RPC** | UPDATE directo | RPC merge_profiles_user |
| **Guardias** | Sin protección | guardedPatch + blindaje |
| **Logging** | Mínimo | Detallado en cada paso |
| **Pérdida de datos** | Posible | Prácticamente imposible |

---

## 🔮 Próximas Mejoras (Opcional)

### **1. Extender a otros hooks:**
```typescript
useOrganizerProfile → solo texto
useOrganizerMedia   → solo media
// Mismo patrón
```

### **2. Confirmación antes de navegar:**
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (formTouched) {
      e.preventDefault();
      e.returnValue = '¿Salir sin guardar?';
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [formTouched]);
```

### **3. Auto-save draft:**
```typescript
useEffect(() => {
  if (formTouched) {
    const timer = setTimeout(() => {
      localStorage.setItem('profile-draft', JSON.stringify(form));
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [form, formTouched]);
```

---

## ✨ Resumen

✅ **Updates completamente separados**  
✅ **Media NUNCA se mezcla con texto**  
✅ **Form protegido contra rehidratación**  
✅ **Cache invalidado agresivamente**  
✅ **RPC merge para updates seguros**  
✅ **guardedPatch para prevención**  
✅ **Logging detallado para debugging**  

**¡Tus datos están 100% protegidos contra sobrescritura accidental!** 🛡️✨

