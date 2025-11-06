# 🚨 INSTRUCCIONES URGENTES - Arreglo de user_roles

## ❌ Problema Actual

El error `400 (Bad Request)` en la consulta de `user_roles` está bloqueando todo el sistema. El badge se ve como "pendiente" porque la tabla `user_roles` no está configurada correctamente.

---

## ✅ SOLUCIÓN (2 minutos)

### **Paso 1: Ir a Supabase Dashboard**

1. Abre: https://supabase.com/dashboard/project/benyelkdijorahyeiawp
2. Ve a: **SQL Editor** (icono 📝 en el menú izquierdo)

---

### **Paso 2: Ejecutar el Script SQL**

1. Haz clic en **"+ New Query"**
2. **Copia y pega** TODO el contenido del archivo:
   ```
   supabase/fix_user_roles_complete.sql
   ```
3. Haz clic en **"Run"** (botón verde abajo a la derecha)

---

### **Paso 3: Verificar Resultado**

Deberías ver varios mensajes en la consola, terminando con:

```
✅ ========================================
✅ Script completado exitosamente
✅ ========================================

📊 Tabla user_roles configurada:
   - Estructura creada ✅
   - RLS habilitado ✅
   - Políticas creadas ✅
   - Roles asignados al usuario ✅

🚀 Puedes refrescar el frontend ahora
   El error 400 debería estar resuelto
```

---

### **Paso 4: Refrescar el Frontend**

1. En el navegador, presiona: **Ctrl + F5** (o Cmd + Shift + R en Mac)
2. Intenta crear el perfil de organizador nuevamente
3. El badge debería mostrarse correctamente como **"📝 Borrador"**

---

## 🔍 ¿Qué hace el script?

1. ✅ Crea la tabla `user_roles` con la estructura correcta
2. ✅ Habilita Row Level Security (RLS)
3. ✅ Crea políticas para permitir lectura pública
4. ✅ Te asigna los roles `organizador` y `usuario`
5. ✅ Verifica que todo esté configurado correctamente

---

## 🆘 Si aún hay problemas

Si después de ejecutar el script sigues viendo el error 400:

1. **Verifica en el SQL Editor** que el script se ejecutó sin errores
2. **Ejecuta esta consulta** para verificar tus roles:
   ```sql
   SELECT * FROM public.user_roles 
   WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285';
   ```
   Deberías ver 2 filas: `organizador` y `usuario`

3. **Cierra sesión y vuelve a iniciar** en el frontend

---

## 📋 Estructura de user_roles

```sql
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  role_slug text NOT NULL,  -- ✅ No 'granted_at', solo 'created_at'
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_slug)
);
```

---

## 🎯 Resultado Esperado

Después del script y refresh:

- ✅ No más error 400 en `user_roles`
- ✅ Badge muestra **"📝 Borrador"** al crear el perfil
- ✅ Puedes guardar el perfil de organizador sin problemas
- ✅ El perfil se crea con `estado_aprobacion: 'borrador'`

---

¡Ejecuta el script y avísame cuando esté listo! 🚀

