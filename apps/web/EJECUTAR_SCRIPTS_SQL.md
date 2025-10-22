# 📋 Cómo Ejecutar los Scripts SQL - BaileApp

## 🎯 **ORDEN DE EJECUCIÓN**

Debes ejecutar los scripts en este orden exacto:

1. ✅ **SCRIPT_1_TABLAS_EVENTOS.sql** - Crea las tablas de eventos
2. ✅ **SCRIPT_2_BUCKET_USER_MEDIA.sql** - Crea bucket para usuarios
3. ✅ **SCRIPT_3_BUCKET_ORG_MEDIA.sql** - Crea bucket para organizadores
4. ✅ **SCRIPT_4_PERFILES_PUBLICOS.sql** - Configura perfiles públicos
5. ✅ **SCRIPT_5_TRIGGER_MEDIA.sql** - Previene pérdida de media
6. ✅ **SCRIPT_7_ONBOARDING_FLAG.sql** - Agrega flag de onboarding
7. ✅ **SCRIPT_8_CRONOGRAMAS_PRECIOS.sql** - Tablas de cronogramas y precios
8. ✅ **SCRIPT_10_FIX_REQUISITOS.sql** - Fix columna requisitos
9. ⭐ **SCRIPT_11_AUTO_CREATE_USER_PROFILE.sql** - Crea automáticamente perfil al registrarse (IMPORTANTE)
10. 🔧 **SCRIPT_12_FIX_MISSING_PROFILES.sql** - Corrige perfiles faltantes de usuarios existentes
11. 🔓 **SCRIPT_13_FIX_EVENTS_PUBLIC_RLS.sql** - Permite que usuarios vean eventos públicos de otros organizadores
12. 🎭 **SCRIPT_14_ROLE_REQUESTS_SYSTEM.sql** - Sistema completo de roles y aprobación por super admin

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

### **PASO 8: Ejecutar SCRIPT 8 - Cronogramas y Precios**

1. Abre el archivo **`SCRIPT_8_CRONOGRAMAS_PRECIOS.sql`**
2. Copia **TODO** el contenido del archivo
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **"Run"** (Ejecutar) o presiona `Ctrl + Enter`
5. Espera a que aparezca el mensaje de éxito ✅

**Qué hace este script:**
- ✅ Crea tabla `event_schedules` (cronogramas de actividades)
- ✅ Crea tabla `event_prices` (precios y promociones)
- ✅ Configura índices para búsquedas rápidas
- ✅ Habilita RLS en ambas tablas
- ✅ Crea políticas de seguridad para organizadores y público
- ✅ Crea triggers para actualizar timestamps

**Verificación:**
```sql
-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('event_schedules', 'event_prices');
```

---

### **9️⃣ SCRIPT_11_AUTO_CREATE_USER_PROFILE.sql** ⭐

**¿Qué hace?**
- ✅ Crea automáticamente un perfil en `profiles_user` cuando un usuario se registra
- ✅ Previene el error "No se encontró el perfil"
- ✅ Establece `onboarding_complete = false` para nuevos usuarios
- ✅ Usa un trigger en `auth.users` para ejecutarse automáticamente

**Verificación:**
```sql
-- Verificar que el trigger existe
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Verificar la función
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
```

**Prueba:**
1. Registra un nuevo usuario desde la app
2. Verifica que se creó automáticamente su perfil:
```sql
SELECT user_id, onboarding_complete, created_at 
FROM profiles_user 
ORDER BY created_at DESC 
LIMIT 5;
```

**¿Por qué es importante?**
- 🚫 **Antes**: Los usuarios nuevos obtenían error 404 al intentar acceder a su perfil
- ✅ **Ahora**: Cada usuario tiene automáticamente un perfil desde el momento del registro

---

### **🔟 SCRIPT_12_FIX_MISSING_PROFILES.sql** 🔧

**¿Qué hace?**
- ✅ Crea perfiles para usuarios que ya existían antes del trigger
- ✅ Usa LEFT JOIN para encontrar usuarios sin perfil
- ✅ Muestra estadísticas de usuarios corregidos
- ✅ Lista perfiles incompletos

