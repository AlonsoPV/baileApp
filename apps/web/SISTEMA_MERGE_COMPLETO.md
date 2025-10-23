# 🔄 Sistema de Merge Completo - Sin Pérdida de Datos

## 🎯 **Objetivo**

Implementar un sistema robusto que **NUNCA** pierda datos al editar cualquier entidad del sistema:
- ✅ Perfiles de usuario
- ✅ Perfiles de organizador
- ✅ Eventos padre
- ✅ Fechas de eventos

---

## 📋 **Problema Solucionado**

### **❌ Antes:**

```typescript
// Usuario tiene:
{
  display_name: "Juan",
  bio: "Bailarín profesional",
  redes_sociales: {
    instagram: "@juan",
    tiktok: "@juan_baila",
    youtube: "juan_channel"
  },
  ritmos: [1, 2, 3],  // Salsa, Bachata, Merengue
  zonas: [10]         // CDMX
}

// Usuario edita solo el nombre:
updateProfile({ display_name: "Juan Pérez" });

// Resultado: ❌ SE PERDIERON bio, redes_sociales, ritmos, zonas
{
  display_name: "Juan Pérez"
}
```

### **✅ Ahora:**

```typescript
// Usuario edita solo el nombre:
updateProfile({ display_name: "Juan Pérez" });

// Resultado: ✅ TODO SE MANTIENE
{
  display_name: "Juan Pérez",          // ← Actualizado
  bio: "Bailarín profesional",         // ← Mantenido
  redes_sociales: {                    // ← Mantenido
    instagram: "@juan",
    tiktok: "@juan_baila",
    youtube: "juan_channel"
  },
  ritmos: [1, 2, 3],                   // ← Mantenido
  zonas: [10]                          // ← Mantenido
}
```

---

## 🗄️ **Backend - Funciones SQL**

### **Archivo:** `SCRIPT_21_MERGE_COMPLETO_TODAS_ENTIDADES.sql`

### **1️⃣ `jsonb_deep_merge(a, b)`**

Fusiona recursivamente dos objetos JSONB:

```sql
SELECT jsonb_deep_merge(
  '{"redes": {"instagram": "old", "tiktok": "old"}}'::jsonb,
  '{"redes": {"instagram": "new"}}'::jsonb
);

-- Resultado:
-- {"redes": {"instagram": "new", "tiktok": "old"}}
```

**Características:**
- ✅ Recursivo para objetos anidados
- ✅ `b` pisa a `a`, pero mantiene claves no presentes en `b`
- ✅ `IMMUTABLE` para caching

### **2️⃣ `merge_profiles_user(user_id, patch)`**

Actualiza perfil de usuario sin perder datos:

```sql
SELECT merge_profiles_user(
  auth.uid(),
  '{"display_name": "Nuevo Nombre"}'::jsonb
);
```

**Campos protegidos:**
- ✅ `redes_sociales` → Merge profundo
- ✅ `respuestas` → Merge profundo
- ✅ `ritmos`, `zonas` → Solo si vienen en patch
- ✅ `media` → Solo si viene en patch
- ✅ Strings (`display_name`, `bio`) → Solo si vienen

### **3️⃣ `merge_profiles_organizer(id, owner, patch)`**

Actualiza perfil de organizador:

```sql
SELECT merge_profiles_organizer(
  123,              -- ID del organizador
  auth.uid(),       -- Dueño
  '{"bio": "Nueva bio"}'::jsonb
);
```

**Protección:**
- ✅ Verifica que el usuario sea dueño
- ✅ Merge profundo de `respuestas`
- ✅ Mantiene `nombre_publico`, `ritmos`, `zonas`, etc.

### **4️⃣ `merge_events_parent(id, owner, patch)`**

Actualiza evento padre sin perder datos.

### **5️⃣ `merge_events_date(id, owner, patch)`**

Actualiza fecha de evento con merge de `cronograma` y `costos`.

---

## 💻 **Frontend - Sistema de Patches Seguros**

### **Archivo:** `src/utils/safePatch.ts`

### **1️⃣ `buildSafePatch(prev, next, opts)`**

Función universal para construir patches seguros:

```typescript
const patch = buildSafePatch(
  prevData,    // Datos actuales
  nextData,    // Datos nuevos del formulario
  { 
    allowEmptyArrays: ["ritmos", "zonas"]  // Permitir vaciar estos arrays
  }
);
```

