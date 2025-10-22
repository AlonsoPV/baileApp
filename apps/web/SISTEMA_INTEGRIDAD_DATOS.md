# 🛡️ Sistema de Integridad de Datos - BaileApp

## 📋 Resumen

Sistema completo de protección contra pérdida de datos accidental, con guardias automáticas, diagnóstico de entorno y herramientas de debugging.

---

## 🎯 Objetivos

1. ✅ **Evitar pérdida de datos:** No enviar null o [] por accidente
2. ✅ **Detectar entorno:** Saber si apuntas al Supabase correcto
3. ✅ **Diagnóstico:** Ver el patch real antes de guardar
4. ✅ **Trazabilidad:** Logs detallados en desarrollo

---

## 🏗️ Arquitectura

### **1. ENV Utilities** (`lib/env.ts`)

```typescript
import { ENV } from "../lib/env";

ENV.MODE              // "development" | "production"
ENV.SUPABASE_URL      // https://xxxxxx.supabase.co
ENV.SUPABASE_ANON_KEY // anon key (no logueada)
ENV.SUPABASE_REF      // xxxxxx (extracted from URL)
```

**Características:**
- ✅ Extrae automáticamente el project ref de la URL
- ✅ Logging seguro en desarrollo (sin keys completas)
- ✅ Detección automática de entorno

**Logging automático en dev:**
```
[ENV] MODE: development
[ENV] REF: abcdefgh
[ENV] URL: https://abcdefgh.supabase.co…
```

---

### **2. Patch Utilities** (`utils/patch.ts`)

#### **diffPatch<T>(prev, next)**
Calcula solo los campos que cambiaron:

```typescript
const prev = { name: "Juan", age: 25, hobbies: ["salsa"] };
const next = { name: "Juan", age: 26, hobbies: ["salsa"] };

const patch = diffPatch(prev, next);
// Resultado: { age: 26 }
// Solo envía lo que cambió
```

**Características:**
- ✅ Comparación profunda de arrays
- ✅ Comparación profunda de objetos
- ✅ Solo incluye campos diferentes

---

#### **cleanUndefined<T>(obj)**
Elimina valores undefined:

```typescript
const obj = { name: "Juan", age: undefined, bio: null };
const clean = cleanUndefined(obj);
// Resultado: { name: "Juan", bio: null }
// undefined removido, null preservado
```

---

### **3. Safe Update Guards** (`utils/safeUpdate.ts`)

#### **guardedPatch<T>(prev, next, opts)**

La función principal de protección:

```typescript
const patch = guardedPatch(prev, next, {
  allowEmptyArrays: ["ritmos", "zonas"],
  blockEmptyStrings: ["display_name"]
});
```

**Protecciones automáticas:**

1. **Undefined → Eliminado** ❌
   ```typescript
   next = { name: undefined }
   // Patch: {} (undefined removido)
   ```

2. **Arrays vacíos → Bloqueados (a menos que permitidos)** ⚠️
   ```typescript
   // Sin allowEmptyArrays:
   next = { hobbies: [] }
   // Patch: {} (bloqueado)
   // Log: [guardedPatch] Prevented empty array for key: hobbies

   // Con allowEmptyArrays: ["ritmos"]
   next = { ritmos: [] }
   // Patch: { ritmos: [] } (permitido)
   ```

3. **Strings vacíos → Bloqueados (si especificado)** ⚠️
   ```typescript
   // Con blockEmptyStrings: ["display_name"]
   next = { display_name: "" }
   // Patch: {} (bloqueado)
   // Log: [guardedPatch] Prevented empty string for key: display_name
   ```

4. **Solo cambios reales** ✅
   ```typescript
   prev = { name: "Juan", age: 25 }
   next = { name: "Juan", age: 25 }
   // Patch: {} (sin cambios)
   ```

---

### **4. useUserProfile con Guardias** (`hooks/useUserProfile.ts`)

```typescript
const { profile, updateProfileFields } = useUserProfile();

await updateProfileFields({
  display_name: "Nuevo nombre",
  bio: "Nueva bio",
  ritmos: [1, 2, 3],
  media: [...] // ❌ Bloqueado, nunca se envía
});
```

**Guardias configuradas:**
- ✅ `allowEmptyArrays: ["ritmos", "zonas"]` - Puede vaciar intencionalmente
- ✅ `blockEmptyStrings: ["display_name"]` - No permite nombre vacío
- ✅ `media` siempre bloqueado - Use `useUserMedia` separado
- ✅ `onboarding_complete` siempre bloqueado - Manejo interno

**Logging en desarrollo:**
```
[useUserProfile] PATCH: { display_name: "Nuevo nombre" }
```

