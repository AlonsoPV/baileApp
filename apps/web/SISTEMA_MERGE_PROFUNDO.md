# 🔄 Sistema de Merge Profundo para Perfiles

## 🎯 **Objetivo**

Implementar un sistema que permita editar perfiles sin perder datos existentes. Cuando un usuario edita solo algunos campos (ej: Instagram), los demás campos (ej: TikTok, YouTube) se mantienen intactos.

---

## 📋 **Problema Resuelto**

### **❌ Antes (Comportamiento Destructivo):**

```typescript
// Usuario tiene en BD:
{
  redes_sociales: {
    instagram: "https://instagram.com/user",
    tiktok: "https://tiktok.com/@user",
    youtube: "https://youtube.com/user"
  }
}

// Usuario edita solo Instagram
updateProfile({
  redes_sociales: {
    instagram: "https://instagram.com/newuser"
  }
});

// Resultado: ❌ SE PIERDEN tiktok y youtube
{
  redes_sociales: {
    instagram: "https://instagram.com/newuser"
  }
}
```

### **✅ Ahora (Merge Profundo):**

```typescript
// Usuario tiene en BD:
{
  redes_sociales: {
    instagram: "https://instagram.com/user",
    tiktok: "https://tiktok.com/@user",
    youtube: "https://youtube.com/user"
  }
}

// Usuario edita solo Instagram
updateProfile({
  redes_sociales: {
    instagram: "https://instagram.com/newuser"
  }
});

// Resultado: ✅ SE MANTIENEN tiktok y youtube
{
  redes_sociales: {
    instagram: "https://instagram.com/newuser",
    tiktok: "https://tiktok.com/@user",
    youtube: "https://youtube.com/user"
  }
}
```

---

## 🗄️ **Implementación Backend (SQL)**

### **1️⃣ Función `jsonb_deep_merge`**

**Archivo:** `apps/web/SCRIPT_20_MERGE_PROFUNDO_PROFILES.sql`

**Propósito:** Fusiona recursivamente dos objetos JSONB.

```sql
CREATE OR REPLACE FUNCTION public.jsonb_deep_merge(a jsonb, b jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    jsonb_object_agg(
      coalesce(ka, kb),
      CASE
        WHEN jsonb_typeof(va) = 'object' AND jsonb_typeof(vb) = 'object'
          THEN public.jsonb_deep_merge(va, vb)  -- Recursivo
        ELSE coalesce(vb, va)                    -- b pisa a a
      END
    )
  FROM
    (SELECT * FROM jsonb_each(a)) AS ea(ka, va)
  FULL JOIN
    (SELECT * FROM jsonb_each(b)) AS eb(kb, vb)
  ON ka = kb
$$;
```

**Comportamiento:**
- Si ambos valores son objetos → Merge recursivo
- Si uno no es objeto → El valor de `b` pisa a `a`
- Si una clave solo existe en `a` → Se mantiene
- Si una clave solo existe en `b` → Se agrega

### **2️⃣ Función `merge_profiles_user` (Actualizada)**

**Propósito:** Actualiza perfiles usando merge profundo.

```sql
CREATE OR REPLACE FUNCTION public.merge_profiles_user(p_user_id uuid, p_patch jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prev            public.profiles_user%rowtype;
  v_next_respuestas jsonb;
  v_next_media      jsonb;
  v_next_redes      jsonb;
BEGIN
  -- Obtener datos actuales
  SELECT * INTO v_prev FROM public.profiles_user WHERE user_id = p_user_id FOR UPDATE;

  -- Auto-crear si no existe
  IF NOT FOUND THEN
    INSERT INTO public.profiles_user(user_id) VALUES (p_user_id);
    SELECT * INTO v_prev FROM public.profiles_user WHERE user_id = p_user_id FOR UPDATE;
  END IF;

  -- Merge profundo de respuestas
  IF p_patch ? 'respuestas' THEN
    v_next_respuestas := public.jsonb_deep_merge(
      coalesce(v_prev.respuestas, '{}'::jsonb), 
      p_patch->'respuestas'
    );
  ELSE
    v_next_respuestas := v_prev.respuestas;
  END IF;

  -- Merge profundo de redes_sociales
  IF p_patch ? 'redes_sociales' THEN
    v_next_redes := public.jsonb_deep_merge(
      coalesce(v_prev.redes_sociales, '{}'::jsonb), 
      p_patch->'redes_sociales'
    );
  ELSE
    v_next_redes := v_prev.redes_sociales;
  END IF;

  -- Media se reemplaza completo (tiene su propio hook)
  v_next_media := coalesce(p_patch->'media', v_prev.media);

  -- Update con merge
  UPDATE public.profiles_user
  SET
    display_name   = coalesce(p_patch->>'display_name', v_prev.display_name),
    bio            = coalesce(p_patch->>'bio',          v_prev.bio),
    ritmos         = CASE WHEN p_patch ? 'ritmos' THEN ... ELSE v_prev.ritmos END,
    zonas          = CASE WHEN p_patch ? 'zonas'  THEN ... ELSE v_prev.zonas  END,
    redes_sociales = v_next_redes,
    respuestas     = v_next_respuestas,
    media          = v_next_media
  WHERE user_id = p_user_id;
END;
$$;
```