**Cuándo ejecutarlo:**
- Después de ejecutar SCRIPT_11
- Si tienes usuarios que se registraron antes del trigger
- Si ves errores de "perfil no encontrado"

---

### **1️⃣1️⃣ SCRIPT_13_FIX_EVENTS_PUBLIC_RLS.sql** 🔓 (IMPORTANTE)

**¿Qué hace?**
- ✅ Elimina políticas RLS restrictivas antiguas
- ✅ Crea política que permite a TODOS los usuarios autenticados ver eventos publicados
- ✅ Mantiene política para que organizadores vean sus propios eventos (publicados y borradores)
- ✅ Corrige problema de "eventos en blanco" cuando otro usuario intenta verlos

**Políticas creadas:**
```sql
-- Política 1: Todos ven eventos publicados
CREATE POLICY "Authenticated users can view published dates"
ON events_date FOR SELECT TO authenticated
USING (estado_publicacion = 'publicado');

-- Política 2: Organizadores ven sus propios eventos
CREATE POLICY "Organizers can view own dates"
ON events_date FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM events_parent ep
    JOIN profiles_organizer po ON po.id = ep.organizer_id
    WHERE ep.id = parent_id AND po.user_id = auth.uid()
  )
);
```

**Verificación:**
```sql
-- Ver políticas actuales
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'events_date';

-- Ver eventos que DEBERÍAN ser visibles
SELECT id, fecha, lugar, estado_publicacion
FROM events_date
WHERE estado_publicacion = 'publicado'
LIMIT 10;
```

**¿Por qué es importante?**
- 🚫 **Antes:** Solo el organizador podía ver sus eventos
- ✅ **Ahora:** Todos los usuarios autenticados pueden ver eventos publicados
- 🎯 **Resultado:** El sistema de exploración funciona correctamente

---

---

### **1️⃣2️⃣ SCRIPT_14_ROLE_REQUESTS_SYSTEM.sql** 🎭

**¿Qué hace?**
- ✅ Crea tabla `admins` para super administradores
- ✅ Crea tabla `role_requests` para solicitudes de roles
- ✅ Crea tablas `profiles_teacher`, `profiles_school`, `profiles_brand`
- ✅ Implementa función `is_admin(uuid)` para verificar permisos
- ✅ Implementa RPC `approve_role_request` para aprobar/rechazar y crear perfiles automáticamente
- ✅ Configura políticas RLS seguras

**Roles disponibles:**
- 🎤 **Organizador**: Crea eventos
- 🎓 **Maestro**: Ofrece clases
- 🏫 **Academia**: Administra escuela
- 🏷️ **Marca**: Promociona productos

**Flujo de aprobación:**
```
Usuario solicita → Pendiente → Admin aprueba/rechaza → Perfil creado automáticamente
```

**IMPORTANTE - Convertir usuario en admin:**
```sql
-- 1. Obtener tu UUID
SELECT id, email FROM auth.users WHERE email = 'tu-email@ejemplo.com';

-- 2. Hacerte admin (reemplaza el UUID)
INSERT INTO admins (user_id) VALUES ('uuid-aqui');

-- 3. Verificar
SELECT a.user_id, au.email FROM admins a 
JOIN auth.users au ON a.user_id = au.id;
```

**Verificación:**
```sql
-- Ver solicitudes pendientes
SELECT * FROM role_requests WHERE status = 'pendiente';

-- Ver todos los maestros
SELECT * FROM profiles_teacher;

-- Ver todos los admins
SELECT * FROM admins;
```

**Acceso en la app:**
- Usuarios: `/profile/roles` (solicitar roles)
- Admins: `/admin/roles` (aprobar/rechazar)

---

### **📋 DIAGNÓSTICO (Si hay problemas)**

Si después de ejecutar los scripts aún no ves eventos, ejecuta:
```sql
-- apps/web/DIAGNOSTICO_EVENTOS_PUBLICOS.sql
```

Este script te dirá:
- ✅ Cuántos eventos existen
- ✅ Cuántos están publicados
- ✅ Cuántos tienen organizador aprobado
- ✅ Qué políticas RLS están activas
- ✅ Recomendaciones específicas para tu caso

---

**¡Disfruta tu BaileApp completamente funcional!** 🎤📅🎵✨
