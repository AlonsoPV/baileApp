# ✅ Verificar Configuración de Vercel y Supabase

Esta guía te ayuda a verificar que tu deployment está correctamente configurado.

---

## 🗄️ **PARTE 1: Verificar Supabase**

### **1.1 Verificar Proyecto Activo**

1. Ve a https://app.supabase.com
2. Deberías ver tu proyecto (ej: `baileapp-staging`)
3. Verifica que el estado sea **"Active"** (verde)

---

### **1.2 Verificar Credenciales (API Keys)**

1. Ve a **Settings** (⚙️) > **API**
2. Copia y verifica:

```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGc...
```

3. **Verificar que coincidan con tu `.env.staging.local`:**

```bash
# En apps/web/.env.staging.local
VITE_SUPABASE_URL=https://xxxxx.supabase.co  ← Debe coincidir
VITE_SUPABASE_ANON_KEY=eyJhbGc...            ← Debe coincidir
```

---

### **1.3 Verificar Tablas Creadas**

Ejecuta en **SQL Editor**:

```sql
-- Verificar tablas principales
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Deberías ver al menos:
-- challenges
-- challenge_submissions
-- challenge_votes
-- events_date
-- events_parent
-- profiles_academy
-- profiles_brand
-- profiles_organizer
-- profiles_teacher
-- profiles_user
-- roles
-- tags
-- trendings
-- trending_candidates
-- trending_votes
-- user_roles
-- event_rsvp
```

**✅ SI ves todas:** Migraciones correctas  
**❌ SI faltan algunas:** Ejecutar las migraciones pendientes

---

### **1.4 Verificar RLS (Row Level Security)**

```sql
-- Verificar que RLS está habilitado en tablas críticas
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ Habilitado' ELSE '❌ Deshabilitado' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles_user', 'profiles_organizer', 'profiles_teacher', 
    'profiles_academy', 'challenges', 'trendings', 'event_rsvp'
  )
ORDER BY tablename;

-- Todas deberían tener RLS habilitado
```

**✅ SI todas tienen RLS:** Correcto  
**❌ SI alguna no tiene RLS:** Ejecutar `ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;`

---

### **1.5 Verificar Políticas RLS**

```sql
-- Ver políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Deberías ver políticas como:
-- challenges | SELECT | Users can view challenges
-- challenges | INSERT | Creators can create challenges
-- etc.
```

**✅ SI hay políticas:** Correcto  
**❌ SI no hay políticas:** Ejecutar archivos de migraciones que crean RLS

---

### **1.6 Verificar Storage**

1. Ve a **Storage** (🗂️)
2. Deberías ver bucket: **`media`**
3. Click en `media`
4. Verifica que es **público** (candado abierto)

**En SQL Editor:**
```sql
-- Verificar bucket media
SELECT 
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 as size_limit_mb
FROM storage.buckets
WHERE name = 'media';

-- Verificar políticas de storage
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ Lectura pública'
    WHEN cmd = 'INSERT' THEN '📤 Upload (autenticados)'
    WHEN cmd = 'UPDATE' THEN '✏️ Actualizar'
    WHEN cmd = 'DELETE' THEN '🗑️ Eliminar'
  END as descripcion
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;
```

**✅ SI el bucket es público y tiene políticas:** Correcto  
**❌ SI el bucket no existe o no es público:** Ejecutar `setup_storage_policies.sql`

---

### **1.7 Verificar Authentication**

1. Ve a **Authentication** (🔐) > **Providers**
2. Verifica que **Email** esté habilitado:
   - ✅ Enable Email provider
   - ✅ Enable Email & Password (para usar contraseñas)
   - ✅ Magic Link (para OTP sin contraseña)

3. **Opcional:** Configurar redirect URLs
   - **Site URL:** `https://baileapp-staging.vercel.app` (o tu URL de staging)
   - **Redirect URLs:** 
     ```
     http://localhost:3000
     https://baileapp-staging.vercel.app
     https://*.vercel.app
     ```

---

### **1.8 Verificar Usuarios de Prueba**