**Proceso:**
1. **Merge local** de objetos anidados
2. **Limpieza** de valores vacíos (`""`, `{}`, `undefined`)
3. **Diff** - Solo envía lo que cambió
4. **Control de arrays** - No envía `[]` accidentalmente

**Resultado:**
```typescript
// Solo envía lo que realmente cambió
{ display_name: "Juan Pérez" }
// NO envía: bio, redes_sociales, ritmos, zonas
```

### **2️⃣ `pruneEmptyDeep(obj)`**

Elimina valores vacíos recursivamente:

```typescript
pruneEmptyDeep({
  name: "John",
  email: "",           // ← Eliminado
  config: {
    theme: "dark",
    lang: ""           // ← Eliminado
  },
  empty: {}            // ← Eliminado
});
// { name: "John", config: { theme: "dark" } }
```

### **3️⃣ `deepMerge(target, source)`**

Fusiona objetos de forma profunda:

```typescript
deepMerge(
  { config: { theme: "dark", size: "large" } },
  { config: { theme: "light" } }
);
// { config: { theme: "light", size: "large" } }
```

---

## 🔧 **Hooks Actualizados**

### **`useUserProfile` (Actualizado)**

**Antes:**
```typescript
// Reemplazaba todo el objeto
await supabase.from("profiles_user").update(next);
```

**Ahora:**
```typescript
// Merge inteligente
const patch = buildSafePatch(prev, next, { 
  allowEmptyArrays: ["ritmos", "zonas"] 
});

await supabase.rpc("merge_profiles_user", {
  p_user_id: user.id,
  p_patch: patch
});
```

**Resultado:**
- ✅ Solo envía campos que cambiaron
- ✅ Merge profundo de `redes_sociales` y `respuestas`
- ✅ No envía arrays vacíos accidentalmente
- ✅ Logs detallados en desarrollo

### **`useUpsertMyOrganizer` (Actualizado)**

Similar a `useUserProfile`:
```typescript
const patch = buildSafePatch(prev, next, { 
  allowEmptyArrays: ["ritmos", "zonas", "estilos"] 
});

await supabase.rpc("merge_profiles_organizer", {
  p_id: org.id,
  p_owner: user.id,
  p_patch: patch
});
```

---

## 📊 **Casos de Uso Cubiertos**

### **Caso 1: Editar solo nombre**

```typescript
updateProfile({ display_name: "Nuevo Nombre" });
```

**Resultado:**
- ✅ Actualiza: `display_name`
- ✅ Mantiene: bio, redes_sociales, ritmos, zonas, respuestas

### **Caso 2: Agregar solo TikTok**

```typescript
updateProfile({ 
  redes_sociales: { 
    tiktok: "@nuevo_handle" 
  } 
});
```

**Resultado:**
- ✅ Actualiza: `redes_sociales.tiktok`
- ✅ Mantiene: `redes_sociales.instagram`, `youtube`, `facebook`

### **Caso 3: Cambiar solo ritmos**

```typescript
updateProfile({ ritmos: [1, 5] });  // Salsa, Bachata
```

**Resultado:**
- ✅ Actualiza: `ritmos`
- ✅ Mantiene: zonas, bio, redes_sociales, etc.

### **Caso 4: Vaciar ritmos intencionalmente**

```typescript
updateProfile({ ritmos: [] });
```

**Resultado:**
- ✅ Actualiza: `ritmos` a array vacío (porque está en `allowEmptyArrays`)
- ✅ Mantiene: todo lo demás

---

## 🧪 **Testing**

### **Test SQL (Incluido en Script):**

```sql
DO $$
DECLARE
  a jsonb := '{"config": {"theme": "dark", "lang": "es"}}'::jsonb;
  b jsonb := '{"config": {"lang": "en"}}'::jsonb;
  resultado jsonb;
BEGIN
  resultado := public.jsonb_deep_merge(a, b);
  
  -- Verifica que theme se mantiene y lang se actualiza
  IF resultado->'config'->>'theme' = 'dark' AND 
     resultado->'config'->>'lang' = 'en' THEN
    RAISE NOTICE '✅ Test exitoso';
  END IF;
END $$;
```

