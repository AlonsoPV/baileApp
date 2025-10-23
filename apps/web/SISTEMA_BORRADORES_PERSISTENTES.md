# 💾 Sistema de Borradores Persistentes

## 🎯 **Objetivo**

Evitar que los usuarios pierdan datos al:
- Cambiar de pestaña o rol
- Cerrar accidentalmente el navegador
- Navegar a otra pantalla sin guardar
- Refrescar la página

---

## 📋 **Problema Resuelto**

### **❌ Antes:**

```
1. Usuario llena el formulario de perfil
2. Cambia de pestaña para ver su perfil Live
3. Regresa a Editar
4. ❌ EL FORMULARIO ESTÁ VACÍO (perdió todo)
```

### **✅ Ahora:**

```
1. Usuario llena el formulario de perfil
2. Cada cambio se guarda en localStorage
3. Cambia de pestaña para ver su perfil Live
4. Regresa a Editar
5. ✅ EL FORMULARIO SE RESTAURA (todo intacto)
```

---

## 🗄️ **Arquitectura del Sistema**

### **1️⃣ Store de Borradores (Zustand + Persist)**

**Archivo:** `src/state/drafts.ts`

```typescript
export const useDrafts = create<DraftStore>()(
  persist(
    (set, get) => ({
      drafts: {},  // { "draft:user:profile": { value: {...}, updatedAt: 123 } }
      setDraft: (key, value) => ...,
      getDraft: (key) => ...,
      clearDraft: (key) => ...,
      clearAll: () => ...
    }),
    {
      name: "baileapp:drafts:v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

**Características:**
- ✅ **Persistente** en localStorage
- ✅ **Versionado** (v1)
- ✅ **Timestamp** para cada borrador
- ✅ **Múltiples borradores** simultáneos

**Claves utilizadas:**
```typescript
"draft:user:profile"           // Perfil de usuario
"draft:org:123"                // Organizador ID 123
"draft:eventParent:456"        // Evento padre ID 456
"draft:eventDate:789"          // Fecha de evento ID 789
```

---

### **2️⃣ Hook `useHydratedForm`**

**Archivo:** `src/hooks/useHydratedForm.ts`

#### **Propósito:**
Hidrata formularios UNA SOLA VEZ desde:
1. **Borrador** (si existe y `preferDraft: true`)
2. **Server** (datos actuales de la BD)
3. **Defaults** (valores por defecto)

#### **Uso:**

```typescript
const { form, setField, setNested, setAll, hydrated } = useHydratedForm({
  draftKey: "draft:user:profile",
  serverData: profile,  // Datos del servidor
  defaults: {           // Valores por defecto
    display_name: "",
    bio: "",
    ritmos: []
  },
  preferDraft: true     // Preferir borrador sobre server
});

// Esperar a que se hidrate
if (!hydrated) return <Loading />;

// Cambiar un campo
setField('display_name', 'Nuevo Nombre');

// Cambiar campo anidado
setNested('redes_sociales.instagram', '@usuario');

// Reemplazar todo
setAll({ ...form, bio: 'Nueva bio' });
```

#### **Funciones:**

| Función | Uso | Persistencia |
|---------|-----|--------------|
| `setField(key, value)` | Actualizar campo de primer nivel | ✅ Automática |
| `setNested(path, value)` | Actualizar campo anidado | ✅ Automática |
| `setAll(newForm)` | Reemplazar todo el formulario | ✅ Automática |

---

### **3️⃣ Editores Actualizados**

#### **UserProfileEditor:**

```typescript
const { form, setField, setNested, hydrated } = useHydratedForm({
  draftKey: "draft:user:profile",
  serverData: profile,
  defaults: {
    display_name: "",
    bio: "",
    ritmos: [],
    zonas: [],
    redes_sociales: {
      instagram: "",
      tiktok: "",
      youtube: "",
      facebook: "",
      whatsapp: ""
    },
    respuestas: {
      dato_curioso: "",
      gusta_bailar: ""
    }
  }
});

// Input de nombre
<input
  value={form.display_name}
  onChange={(e) => setField('display_name', e.target.value)}
/>

// Input de Instagram (anidado)
<input
  value={form.redes_sociales.instagram}
  onChange={(e) => setNested('redes_sociales.instagram', e.target.value)}
/>

// Guardar
const saveAllData = async () => {
  await updateProfileFields(form);  // Envía todo el formulario
};
```

#### **OrganizerProfileEditor:**

```typescript
const { form, setField, setNested, hydrated } = useHydratedForm({
  draftKey: `draft:org:${org?.id || 'new'}`,
  serverData: org,
  defaults: {
    nombre_publico: "",
    bio: "",
    ritmos: [],
    zonas: [],
    respuestas: {
      musica_tocaran: "",
      hay_estacionamiento: ""
    }
  }
});
```

---

## 🔄 **Flujo Completo**

### **Escenario: Usuario edita su perfil**

```
1. Usuario abre UserProfileEditor
   ↓
2. useHydratedForm verifica localStorage
   ↓
3a. Si hay borrador: Carga desde "draft:user:profile"
3b. Si no hay: Carga desde serverData (profile)
   ↓
4. Usuario cambia el nombre
   onChange → setField('display_name', 'Nuevo')
   ↓
5. setField actualiza:
   - Estado local (form)
   - localStorage (draft)
   ↓
6. Usuario cierra por accidente el navegador
   ↓
7. Usuario vuelve a abrir
   ↓
8. useHydratedForm carga desde localStorage
   ↓