```sql
-- Ver usuarios creados
SELECT 
  u.email,
  u.email_confirmed_at IS NOT NULL as email_confirmado,
  u.encrypted_password IS NOT NULL as tiene_password,
  p.display_name,
  ur.role_slug
FROM auth.users u
LEFT JOIN public.profiles_user p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email LIKE '%@staging.baileapp.com'
ORDER BY u.email;

-- Deberías ver:
-- admin@staging.baileapp.com      | true | true | Admin de Prueba | superadmin
-- organizador@staging.baileapp.com | true | true | Organizador de Prueba | organizador
-- academia@staging.baileapp.com    | true | true | Academia de Prueba | academia
-- maestro@staging.baileapp.com     | true | true | Maestro de Prueba | maestro
-- usuario@staging.baileapp.com     | true | true | Usuario Regular | usuario
```

**✅ SI todos tienen email confirmado y password:** Puedes hacer login  
**❌ SI email_confirmado es false:** Ejecutar `UPDATE auth.users SET email_confirmed_at = now() WHERE ...`

---

## ☁️ **PARTE 2: Verificar Vercel**

### **2.1 Verificar Proyecto Existe**

1. Ve a https://vercel.com/dashboard
2. Deberías ver tu proyecto: **`baileapp-staging`** (o el nombre que usaste)
3. Verifica que el último deploy sea **"Ready"** (✅ verde)

---

### **2.2 Verificar Git Branch Conectado**

1. En tu proyecto de Vercel, ve a **Settings** > **Git**
2. Verifica:
   - **Production Branch:** `main`
   - **Preview Branches:** Todos los branches (o específicamente `staging`)

---

### **2.3 Verificar Environment Variables**

1. Ve a **Settings** > **Environment Variables**
2. Deberías tener al menos estas variables para **Preview** (staging):

```
VITE_SUPABASE_URL          = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY     = eyJhbGc...
VITE_APP_ENV               = staging
```

**✅ Para verificar:**
- Click en cada variable
- Verifica que esté asignada a **Preview** environment
- Verifica que los valores coincidan con tu Supabase staging

---

### **2.4 Verificar Build Settings**

1. Ve a **Settings** > **General**
2. Verifica:

```
Framework Preset: Vite
Root Directory: apps/web
Build Command: npm run build (o vite build)
Output Directory: dist
Install Command: npm install
Node.js Version: 18.x o 20.x
```

---

### **2.5 Verificar Último Deploy**

1. Ve a **Deployments** (tab superior)
2. Busca el deploy más reciente
3. Click en él
4. Verificar:

**Estado:**
```
✅ Building     - Completado
✅ Checks       - Passed
✅ Deployed     - Ready
```

**Runtime Logs:**
- Click en **"Runtime Logs"**
- **NO deberías ver errores** (rojos)
- Si hay warnings (amarillos), revisar pero no son críticos

**Build Logs:**
- Busca líneas como:
  ```
  ✓ built in XXX ms
  ✓ XX modules transformed
  dist/index.html                X.XX kB
  dist/assets/index-XXXX.js      XXX.XX kB
  ```

**✅ SI todo verde:** Build correcto  
**❌ SI hay errores rojos:** Revisar logs y corregir

---

### **2.6 Verificar URL de Staging Funciona**

1. Copia la URL de tu deploy (ej: `https://baileapp-staging.vercel.app`)
2. Ábrela en navegador privado (incógnito)
3. Verificar:
   - [ ] La página carga (no error 404 o 500)
   - [ ] Ves el diseño de la app
   - [ ] No hay errores en consola del navegador (F12 > Console)

---

## 🧪 **PARTE 3: Verificar Conexión Vercel ↔ Supabase**

### **3.1 Test desde la App Desplegada**

1. Abre tu URL de staging en el navegador
2. Abre **DevTools** (F12) > **Console**
3. Ejecuta:

```javascript
// Verificar variables de entorno
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('App Env:', import.meta.env.VITE_APP_ENV);

// Debería mostrar:
// Supabase URL: https://xxxxx.supabase.co
// App Env: staging
```

**✅ SI muestra las URLs correctas:** Variables bien configuradas  
**❌ SI muestra `undefined`:** Variables no configuradas en Vercel

---

### **3.2 Test de Conexión a Supabase**