### **Test Frontend:**

1. **Llenar datos completos:**
```typescript
await updateProfile({
  display_name: "Juan",
  bio: "Bailarín",
  ritmos: [1, 2, 3],
  redes_sociales: {
    instagram: "@juan",
    tiktok: "@juan_baila"
  }
});
```

2. **Editar solo bio:**
```typescript
await updateProfile({ bio: "Bailarín profesional" });
```

3. **Verificar en consola:**
```javascript
console.log(profile);
// Debe tener: display_name, bio actualizado, ritmos, redes_sociales intactos
```

---

## 🚀 **Implementación**

### **Paso 1: Ejecutar Script SQL**

```sql
-- En Supabase SQL Editor:
apps/web/SCRIPT_21_MERGE_COMPLETO_TODAS_ENTIDADES.sql
```

Verifica el test incluido al final.

### **Paso 2: Verificar Hooks**

Los siguientes hooks ya están actualizados:
- ✅ `useUserProfile` → Usa `buildSafePatch`
- ✅ `useUpsertMyOrganizer` → Usa `buildSafePatch`

### **Paso 3: Probar en Desarrollo**

1. Edita tu perfil (usuario u organizador)
2. Llena todos los campos
3. Guarda
4. Edita **solo un campo**
5. Abre la consola del navegador:
   ```
   [useUserProfile] PREV: {...}
   [useUserProfile] NEXT: {...}
   [useUserProfile] PATCH: {...}  ← Solo el campo editado
   ```
6. Recarga y verifica que todo se mantuvo ✅

---

## ⚙️ **Configuración por Entidad**

### **Usuario:**
```typescript
allowEmptyArrays: ["ritmos", "zonas"]
```

### **Organizador:**
```typescript
allowEmptyArrays: ["ritmos", "zonas", "estilos"]
```

### **Eventos:**
```typescript
allowEmptyArrays: ["estilos", "zonas"]
```

---

## 📝 **Logs de Desarrollo**

En modo desarrollo (`MODE === "development"`), cada actualización muestra:

```
[useUserProfile] PREV: { display_name: "Juan", bio: "...", ... }
[useUserProfile] NEXT: { display_name: "Juan Pérez" }
[useUserProfile] PATCH: { display_name: "Juan Pérez" }
[useUserProfile] Profile updated successfully
```

**Información útil:**
- **PREV** - Datos antes del cambio
- **NEXT** - Datos enviados desde el formulario
- **PATCH** - Solo lo que cambió (lo que se envía a Supabase)

---

## 🐛 **Troubleshooting**

### **Problema: Se siguen perdiendo datos**

**Solución:**
1. Verifica que ejecutaste `SCRIPT_21_MERGE_COMPLETO_TODAS_ENTIDADES.sql`
2. Confirma que el hook usa `buildSafePatch`:
   ```typescript
   const patch = buildSafePatch(prev, next, { ... });
   ```
3. Revisa los logs en consola

### **Problema: Arrays se vacían sin querer**

**Causa:** El array no está en `allowEmptyArrays`.

**Solución:**
```typescript
buildSafePatch(prev, next, { 
  allowEmptyArrays: ["ritmos", "zonas", "tu_array"]
});
```

### **Problema: Campo JSONB no se fusiona**

**Causa:** El backend no usa `jsonb_deep_merge` para ese campo.

**Solución:** Actualiza la función SQL:
```sql
campo_jsonb = CASE WHEN v_patch ? 'campo_jsonb'
              THEN public.jsonb_deep_merge(
                coalesce(v_prev.campo_jsonb,'{}'::jsonb), 
                v_patch->'campo_jsonb'
              )
              ELSE v_prev.campo_jsonb END
```

---

## 📚 **Archivos del Sistema**

### **Backend (SQL):**
- `SCRIPT_21_MERGE_COMPLETO_TODAS_ENTIDADES.sql` - Funciones de merge
- `SCRIPT_20_MERGE_PROFUNDO_PROFILES.sql` - Versión anterior (obsoleta)

### **Frontend (TypeScript):**
- `src/utils/safePatch.ts` - Utilidades de patch seguro
- `src/utils/object.ts` - Utilidades de objeto (obsoleto, usar safePatch)
- `src/hooks/useUserProfile.ts` - Hook actualizado
- `src/hooks/useOrganizer.ts` - Hook actualizado

