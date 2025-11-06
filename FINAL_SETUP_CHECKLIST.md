# ✅ Checklist Final de Setup - Ejecutar Ahora

Esta es la lista final de scripts SQL que necesitas ejecutar en Supabase para que todo funcione correctamente.

---

## 🚀 **EJECUTAR EN ORDEN:**

### **1. Insertar Tags (Ritmos y Zonas)**
```bash
📁 Archivo: supabase/insert_tags.sql
⏱️ Tiempo: 30 segundos
✅ Resultado esperado: 26 tags (21 ritmos + 5 zonas)
```

**Qué hace:**
- Crea tabla `tags` si no existe
- Inserta todos los ritmos con slugs (Salsa On1, Bachata, etc.)
- Inserta todas las zonas (CDMX Norte/Sur/Centro, Guadalajara, Monterrey)

---

### **2. Fix RLS y Función Merge de Usuarios**
```bash
📁 Archivo: supabase/fix_profiles_user_rls.sql
⏱️ Tiempo: 20 segundos
✅ Resultado esperado: 3 políticas RLS + función merge_profiles_user
```

**Qué hace:**
- Crea políticas para ver/crear/actualizar perfil propio
- Crea función `merge_profiles_user` para upserts seguros
- Permite que el onboarding funcione sin errores 403

---

### **3. Crear Vista Pública de Usuarios**
```bash
📁 Archivo: supabase/create_user_public_view.sql
⏱️ Tiempo: 15 segundos
✅ Resultado esperado: Vista v_user_public + política SELECT pública
```

**Qué hace:**
- Crea vista `v_user_public` (sin datos sensibles como email, PIN)
- Permite que cualquiera vea perfiles completos
- Filtra automáticamente por `onboarding_complete = true`

---

### **4. Asignar Rol Usuario (Si aún no lo hiciste)**
```bash
📁 Archivo: supabase/fix_usuario_role.sql
⏱️ Tiempo: 5 segundos
✅ Resultado esperado: Usuario Regular tiene rol 'usuario'
```

**Qué hace:**
- Asegura que el rol 'usuario' existe en tabla `roles`
- Asigna rol al usuario de prueba

---

## 📊 **Verificación Después de Ejecutar:**

Ejecuta esto en SQL Editor para confirmar que todo está bien:

```sql
-- Verificar tags
SELECT 'Tags' as item, COUNT(*) as total FROM public.tags;

-- Verificar función merge
SELECT 'Función merge_profiles_user' as item, 
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_proc WHERE proname = 'merge_profiles_user'
       ) THEN 'Existe ✅' ELSE 'Falta ❌' END as status;

-- Verificar vista pública
SELECT 'Vista v_user_public' as item,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.views 
         WHERE table_name = 'v_user_public'
       ) THEN 'Existe ✅' ELSE 'Falta ❌' END as status;

-- Verificar políticas RLS
SELECT 'Políticas profiles_user' as item, COUNT(*) as total
FROM pg_policies WHERE tablename = 'profiles_user';

-- Ver usuarios públicos
SELECT 'Usuarios públicos' as item, COUNT(*) as total
FROM public.v_user_public;
```

**Deberías ver:**
```
Tags: 26
Función merge_profiles_user: Existe ✅
Vista v_user_public: Existe ✅
Políticas profiles_user: 3
Usuarios públicos: 5 (o más)
```

---

## 🎯 **Después de Ejecutar los 4 Scripts:**

### **En la App (http://localhost:5173):**

1. **Onboarding completo:**
   - ✅ Paso 1: Nombre, bio, avatar
   - ✅ Paso 2: Ritmos (con categorías: Latinos, Afro-latinos, etc.)
   - ✅ Paso 3: Zonas
   - ✅ **Paso 4: PIN** (nuevo - con diseño mejorado)
   - ✅ Verificar PIN
   - ✅ Redirigir a `/app/explore`

2. **Funcionalidades:**
   - ✅ Ver eventos, clases, perfiles
   - ✅ Subir avatar (bucket `media`)
   - ✅ Perfiles públicos visibles
   - ✅ Filtros funcionan
   - ✅ No hay errores 400/403

---

## 🐛 **Si Hay Errores:**

### **Error: "view v_user_public does not exist"**
→ Ejecuta `create_user_public_view.sql`

### **Error: "function merge_profiles_user does not exist"**
→ Ejecuta `fix_profiles_user_rls.sql`

### **Error: "Bucket not found"**
→ Ya corregido en código (usa bucket `media`)

### **Error: "No rows in tags"**
→ Ejecuta `insert_tags.sql`

---

## 📋 **Orden de Ejecución Resumido:**

```
1. ✅ insert_tags.sql                    (tags vacíos)
2. ✅ fix_profiles_user_rls.sql          (RLS + merge function)
3. ✅ create_user_public_view.sql        (vista pública)
4. ✅ fix_usuario_role.sql               (opcional - solo para usuario de prueba)
```

---

**Total:** 4 scripts, ~70 segundos  
**Estado después:** ✅ App 100% funcional

---

¿Ejecutaste los 4 scripts? Dime cuál es el resultado de la verificación! 🔍