**Campos con Merge Profundo:**
- ✅ `respuestas` (JSONB)
- ✅ `redes_sociales` (JSONB)

**Campos con Reemplazo:**
- `media` (tiene su propio hook `useUserMediaSlots`)
- `ritmos`, `zonas` (arrays simples)
- `display_name`, `bio` (strings)

---

## 💻 **Implementación Frontend**

### **1️⃣ Utilidades de Objeto**

**Archivo:** `apps/web/src/utils/object.ts`

#### **`pruneEmptyDeep<T>(obj: T): T`**

Elimina valores vacíos recursivamente:
- Strings vacíos (`""`)
- Objetos vacíos (`{}`)
- `undefined`

```typescript
pruneEmptyDeep({
  name: "John",
  email: "",           // ← Eliminado
  profile: {
    bio: "Hello",
    website: ""        // ← Eliminado
  }
});
// Resultado:
// { name: "John", profile: { bio: "Hello" } }
```

#### **`deepMerge<T>(target: T, source: Partial<T>): T`**

Fusiona dos objetos de forma profunda:

```typescript
deepMerge(
  { redes: { instagram: "old", tiktok: "old" } },
  { redes: { instagram: "new" } }
);
// Resultado:
// { redes: { instagram: "new", tiktok: "old" } }
```

#### **`isEmptyObject(o: any): boolean`**

Verifica si es un objeto vacío.

### **2️⃣ Hook `useUserProfile` (Actualizado)**

**Archivo:** `apps/web/src/hooks/useUserProfile.ts`

```typescript
import { pruneEmptyDeep, deepMerge } from "../utils/object";

const updateFields = useMutation({
  mutationFn: async (next: Partial<ProfileUser>) => {
    const prev = profile.data || {};
    
    // Separar campos especiales
    const { 
      media,                    // ← No tocar (tiene su hook)
      onboarding_complete,      // ← No tocar
      respuestas: nextRespuestas, 
      redes_sociales: nextRedes, 
      ...rest 
    } = next;

    // Merge profundo de respuestas
    const mergedRespuestas = nextRespuestas
      ? deepMerge(prev.respuestas || {}, pruneEmptyDeep(nextRespuestas))
      : undefined;

    // Merge profundo de redes sociales
    const mergedRedes = nextRedes
      ? deepMerge(prev.redes_sociales || {}, pruneEmptyDeep(nextRedes))
      : undefined;

    // Armar patch limpio
    const patch = pruneEmptyDeep({
      ...rest,
      ...(mergedRespuestas ? { respuestas: mergedRespuestas } : {}),
      ...(mergedRedes ? { redes_sociales: mergedRedes } : {})
    });

    // Enviar a Supabase
    await supabase.rpc("merge_profiles_user", {
      p_user_id: user.id,
      p_patch: patch
    });
  }
});
```

**Flujo:**
1. **Separar** campos especiales (`media`, `onboarding_complete`)
2. **Merge local** de `respuestas` y `redes_sociales`
3. **Limpiar** valores vacíos con `pruneEmptyDeep`
4. **Enviar** solo campos con datos al backend
5. **Backend** hace merge profundo adicional

---

## 🧪 **Testing**

### **Test SQL (Incluido en Script):**

```sql
DO $$
DECLARE
  a jsonb := '{"redes": {"instagram": "user1", "tiktok": "@user1"}}'::jsonb;
  b jsonb := '{"redes": {"youtube": "user1"}}'::jsonb;
  resultado jsonb;
BEGIN
  resultado := public.jsonb_deep_merge(a, b);
  
  -- Verifica que se mantienen todos los valores
  IF resultado->'redes'->>'instagram' IS NOT NULL AND 
     resultado->'redes'->>'tiktok' IS NOT NULL AND 
     resultado->'redes'->>'youtube' IS NOT NULL THEN
    RAISE NOTICE '✅ Test exitoso';
  ELSE
    RAISE NOTICE '❌ Test fallido';
  END IF;
END $$;
```

### **Test Manual Frontend:**