En la consola del navegador (en tu app desplegada):

```javascript
// Test de conexión
const { data, error } = await fetch('https://xxxxx.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'tu-anon-key',
    'Authorization': 'Bearer tu-anon-key'
  }
}).then(r => r.json());

console.log('Connection test:', { data, error });

// Si funciona, deberías ver respuesta sin errores
```

O más simple:

```javascript
// En tu app, ir a /login y ver Network tab (F12 > Network)
// Intentar login
// Deberías ver request a: https://xxxxx.supabase.co/auth/v1/...
// Status: 200 (si funciona) o 400/401 (si hay problema de config)
```

---

## 🔐 **PARTE 4: Verificar Autenticación Funciona**

### **4.1 Test de Login (Local)**

```bash
cd apps/web
npm run dev:staging
```

Abre http://localhost:3000:

1. Ir a `/login`
2. Ingresar tu email real
3. Click "Enviar magic link"
4. Verificar en consola del navegador:
   ```
   POST https://xxxxx.supabase.co/auth/v1/otp
   Status: 200
   ```

**✅ SI status 200:** Configuración correcta  
**❌ SI status 400/401:** Problema con anon key

---

### **4.2 Verificar Magic Link en Email**

1. Abre tu email
2. Busca email de Supabase
3. El link debería ser:
   ```
   https://xxxxx.supabase.co/auth/v1/verify?token=...&type=email&redirect_to=...
   ```

4. Click en el link
5. Debería redirigir a:
   ```
   http://localhost:3000/auth/callback
   ```

6. Y luego a:
   ```
   /app/explore (si onboarding_complete = true)
   /onboarding/basics (si onboarding_complete = false)
   ```

---

### **4.3 Verificar Sesión Creada**

En SQL Editor:

```sql
-- Ver sesiones activas
SELECT 
  user_id,
  created_at,
  updated_at,
  ip,
  user_agent
FROM auth.sessions
ORDER BY created_at DESC
LIMIT 5;

-- Si acabas de hacer login, deberías ver una sesión reciente
```

---

## 🌐 **PARTE 5: Checklist Final**

### **✅ Supabase:**
- [ ] Proyecto activo y visible en dashboard
- [ ] `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` correctos
- [ ] Tablas creadas (ver query en 1.3)
- [ ] RLS habilitado en todas las tablas
- [ ] Políticas RLS creadas
- [ ] Bucket `media` público y con políticas
- [ ] Authentication > Email habilitado
- [ ] Usuarios de prueba creados con `email_confirmed_at`
- [ ] Redirect URLs configurados (localhost + vercel)

### **✅ Vercel:**
- [ ] Proyecto creado y visible
- [ ] Branch `staging` conectado
- [ ] Environment Variables configuradas (Preview)
- [ ] Build exitoso (último deploy en "Ready")
- [ ] URL de staging accesible
- [ ] No hay errores en Runtime Logs

### **✅ Conexión:**
- [ ] Variables de entorno visibles en browser console
- [ ] Request a Supabase retornan 200
- [ ] Magic Link se envía correctamente
- [ ] Login funciona y crea sesión
- [ ] Redirección a /app/explore funciona

---

## 🐛 **Troubleshooting Común**

### **Error: "Invalid API Key"**

**Causa:** `VITE_SUPABASE_ANON_KEY` incorrecto  
**Solución:**
1. Ve a Supabase > Settings > API
2. Copia el **anon/public key**
3. Actualiza en Vercel > Settings > Environment Variables
4. Redeploy

---

### **Error: "Failed to fetch" o CORS**

**Causa:** URL de Supabase incorrecto o problema de CORS  
**Solución:**
1. Verifica que `VITE_SUPABASE_URL` sea correcto
2. En Supabase > Authentication > URL Configuration:
   - Agregar tu URL de Vercel a **Redirect URLs**

---

### **Error: "Email not confirmed"**

**Causa:** Usuario no tiene `email_confirmed_at`  
**Solución:**
```sql
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'tu-email@gmail.com';
```

---

### **Error: Variables `undefined` en browser console**