---

## ✅ **Funciones SQL Creadas**

| Función | Propósito | Parámetros |
|---------|-----------|------------|
| `jsonb_deep_merge(a, b)` | Merge recursivo de JSONB | 2 JSONB objects |
| `merge_profiles_user(id, patch)` | Update usuario | UUID, JSONB |
| `merge_profiles_organizer(id, owner, patch)` | Update organizador | BIGINT, UUID, JSONB |
| `merge_events_parent(id, owner, patch)` | Update evento padre | BIGINT, UUID, JSONB |
| `merge_events_date(id, owner, patch)` | Update fecha evento | BIGINT, UUID, JSONB |

---

## 🎯 **Campos con Merge Profundo**

### **Perfiles de Usuario:**
- ✅ `redes_sociales` (JSONB)
- ✅ `respuestas` (JSONB)

### **Perfiles de Organizador:**
- ✅ `respuestas` (JSONB)

### **Fechas de Eventos:**
- ✅ `cronograma` (JSONB)
- ✅ `costos` (JSONB)

---

## 🔒 **Seguridad**

Todas las funciones de merge incluyen:

1. **Verificación de dueño:**
```sql
IF v_prev.user_id <> p_owner THEN
  RAISE EXCEPTION 'Forbidden' USING errcode='42501';
END IF;
```

2. **SELECT FOR UPDATE:**
```sql
SELECT * INTO v_prev FROM table WHERE id = p_id FOR UPDATE;
```

3. **Security Definer:**
```sql
SECURITY DEFINER  -- Ejecuta con permisos del creador
```

4. **GRANT limitado:**
```sql
GRANT EXECUTE ON FUNCTION ... TO authenticated;  -- Solo usuarios autenticados
```

---

## 📈 **Performance**

### **Optimizaciones:**

1. **Solo envía lo que cambió:**
   - Diff calculado en frontend
   - Reduce payload de red

2. **Merge en backend:**
   - Doble protección (frontend + backend)
   - Backend es la fuente de verdad

3. **Función IMMUTABLE:**
   - `jsonb_deep_merge` es cacheable
   - PostgreSQL puede optimizar

4. **Índices GIN:**
   - Búsquedas rápidas en JSONB
   - Ya existen en columnas `respuestas`, `redes_sociales`

---

## 📖 **Guía de Uso**

### **Para Agregar Nuevo Campo:**

#### **1. Si es campo simple (string, integer):**

```sql
-- En la función de merge
nuevo_campo = coalesce(v_patch->>'nuevo_campo', v_prev.nuevo_campo)
```

#### **2. Si es array:**

```sql
-- En la función de merge
nuevo_array = CASE WHEN v_patch ? 'nuevo_array'
              THEN (SELECT coalesce(array_agg((x)::integer), '{}')
                    FROM jsonb_array_elements_text(v_patch->'nuevo_array') x)
              ELSE v_prev.nuevo_array END
```

```typescript
// En el frontend
buildSafePatch(prev, next, { 
  allowEmptyArrays: ["ritmos", "zonas", "nuevo_array"]
});
```

#### **3. Si es JSONB (objeto):**

```sql
-- En la función de merge
nuevo_objeto = CASE WHEN v_patch ? 'nuevo_objeto'
               THEN public.jsonb_deep_merge(
                 coalesce(v_prev.nuevo_objeto,'{}'::jsonb), 
                 v_patch->'nuevo_objeto'
               )
               ELSE v_prev.nuevo_objeto END
```

---

## ✅ **Resultado Final**

**¡Sistema de merge completo para todas las entidades!** 🎉

**Beneficios:**
- ✅ **Cero pérdida de datos** al editar
- ✅ **Protección doble** (frontend + backend)
- ✅ **Type-safe** con TypeScript
- ✅ **Logs detallados** para debugging
- ✅ **Reutilizable** para cualquier entidad
- ✅ **Performance optimizado**
- ✅ **Seguro** con verificación de dueño

**Funciona para:**
- ✅ Perfiles de usuario
- ✅ Perfiles de organizador  
- ✅ Eventos padre
- ✅ Fechas de eventos
- ✅ Cualquier entidad futura (solo agregar función SQL)