---

### **5. DevEnvBanner** (`components/DevEnvBanner.tsx`)

Banner visible solo en desarrollo:

```tsx
import DevEnvBanner from "./components/DevEnvBanner";

<DevEnvBanner />
```

**Muestra:**
- 🟡 Banner amarillo en la parte superior
- 📊 REF del proyecto Supabase
- 🔗 URL (primeros 30 caracteres)
- ⚙️ Modo (development/production)

**Solo visible en:**
- `import.meta.env.MODE === "development"`
- Localhost, dev builds
- NO visible en producción (Vercel)

---

### **6. IntegrityDebugScreen** (`screens/debug/IntegrityDebugScreen.tsx`)

Pantalla de diagnóstico completa:

**Acceso:** `/debug/integrity`

**Funcionalidades:**
1. **Perfil actual:** Datos en la base de datos
2. **Draft simulator:** Textarea JSON para simular cambios
3. **Patch calculado:** Preview de lo que se enviaría
4. **Indicadores:**
   - ℹ️ Si no hay cambios
   - ✅ Campos que pasaron guardias
   - 🔍 Visual diff en tiempo real

---

## 🔧 Cómo Funciona

### **Flujo de Actualización Protegida:**

```
Usuario edita formulario
       ↓
onChange actualiza estado local
       ↓
Usuario hace click en "Guardar"
       ↓
updateProfileFields({ ...formData })
       ↓
guardedPatch(prevProfile, formData, opts)
       ↓
┌─────────────────────────────────────┐
│ GUARDIAS:                          │
│ 1. Calcula diff (solo cambios)    │
│ 2. Limpia undefined                │
│ 3. Bloquea arrays vacíos no permitidos │
│ 4. Bloquea strings vacíos bloqueados │
│ 5. Bloquea media/onboarding_complete │
└─────────────────────────────────────┘
       ↓
Patch final (solo cambios seguros)
       ↓
UPDATE profiles_user SET ...
       ↓
✅ Datos guardados sin pérdida
```

---

## 🎯 Casos de Uso

### **Caso 1: Usuario Borra Nombre Accidentalmente**

```typescript
// Estado anterior:
profile = { display_name: "Juan", bio: "Bailarín" }

// Usuario borra display_name por error:
formData = { display_name: "", bio: "Bailarín" }

// Al guardar:
const patch = guardedPatch(profile, formData, {
  blockEmptyStrings: ["display_name"]
});

// Resultado:
patch = {} // ¡Nada se envía!
// Log: [guardedPatch] Prevented empty string for key: display_name

// Base de datos:
// display_name sigue siendo "Juan" ✅
```

---

### **Caso 2: Usuario Quiere Quitar Todos los Ritmos**

```typescript
// Estado anterior:
profile = { ritmos: [1, 2, 3] }

// Usuario desmarca todos los ritmos:
formData = { ritmos: [] }

// Al guardar:
const patch = guardedPatch(profile, formData, {
  allowEmptyArrays: ["ritmos"]
});

// Resultado:
patch = { ritmos: [] } // ✅ Permitido explícitamente

// Base de datos:
// ritmos = [] ✅ (actualizado intencionalmente)
```

---

### **Caso 3: Deploy Accidental con Env Equivocado**

**Problema:**
Deploy de Vercel apunta al Supabase de desarrollo en lugar de producción.

**Detección:**
1. Ve a `/debug/integrity`
2. Verifica `REF: xxxxxx`
3. Compara con tu proyecto esperado

**Si es incorrecto:**
- Verifica variables de entorno en Vercel
- Compara `VITE_SUPABASE_URL` con el esperado
- Redeploy con env vars correctas

---

### **Caso 4: Formulario Envía `media: null`**

```typescript
// Código problemático:
const formData = {
  display_name: "Juan",
  media: null  // ❌ Podría borrar todas las fotos
};

// Protección en useUserProfile:
const { media, onboarding_complete, ...candidate } = formData;
// media es removido antes de guardedPatch

// Resultado:
// media NUNCA se envía desde useUserProfile
// Use useUserMedia para gestionar media
```

---

## 🐛 Debugging

### **Ver Patch en Consola (Desarrollo):**

```javascript
// Abre consola del navegador (F12)
// Edita tu perfil y guarda

// Verás:
[useUserProfile] PATCH: { display_name: "Nuevo nombre" }
```

### **Simular Cambios en /debug/integrity:**

```json
// Draft textarea - Ejemplo 1: Cambio válido
{
  "display_name": "Nuevo Nombre",
  "bio": "Nueva bio"
}

// Patch calculado:
{
  "display_name": "Nuevo Nombre",
  "bio": "Nueva bio"
}
```