**Causa:** Variables no configuradas en Vercel  
**Solución:**
1. Vercel > Settings > Environment Variables
2. Agregar todas las `VITE_*` necesarias
3. Asignar a **Preview** environment
4. Redeploy (Deployments > ... > Redeploy)

---

### **Login funciona pero redirige a onboarding**

**Causa:** Usuario no tiene `onboarding_complete: true`  
**Solución:**
```sql
UPDATE public.profiles_user
SET onboarding_complete = true
WHERE email = 'tu-email@gmail.com';
```

---

### **Login funciona pero dice "No tienes acceso"**

**Causa:** Usuario no tiene rol asignado  
**Solución:**
```sql
-- Asignar rol
INSERT INTO public.user_roles (user_id, role_slug)
SELECT user_id, 'superadmin'
FROM public.profiles_user
WHERE email = 'tu-email@gmail.com'
ON CONFLICT DO NOTHING;
```

---

## 🚀 **Script de Verificación Completa**

Ejecuta este script en SQL Editor para un diagnóstico completo:

```sql
-- ========================================
-- 🔍 DIAGNÓSTICO COMPLETO
-- ========================================

-- 1. Tablas
SELECT 
  '📊 TABLAS' as seccion,
  COUNT(*) as total_tablas
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. Usuarios
SELECT 
  '👥 USUARIOS' as seccion,
  COUNT(*) as total_usuarios,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as emails_confirmados,
  COUNT(*) FILTER (WHERE encrypted_password IS NOT NULL) as con_password
FROM auth.users;

-- 3. Perfiles
SELECT 
  '📝 PERFILES' as seccion,
  COUNT(*) as total_perfiles,
  COUNT(*) FILTER (WHERE onboarding_complete = true) as onboarding_completo
FROM public.profiles_user;

-- 4. Roles
SELECT 
  '🎭 ROLES' as seccion,
  role_slug,
  COUNT(*) as total
FROM public.user_roles
GROUP BY role_slug
ORDER BY role_slug;

-- 5. Contenido
SELECT '📅 EVENTOS' as tipo, COUNT(*) as total FROM public.events_date
UNION ALL
SELECT '🏫 ACADEMIAS', COUNT(*) FROM public.profiles_academy
UNION ALL
SELECT '🎓 MAESTROS', COUNT(*) FROM public.profiles_teacher
UNION ALL
SELECT '👤 ORGANIZADORES', COUNT(*) FROM public.profiles_organizer
UNION ALL
SELECT '🏆 CHALLENGES', COUNT(*) FROM public.challenges
UNION ALL
SELECT '📈 TRENDINGS', COUNT(*) FROM public.trendings;

-- 6. Storage
SELECT 
  '📦 STORAGE' as seccion,
  name as bucket,
  public as es_publico,
  file_size_limit / 1024 / 1024 as limite_mb
FROM storage.buckets;

-- 7. RLS
SELECT 
  '🔐 RLS' as seccion,
  COUNT(*) FILTER (WHERE rowsecurity = true) as tablas_con_rls,
  COUNT(*) FILTER (WHERE rowsecurity = false) as tablas_sin_rls
FROM pg_tables 
WHERE schemaname = 'public';

-- 8. Políticas
SELECT 
  '📜 POLÍTICAS' as seccion,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public';
```

---

## 📋 **Checklist Rápido**

Marca cada item:

- [ ] ✅ Supabase proyecto activo
- [ ] ✅ API Keys correctas en `.env.staging.local`
- [ ] ✅ Tablas creadas (>15 tablas)
- [ ] ✅ RLS habilitado
- [ ] ✅ Bucket `media` público
- [ ] ✅ Email provider habilitado
- [ ] ✅ Usuarios de prueba con email confirmado
- [ ] ✅ Vercel proyecto visible
- [ ] ✅ Variables de entorno en Vercel (Preview)
- [ ] ✅ Último deploy "Ready"
- [ ] ✅ URL de staging accesible
- [ ] ✅ Login funciona (local o deployed)
- [ ] ✅ Sesión se crea correctamente

---

**Si todos los checkboxes están marcados:** ✅ Configuración correcta!  
**Si falta alguno:** Revisar la sección correspondiente arriba.

---

¿Quieres que revisemos algún punto específico juntos? 🔍