9. ✅ Formulario restaurado con todos los cambios
```

---

## ⚙️ **Configuración de QueryClient**

**Archivo:** `src/lib/queryClient.ts`

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,     // ← Evita refetch
      refetchOnReconnect: false,       // ← Evita refetch
      refetchOnMount: false,           // ← Evita refetch
    },
  },
});
```

**Beneficios:**
- ✅ No reemplaza formularios al cambiar de pestaña
- ✅ Datos en cache se usan durante 5 minutos
- ✅ Solo refetch manual con `refetch()` o invalidación

---

## 🧪 **Testing**

### **Test 1: Persistencia entre pestañas**

1. Abre tu perfil en modo Editar
2. Cambia el nombre a "Test123"
3. Cambia a modo Live (toggle)
4. Regresa a modo Editar
5. ✅ Verificar: El nombre sigue siendo "Test123"

### **Test 2: Persistencia tras cerrar navegador**

1. Edita tu perfil (nombre, bio, redes sociales)
2. Cierra el navegador **sin guardar**
3. Abre el navegador de nuevo
4. Ve al editor de perfil
5. ✅ Verificar: Todos los campos están llenos

### **Test 3: Merge con datos del servidor**

1. Llena formulario con datos A
2. En otra pestaña, actualiza datos B directamente en BD
3. Recarga el editor
4. ✅ Verificar: Tiene datos B (server) + campos nuevos de A (draft)

---

## 📊 **Estructura en localStorage**

```json
{
  "baileapp:drafts:v1": {
    "state": {
      "drafts": {
        "draft:user:profile": {
          "value": {
            "display_name": "Juan Pérez",
            "bio": "Bailarín profesional",
            "ritmos": [1, 2, 3],
            "redes_sociales": {
              "instagram": "@juan",
              "tiktok": "@juan_baila"
            }
          },
          "updatedAt": 1729712345678
        },
        "draft:org:5": {
          "value": {
            "nombre_publico": "Salsa Night Club",
            "bio": "Los mejores eventos de salsa"
          },
          "updatedAt": 1729712456789
        }
      }
    }
  }
}
```

---

## 🔒 **Limpieza de Borradores**

### **Automática (Opcional):**

Puedes agregar lógica para limpiar borradores antiguos:

```typescript
// En useHydratedForm o componente raíz
React.useEffect(() => {
  const draftsStore = useDrafts.getState().drafts;
  const now = Date.now();
  const MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 días
  
  Object.keys(draftsStore).forEach(key => {
    const draft = draftsStore[key];
    if (draft && now - draft.updatedAt > MAX_AGE) {
      useDrafts.getState().clearDraft(key);
    }
  });
}, []);
```

### **Manual:**

```typescript
// Limpiar borrador específico
useDrafts.getState().clearDraft("draft:user:profile");

// Limpiar todos los borradores
useDrafts.getState().clearAll();
```

---

## 🎯 **Casos de Uso**

### **Caso 1: Usuario interrumpido**

Usuario llena 20 campos, recibe llamada, cierra laptop.
- ✅ Al volver: Todo está guardado en draft

### **Caso 2: Usuario explora mientras edita**

Usuario edita perfil, va a explorar eventos, regresa.
- ✅ Formulario intacto

### **Caso 3: Usuario guarda y sigue editando**

Usuario guarda, hace más cambios, no guarda.
- ✅ Draft tiene los nuevos cambios
- ✅ Server tiene la versión guardada
- ✅ Al recargar: Usa draft (cambios más recientes)

---

## ⚠️ **Notas Importantes**

### **Media NO se guarda en draft:**

Los archivos de media (fotos/videos) tienen su propio hook:
- `useUserMediaSlots`
- `useOrganizerMedia`

Solo se guardan en draft los **metadatos** (URLs después de subir).

### **Conflictos Draft vs Server:**

Si `preferDraft: true`:
- Draft siempre gana sobre server
- Útil para seguir editando sin perder cambios

Si `preferDraft: false`:
- Server siempre gana sobre draft
- Útil después de guardar (para ver cambios confirmados)

---

## 📚 **Archivos del Sistema**

| Archivo | Propósito |
|---------|-----------|
| `src/state/drafts.ts` | Store de borradores con Zustand |
| `src/hooks/useHydratedForm.ts` | Hook de formularios hidratados |
| `src/utils/safePatch.ts` | Utilidades de merge y limpieza |
| `src/lib/queryClient.ts` | Configuración de React Query |
| `src/screens/profile/UserProfileEditor.tsx` | Editor con draft |
| `src/screens/profile/OrganizerProfileEditor.tsx` | Editor con draft |

---

## ✅ **Resultado Final**

**¡Sistema de borradores persistentes completamente implementado!** 🎉

**Beneficios:**
- ✅ **Cero pérdida de datos** al cambiar de pantalla
- ✅ **Recuperación automática** tras cierre de navegador
- ✅ **Hidratación única** - No reescribe con vacíos
- ✅ **Performance** - No refetch agresivo
- ✅ **Type-safe** con TypeScript
- ✅ **Persistencia** en localStorage
- ✅ **Múltiples formularios** simultáneos

**Protege contra:**
- ❌ Cierre accidental del navegador
- ❌ Cambio de pestañas sin guardar
- ❌ Navegación sin guardar
- ❌ Refresco de página
- ❌ Refetch que reemplaza formulario
- ❌ Pérdida de datos en objetos anidados

**¡Los usuarios nunca más perderán su trabajo!** 💪