```json
// Draft textarea - Ejemplo 2: Intento de vaciar nombre
{
  "display_name": "",
  "bio": "Nueva bio"
}

// Patch calculado:
{
  "bio": "Nueva bio"
}
// display_name bloqueado (no aparece)
```

---

## 📊 Configuración de Guardias

### **Por Hook:**

#### **useUserProfile:**
```typescript
{
  allowEmptyArrays: ["ritmos", "zonas"],
  blockEmptyStrings: ["display_name"]
}

// Además:
// - media: siempre bloqueado
// - onboarding_complete: siempre bloqueado
```

#### **useUserMedia** (futuro):
```typescript
// Solo maneja media, nada más
// Llama RPC separado o UPDATE directo
```

---

## 🔒 Tabla de Protecciones

| Campo | Update Permitido | Vacío Permitido | Hook |
|-------|-----------------|-----------------|------|
| **display_name** | ✅ | ❌ (bloqueado) | useUserProfile |
| **bio** | ✅ | ✅ | useUserProfile |
| **avatar_url** | ✅ | ✅ | useUserProfile |
| **ritmos** | ✅ | ✅ (explícito) | useUserProfile |
| **zonas** | ✅ | ✅ (explícito) | useUserProfile |
| **redes_sociales** | ✅ | ✅ | useUserProfile |
| **media** | ❌ | ❌ | useUserMedia |
| **onboarding_complete** | ❌ | ❌ | Internal |

---

## 🚀 Mejores Prácticas

### **1. Hidratación Única del Formulario:**

```typescript
const { profile } = useUserProfile();
const [form, setForm] = useState({ display_name: "", bio: "" });

// ✅ Hidratar solo cuando llega el perfil
useEffect(() => {
  if (profile) {
    setForm({
      display_name: profile.display_name || "",
      bio: profile.bio || "",
      ritmos: profile.ritmos || [],
      zonas: profile.zonas || [],
    });
  }
}, [!!profile]); // Dependencia: solo cuando profile existe
```

### **2. Guardado Secuencial (No Paralelo):**

```typescript
// ✅ CORRECTO: Secuencial
async function onSave() {
  await updateProfileFields(formData);  // Primero campos básicos
  await setMedia(mediaList);             // Luego media
  showToast("Guardado ✅");
}

// ❌ INCORRECTO: Paralelo
async function onSave() {
  await Promise.all([
    updateProfileFields(formData),
    setMedia(mediaList)
  ]); // Puede causar race conditions
}
```

### **3. Validación Antes de Guardar:**

```typescript
async function onSave() {
  // Validar antes de enviar
  if (!formData.display_name?.trim()) {
    showToast("El nombre es requerido", "error");
    return;
  }

  // Guardar con protección
  await updateProfileFields(formData);
}
```

---

## 🔍 Herramientas de Diagnóstico

### **1. Pantalla /debug/integrity**

**Cuándo usar:**
- Debugear problemas de guardado
- Verificar configuración de Supabase
- Entender qué se envía en cada update
- Testing de guardias

**Cómo usar:**
1. Ve a `/debug/integrity`
2. Ve tu perfil actual en el panel izquierdo
3. Escribe JSON en "Draft" para simular cambios
4. Ve el patch calculado en tiempo real
5. Verifica que las guardias funcionen

**Ejemplo de prueba:**
```json
// Escribe en Draft:
{
  "display_name": "",
  "ritmos": [],
  "bio": "Nueva bio"
}

// Verás en Patch calculado:
{
  "ritmos": [],
  "bio": "Nueva bio"
}

// display_name bloqueado (no aparece)
```

---

### **2. DevEnvBanner (Solo Desarrollo)**

Banner amarillo en la parte superior que muestra:
```
DEV • Supabase REF: abcdefgh • URL: https://abcdefgh.supabase.co…
```

**Uso:**
```tsx
// En App.tsx o layout principal
import DevEnvBanner from "./components/DevEnvBanner";

<DevEnvBanner />
```

**Ventajas:**
- ✅ Siempre visible en dev
- ✅ Confirma que estás en el Supabase correcto
- ✅ No aparece en producción

---

### **3. Console Logs (Desarrollo)**

En modo desarrollo, verás logs automáticos:

```
[ENV] MODE: development
[ENV] REF: abcdefgh
[ENV] URL: https://abcdefgh.supabase.co…

[useUserProfile] PATCH: { display_name: "Nuevo nombre" }

[guardedPatch] Prevented empty string for key: display_name
[guardedPatch] Prevented empty array for key: media
```

---

## 📊 Ejemplos de Guardias

### **Ejemplo 1: Proteger Display Name**