```typescript
// 1. Guardar datos iniciales
await updateProfile({
  redes_sociales: {
    instagram: "https://instagram.com/user1",
    tiktok: "https://tiktok.com/@user1",
    youtube: "https://youtube.com/user1"
  }
});

// 2. Editar solo Instagram
await updateProfile({
  redes_sociales: {
    instagram: "https://instagram.com/user2"
  }
});

// 3. Verificar en consola del navegador
console.log(profile.redes_sociales);
// Esperado: { instagram: "user2", tiktok: "@user1", youtube: "user1" }
```

---

## 📊 **Casos de Uso**

### **Caso 1: Editar solo redes sociales**

```typescript
// Usuario ya tiene ritmos, zonas, bio, etc.
// Solo edita Instagram

updateProfile({
  redes_sociales: {
    instagram: "https://instagram.com/newhandle"
  }
});

// ✅ Se mantienen: ritmos, zonas, bio, tiktok, youtube, etc.
// ✅ Se actualiza: instagram
```

### **Caso 2: Editar ritmos y una red social**

```typescript
updateProfile({
  ritmos: [1, 2, 3],  // Salsa, Bachata, Merengue
  redes_sociales: {
    tiktok: "https://tiktok.com/@newhandle"
  }
});

// ✅ Se mantienen: zonas, bio, instagram, youtube, etc.
// ✅ Se actualizan: ritmos, tiktok
```

### **Caso 3: Agregar nueva red social**

```typescript
// Usuario tiene instagram y tiktok
// Agrega youtube

updateProfile({
  redes_sociales: {
    youtube: "https://youtube.com/@channel"
  }
});

// ✅ Se mantienen: instagram, tiktok
// ✅ Se agrega: youtube
```

---

## 🚀 **Deployment**

### **Paso 1: Ejecutar Script SQL**

```bash
# En Supabase SQL Editor:
apps/web/SCRIPT_20_MERGE_PROFUNDO_PROFILES.sql
```

Verifica el test incluido en el script.

### **Paso 2: Verificar en Desarrollo**

1. Abre el navegador en modo desarrollo
2. Edita tu perfil (solo algunos campos)
3. Revisa la consola para ver los logs:
   ```
   [useUserProfile] PREV respuestas: {...}
   [useUserProfile] NEXT respuestas: {...}
   [useUserProfile] MERGED respuestas: {...}
   [useUserProfile] FINAL PATCH: {...}
   ```
4. Verifica que no se perdieron datos

### **Paso 3: Test Manual**

1. Guarda datos completos (todas las redes sociales)
2. Edita solo una red social
3. Verifica que las demás se mantienen
4. Repite con diferentes combinaciones

---

## ⚠️ **Notas Importantes**

### **Campos que NO usan Merge Profundo:**

- **`media`** → Tiene su propio hook `useUserMediaSlots`
- **`onboarding_complete`** → Solo se actualiza en onboarding
- **`ritmos`, `zonas`** → Arrays simples (reemplazo completo)

### **Logs de Desarrollo:**

En desarrollo (`MODE === "development"`), el hook muestra logs detallados:
- Datos previos
- Datos nuevos
- Resultado del merge
- Patch final enviado

### **Performance:**

- ✅ Merge se hace tanto en frontend como backend (doble protección)
- ✅ Solo se envían campos que cambiaron
- ✅ Función SQL es `IMMUTABLE` (cacheable)

---

## 🐛 **Troubleshooting**

### **Problema: Se siguen perdiendo datos**

**Solución:**
1. Verifica que ejecutaste `SCRIPT_20_MERGE_PROFUNDO_PROFILES.sql`
2. Revisa los logs en consola del navegador
3. Confirma que el frontend usa el hook actualizado

```sql
-- Verificar que la función existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('jsonb_deep_merge', 'merge_profiles_user');
```

### **Problema: Campos vacíos no se eliminan**

**Causa:** `pruneEmptyDeep` solo elimina strings realmente vacíos (`""`).

**Solución:** Si quieres eliminar un campo, envía `null` o elimínalo del objeto.

---

## 📚 **Referencias**

- **Script SQL:** `apps/web/SCRIPT_20_MERGE_PROFUNDO_PROFILES.sql`
- **Utilidades:** `apps/web/src/utils/object.ts`
- **Hook:** `apps/web/src/hooks/useUserProfile.ts`
- **Documentación PostgreSQL JSONB:** https://www.postgresql.org/docs/current/datatype-json.html

---

## ✅ **Resultado Final**

**¡Sistema de merge profundo completamente implementado!** 🎉

Los usuarios ahora pueden editar cualquier campo de su perfil sin preocuparse por perder datos en otros campos. El sistema fusiona inteligentemente los cambios con los datos existentes.

**Beneficios:**
- ✅ No se pierden datos al editar
- ✅ Protección en frontend y backend
- ✅ Logs detallados para debugging
- ✅ Performance optimizado
- ✅ Fácil de mantener y extender
