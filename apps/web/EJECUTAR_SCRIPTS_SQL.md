# 📋 Cómo Ejecutar los Scripts SQL - BaileApp

## 🎯 **ORDEN DE EJECUCIÓN**

Debes ejecutar los 4 scripts en este orden exacto:

1. ✅ **SCRIPT_1_TABLAS_EVENTOS.sql** - Crea las tablas de eventos
2. ✅ **SCRIPT_2_BUCKET_USER_MEDIA.sql** - Crea bucket para usuarios
3. ✅ **SCRIPT_3_BUCKET_ORG_MEDIA.sql** - Crea bucket para organizadores
4. ✅ **SCRIPT_4_PERFILES_PUBLICOS.sql** - Configura perfiles públicos

---

## 📝 **INSTRUCCIONES PASO A PASO:**

### **PASO 1: Abrir Supabase Dashboard**

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión
3. Selecciona tu proyecto "BaileApp"

---

### **PASO 2: Abrir SQL Editor**

1. En el menú lateral izquierdo, haz clic en **"SQL Editor"**
2. Haz clic en el botón **"+ New query"** (Nueva consulta)

---

### **PASO 3: Ejecutar SCRIPT 1 - Tablas de Eventos**

1. Abre el archivo **`SCRIPT_1_TABLAS_EVENTOS.sql`**
2. Copia **TODO** el contenido del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **"Run"** (Ejecutar) o presiona `Ctrl + Enter`
5. Espera a que aparezca el mensaje de éxito ✅

**Qué hace este script:**
- ✅ Crea tabla `profiles_organizer`
- ✅ Crea tabla `events_parent`
- ✅ Crea tabla `events_date`
- ✅ Crea tabla `rsvp`
- ✅ Configura índices
- ✅ Habilita RLS
- ✅ Crea políticas de seguridad

---

### **PASO 4: Ejecutar SCRIPT 2 - Bucket User Media**

1. Haz clic en **"+ New query"** para crear una nueva consulta
2. Abre el archivo **`SCRIPT_2_BUCKET_USER_MEDIA.sql`**
3. Copia **TODO** el contenido del archivo
4. Pégalo en el SQL Editor
5. Haz clic en **"Run"** (Ejecutar)
6. Espera a que aparezca el mensaje de éxito ✅

**Qué hace este script:**
- ✅ Crea bucket `user-media` (público)
- ✅ Configura 4 políticas RLS (SELECT, INSERT, UPDATE, DELETE)
- ✅ Agrega columna `media` a `profiles_user`

---

### **PASO 5: Ejecutar SCRIPT 3 - Bucket Org Media**

1. Haz clic en **"+ New query"** para crear una nueva consulta
2. Abre el archivo **`SCRIPT_3_BUCKET_ORG_MEDIA.sql`**
3. Copia **TODO** el contenido del archivo
4. Pégalo en el SQL Editor
5. Haz clic en **"Run"** (Ejecutar)
6. Espera a que aparezca el mensaje de éxito ✅

**Qué hace este script:**
- ✅ Crea bucket `org-media` (público)
- ✅ Configura 4 políticas RLS (SELECT, INSERT, UPDATE, DELETE)
- ✅ Asocia archivos con `organizer_id`

---

### **PASO 6: Ejecutar SCRIPT 4 - Perfiles Públicos**

1. Haz clic en **"+ New query"** para crear una nueva consulta
2. Abre el archivo **`SCRIPT_4_PERFILES_PUBLICOS.sql`**
3. Copia **TODO** el contenido del archivo
4. Pégalo en el SQL Editor
5. Haz clic en **"Run"** (Ejecutar)
6. Espera a que aparezca el mensaje de éxito ✅

**Qué hace este script:**
- ✅ Habilita RLS en `profiles_user`
- ✅ Configura política de acceso público
- ✅ Configura políticas de edición (solo dueño)

---

## ✅ **VERIFICACIÓN COMPLETA**

Después de ejecutar todos los scripts, verifica que todo esté correcto:

### **1. Verificar Tablas Creadas**

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles_organizer', 'events_parent', 'events_date', 'rsvp', 'profiles_user')
ORDER BY table_name;
```

**Resultado esperado:**
```
events_date
events_parent
profiles_organizer
profiles_user
rsvp
```

---

### **2. Verificar Buckets de Storage**

```sql
SELECT id, name, public FROM storage.buckets 
WHERE id IN ('AVATARS', 'user-media', 'org-media')
ORDER BY id;
```

**Resultado esperado:**
```
AVATARS     | AVATARS     | true
org-media   | org-media   | true
user-media  | user-media  | true
```

---

### **3. Verificar Políticas RLS de Storage**

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (policyname LIKE '%user media%' OR policyname LIKE '%org media%')
ORDER BY policyname;
```

**Resultado esperado:** 8 políticas (4 para user-media, 4 para org-media)

---

### **4. Verificar Políticas RLS de Tablas**

```sql
SELECT tablename, COUNT(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles_organizer', 'events_parent', 'events_date', 'rsvp', 'profiles_user')
GROUP BY tablename
ORDER BY tablename;
```

**Resultado esperado:**
```
events_date          | 3
events_parent        | 3
profiles_organizer   | 3
profiles_user        | 4
rsvp                 | 4
```

---

## 🎊 **¡TODO LISTO!**

Si todas las verificaciones son exitosas, tu base de datos está completamente configurada y lista para usar.

**Ahora puedes:**

1. ✅ Ejecutar `npm run dev` en `apps/web`
2. ✅ Abrir [http://localhost:5174](http://localhost:5174)
3. ✅ Crear una cuenta
4. ✅ Completar el onboarding
5. ✅ Crear tu perfil de organizador
6. ✅ Subir fotos y videos
7. ✅ Crear eventos y fechas
8. ✅ Ver métricas de RSVP

---

## ❓ **TROUBLESHOOTING**

### **Error: "relation already exists"**
- **Solución:** Esto es normal si ya ejecutaste el script antes. Puedes ignorarlo.

### **Error: "permission denied"**
- **Solución:** Asegúrate de estar usando una cuenta con permisos de administrador en Supabase.

### **Error: "bucket already exists"**
- **Solución:** Esto es normal si ya ejecutaste el script antes. Puedes ignorarlo.

### **Error: "policy already exists"**
- **Solución:** Los scripts incluyen `DROP POLICY IF EXISTS`, así que esto no debería pasar. Si pasa, ejecuta manualmente:
  ```sql
  DROP POLICY IF EXISTS "nombre_de_la_política" ON tabla_o_storage.objects;
  ```

---

## 📞 **NECESITAS AYUDA?**

Si tienes algún problema:

1. Revisa los mensajes de error en el SQL Editor
2. Verifica que copiaste **TODO** el contenido del script
3. Asegúrate de ejecutar los scripts **en orden**
4. Verifica que tu proyecto de Supabase está activo

---

**¡Disfruta tu BaileApp completamente funcional!** 🎤📅🎵✨