```typescript
// Configuración:
blockEmptyStrings: ["display_name"]

// Intento de vaciar:
updateProfileFields({ display_name: "" })

// Resultado:
// Patch: {} (bloqueado)
// DB: display_name NO cambia ✅
```

---

### **Ejemplo 2: Permitir Vaciar Ritmos**

```typescript
// Configuración:
allowEmptyArrays: ["ritmos"]

// Vaciar intencionalmente:
updateProfileFields({ ritmos: [] })

// Resultado:
// Patch: { ritmos: [] } (permitido)
// DB: ritmos = [] ✅
```

---

### **Ejemplo 3: Bloquear Media**

```typescript
// En useUserProfile:
const { media, onboarding_complete, ...candidate } = next;

// Intento:
updateProfileFields({ 
  display_name: "Juan",
  media: [] // ❌ Siempre bloqueado
})

// Resultado:
// Patch: { display_name: "Juan" }
// media removido antes de guardedPatch
// DB: media NO cambia ✅
```

---

## 🎯 Verificación de Entorno

### **En Desarrollo:**

```bash
# Consola del navegador
[ENV] MODE: development
[ENV] REF: tuproyectolocal
```

### **En Vercel (Producción):**

1. Ve a `/debug/integrity`
2. Verifica:
   ```
   REF: tuproyectoproduccion
   URL: https://tuproyectoproduccion.supabase.co
   ```
3. Compara con lo esperado

### **Si el REF es incorrecto:**

**Problema:** Apuntando al Supabase equivocado

**Solución:**
1. Ir a Vercel Dashboard
2. Settings → Environment Variables
3. Verificar:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Corregir si es necesario
5. Redeploy

---

## 🧪 Testing

### **Test 1: Vaciar Nombre (Debería Bloquearse)**

```
1. Ve a /debug/integrity
2. Escribe en Draft: {"display_name": ""}
3. Verifica Patch: {} (vacío)
4. ✅ Bloqueado correctamente
```

### **Test 2: Vaciar Ritmos (Debería Permitirse)**

```
1. Ve a /debug/integrity
2. Escribe en Draft: {"ritmos": []}
3. Verifica Patch: {"ritmos": []}
4. ✅ Permitido explícitamente
```

### **Test 3: Cambio Real (Debería Enviarse)**

```
1. Ve a /debug/integrity
2. Escribe en Draft: {"display_name": "Nuevo", "bio": "Bio nueva"}
3. Verifica Patch: {"display_name": "Nuevo", "bio": "Bio nueva"}
4. ✅ Solo cambios reales
```

---

## 📝 Configuración Recomendada por Entidad

### **profiles_user:**
```typescript
guardedPatch(prev, next, {
  allowEmptyArrays: ["ritmos", "zonas"],
  blockEmptyStrings: ["display_name"]
})
```

### **profiles_organizer:**
```typescript
guardedPatch(prev, next, {
  allowEmptyArrays: ["estilos"], // puede no tener estilos
  blockEmptyStrings: ["nombre_publico"]
})
```

### **events_parent:**
```typescript
guardedPatch(prev, next, {
  allowEmptyArrays: ["estilos"], // evento sin estilos
  blockEmptyStrings: ["nombre"]
})
```

---

## ✅ Checklist de Implementación

- [x] lib/env.ts con ENV utilities
- [x] utils/patch.ts con diffPatch y cleanUndefined
- [x] utils/safeUpdate.ts con guardedPatch
- [x] useUserProfile actualizado con guardias
- [x] DevEnvBanner component
- [x] IntegrityDebugScreen
- [x] Ruta /debug/integrity
- [x] Logging en desarrollo
- [ ] Añadir DevEnvBanner a App.tsx
- [ ] Extender guardias a otros hooks (useOrganizer, etc)
- [ ] Crear useUserMedia separado con RPC

---

## 🔮 Próximas Mejoras

- [ ] Extender guardias a todos los hooks de perfil
- [ ] Sistema de versionado de datos
- [ ] Historial de cambios (audit log)
- [ ] Rollback de cambios
- [ ] Confirmación antes de borrar arrays
- [ ] UI visual para ver diff antes de guardar
- [ ] Exportar/importar perfil completo

---

## 🎉 Resultado Final

✅ **Sistema completo de integridad de datos**  
✅ **Prevención de pérdida accidental**  
✅ **Diagnóstico de entorno integrado**  
✅ **Herramientas de debugging robustas**  
✅ **Guardias configurables por campo**  
✅ **Logging detallado en desarrollo**  
✅ **Pantalla de diagnóstico visual**  

**¡Tus datos están protegidos contra actualizaciones accidentales!** 🛡️✨

