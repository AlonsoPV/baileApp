# 🚨 FIX: Error PGRST202 - merge_profiles_user

## ❌ **Error que estás viendo:**

```
[useUserProfile] Error updating profile: 
code: "PGRST202"
message: "Could not find the function public.merge_profiles_user(p_patch, p_user_id) in the schema cache"
```

---

## ✅ **SOLUCIÓN RÁPIDA (3 pasos):**

### **PASO 1: Abrir Supabase SQL Editor**
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto "BaileApp"
3. Click en **"SQL Editor"** en el menú lateral
4. Click en **"+ New query"**

---

### **PASO 2: Ejecutar Script**
1. Abre el archivo **`SCRIPT_15_MERGE_PROFILES_USER_RPC.sql`**
2. Copia **TODO** el contenido
3. Pégalo en el SQL Editor
4. Click en **"Run"** o presiona `Ctrl + Enter`
5. Espera el mensaje de éxito ✅

---

### **PASO 3: Refrescar la App**
1. Cierra la app (Ctrl + F5 en el navegador)
2. Vuelve a abrirla
3. Prueba editar tu perfil
4. ✅ Debería funcionar ahora

---

## 🔍 **Verificar que funcionó:**

Después de ejecutar el script, verifica con este query:

```sql
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'merge_profiles_user';
```

**Resultado esperado:**
```
routine_name: merge_profiles_user
routine_type: FUNCTION
security_type: DEFINER
```

Si ves esto ✅ **¡Está arreglado!**

---

## 🤔 **¿Por qué pasó esto?**

La app necesita una función especial en Supabase llamada `merge_profiles_user` para actualizar perfiles de forma segura. Esta función:

- ✅ Solo actualiza los campos que cambias
- ✅ NO sobrescribe campos que no tocas
- ✅ Previene pérdida de datos accidental
- ✅ Maneja correctamente arrays y objetos JSON

Sin esta función, la app no puede guardar cambios en los perfiles.

---

## 📋 **¿Qué hace la función?**

```typescript
// Cuando editas tu perfil:
await supabase.rpc('merge_profiles_user', {
  p_user_id: 'tu-uuid',
  p_patch: { 
    display_name: "Nuevo nombre",
    bio: "Nueva bio"
  }
});

// Solo actualiza display_name y bio
// Todo lo demás (ritmos, zonas, media) permanece igual ✅
```

---

## 🆘 **Si todavía tienes problemas:**

### **Diagnóstico adicional:**

1. Ejecuta el archivo **`DIAGNOSTICO_RPC_MERGE.sql`** en Supabase SQL Editor
2. Revisa los resultados
3. Compártelos para obtener ayuda específica

### **Errores comunes:**

| Error | Solución |
|-------|----------|
| "Function not found" | Ejecutar SCRIPT_15 |
| "Permission denied" | Verificar que `authenticated` tiene `EXECUTE` |
| "Profile not found" | Verificar que tu perfil existe en `profiles_user` |

---

## ✅ **Resumen:**

1. 🔴 **Error:** `PGRST202` - Función no encontrada
2. 📝 **Causa:** Falta crear la función RPC en Supabase
3. 🔧 **Fix:** Ejecutar `SCRIPT_15_MERGE_PROFILES_USER_RPC.sql`
4. ✅ **Resultado:** Perfiles se pueden editar correctamente

**¡Listo!** 🎉

