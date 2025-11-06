# 🚀 Instrucciones de Setup de Staging - Paso a Paso

Sigue estos pasos para configurar completamente el ambiente de staging.

---

## **📝 Paso 1: Crear Archivo de Variables de Entorno**

### **1.1 Crear `.env.staging.local`**

En tu terminal, desde la raíz del proyecto:

```bash
cd apps/web
touch .env.staging.local
```

### **1.2 Copiar el siguiente contenido a `.env.staging.local`:**

Abre el archivo con tu editor y pega:

```env
# ========================================
# 🧪 STAGING ENVIRONMENT
# ========================================

# ----------------------------------------
# Supabase Configuration (Staging)
# ----------------------------------------
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-staging-anon-key

# ----------------------------------------
# App Configuration
# ----------------------------------------
VITE_APP_ENV=staging
VITE_APP_NAME=Baile App (Staging)
VITE_APP_URL=https://staging.baileapp.com

# ----------------------------------------
# Feature Flags (Staging)
# ----------------------------------------
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_DEBUG_TOOLS=true
VITE_ENABLE_PERFORMANCE_MONITORING=false

# ----------------------------------------
# Storage Buckets (Staging)
# ----------------------------------------
VITE_STORAGE_BUCKET_MEDIA=media
VITE_STORAGE_BUCKET_AVATARS=avatars
VITE_STORAGE_BUCKET_VIDEOS=videos

# ----------------------------------------
# OAuth Providers (Staging) - Opcional
# ----------------------------------------
VITE_GOOGLE_CLIENT_ID=your-staging-google-client-id.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=your-staging-facebook-app-id

# ----------------------------------------
# Debugging (Staging)
# ----------------------------------------
VITE_SHOW_DEV_TOOLS=true
VITE_LOG_LEVEL=debug
```

---

## **🗄️ Paso 2: Crear Proyecto Supabase Staging**

### **2.1 Crear nuevo proyecto:**

1. Ve a https://app.supabase.com
2. Click en **"New Project"**
3. **Organization:** Tu organización
4. **Name:** `baileapp-staging`
5. **Database Password:** Genera uno seguro y guárdalo
6. **Region:** Misma región que producción (ej: `South America (São Paulo)`)
7. Click **"Create new project"**
8. Espera ~2 minutos a que se cree

### **2.2 Copiar credenciales:**

Una vez creado el proyecto:

1. Ve a **Settings** (⚙️) > **API**
2. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Project API keys** > **anon/public** → `VITE_SUPABASE_ANON_KEY`
3. Actualiza tu archivo `.env.staging.local` con estos valores

**Ejemplo:**
```env
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzY0ODMxMzQsImV4cCI6MTk5MjA1OTEzNH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## **🗃️ Paso 3: Ejecutar Migraciones SQL en Staging**

### **3.1 Conectar Supabase CLI a staging:**

```bash
# Desde la raíz del proyecto
supabase link --project-ref abcdefghijk
# Reemplaza 'abcdefghijk' con tu project ref (de la URL)
```

### **3.2 Aplicar migraciones:**

```bash
supabase db push
```

**O manual:** Si prefieres hacerlo manualmente:

1. Ve a tu proyecto staging en Supabase
2. Click en **SQL Editor** (icono </>)
3. Ejecuta cada archivo de `supabase/migrations/` en orden:
   - `2025xxxx_trending.sql`
   - `2025xxxx_rsvp.sql`
   - Cualquier otro archivo `.sql` en la carpeta

### **3.3 Verificar migraciones:**

En SQL Editor, ejecuta:

```sql
-- Verificar tablas principales
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Deberías ver:
-- challenges
-- challenge_submissions
-- challenge_votes
-- events_date
-- events_parent
-- profiles_user
-- profiles_organizer
-- profiles_teacher
-- profiles_academy
-- profiles_brand
-- trendings
-- trending_candidates
-- trending_votes
-- event_rsvp
-- etc.
```

---

## **📦 Paso 4: Configurar Storage Buckets**

### **4.1 Crear buckets:**

En Supabase Dashboard:

1. Ve a **Storage** (icono 🗂️)
2. Click **"New bucket"**
3. Crear los siguientes buckets:

| Bucket Name | Public | File Size Limit |
|-------------|--------|-----------------|
| `media` | ✅ Public | 50 MB |
| `avatars` | ✅ Public | 5 MB |
| `videos` | ✅ Public | 100 MB |

### **4.2 Configurar políticas:**

En SQL Editor, ejecuta:

```sql
-- Política para media (público)
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

-- Repetir para avatars y videos
```

---

## **👤 Paso 5: Crear Usuario de Prueba**

En SQL Editor de staging, ejecuta:

```sql
-- 1. Crear usuario de prueba en auth
INSERT INTO auth.users (
  id, 
  email, 
  email_confirmed_at,
  encrypted_password,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@staging.baileapp.com',
  now(),
  crypt('Password123!', gen_salt('bf')), -- Contraseña: Password123!
  now(),
  now()
);

-- 2. Crear perfil de usuario
INSERT INTO public.profiles_user (
  user_id, 
  email, 
  display_name, 
  onboarding_complete,
  bio
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@staging.baileapp.com',
  'Usuario de Prueba',
  true,
  'Usuario de prueba para staging'
);

-- 3. Asignar rol superadmin
INSERT INTO public.user_roles (user_id, role_slug)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'superadmin'
);

-- 4. Verificar
SELECT u.email, p.display_name, ur.role_slug
FROM auth.users u
LEFT JOIN public.profiles_user p ON u.id = p.user_id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'test@staging.baileapp.com';
```

**Credenciales de login:**
- Email: `test@staging.baileapp.com`
- Password: `Password123!`

---

## **⚙️ Paso 6: Actualizar package.json**

Abre `apps/web/package.json` y agrega estos scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:staging": "vite --mode staging",
    "build": "vite build",
    "build:staging": "vite build --mode staging",
    "preview": "vite preview",
    "preview:staging": "vite preview --mode staging"
  }
}
```

---

## **🧪 Paso 7: Probar Localmente en Modo Staging**

### **7.1 Ejecutar en modo staging:**

```bash
cd apps/web
npm run dev:staging
```

### **7.2 Verificar en navegador:**

Abre http://localhost:3000 y en la consola ejecuta:

```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
// Debe mostrar: https://abcdefghijk.supabase.co (tu proyecto staging)

console.log(import.meta.env.VITE_APP_ENV);
// Debe mostrar: staging
```

### **7.3 Hacer login:**

- Ir a `/login`
- Email: `test@staging.baileapp.com`
- Password: `Password123!`
- Verificar que puedes entrar

---

## **🌿 Paso 8: Crear Branch Staging en Git**

```bash
# 1. Crear branch staging desde main
git checkout main
git pull origin main
git checkout -b staging

# 2. Push a remoto
git push -u origin staging

# Ahora tienes:
# - main (producción)
# - staging (pre-producción)
```

---

## **☁️ Paso 9: Deploy a Vercel (Staging)**

### **9.1 Crear nuevo proyecto en Vercel:**

1. Ve a https://vercel.com/dashboard
2. Click **"Add New..."** > **"Project"**
3. **Import Git Repository:** Selecciona tu repo
4. **Configure Project:**
   - **Project Name:** `baileapp-staging`
   - **Framework Preset:** Vite
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

### **9.2 Configurar Variables de Entorno:**

En **Environment Variables**, agrega:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_SUPABASE_URL` | https://abcdefghijk.supabase.co | Preview |
| `VITE_SUPABASE_ANON_KEY` | eyJhbGc... | Preview |
| `VITE_APP_ENV` | staging | Preview |
| `VITE_APP_NAME` | Baile App (Staging) | Preview |
| `VITE_ENABLE_DEBUG_TOOLS` | true | Preview |

### **9.3 Configurar Git Branch:**

En **Settings** > **Git**:
- **Production Branch:** `main`
- **Preview Branches:** `staging` ✅

### **9.4 Deploy:**

```bash
git push origin staging
# Vercel auto-deploya a: https://baileapp-staging.vercel.app
```

---

## **✅ Paso 10: Verificación Final**

### **Checklist:**

- [ ] `.env.staging.local` creado y configurado
- [ ] Proyecto Supabase staging creado
- [ ] Migraciones SQL ejecutadas
- [ ] Storage buckets creados con políticas
- [ ] Usuario de prueba creado y funcional
- [ ] Scripts de staging en `package.json`
- [ ] Branch `staging` creado en git
- [ ] Proyecto Vercel staging configurado
- [ ] Variables de entorno en Vercel
- [ ] Deploy exitoso a `https://baileapp-staging.vercel.app`

### **Prueba final:**

1. Abre https://baileapp-staging.vercel.app
2. Login con `test@staging.baileapp.com` / `Password123!`
3. Navega a `/app/explore`
4. Verifica que todo carga correctamente
5. Abre consola y verifica que no hay errores

---

## **🎯 Siguiente Paso: Flujo de Trabajo**

Ahora que tienes staging configurado, usa este flujo:

```bash
# 1. Desarrollar feature
git checkout -b feature/nueva-cosa
# ... hacer cambios ...
git commit -m "feat: nueva cosa"

# 2. Merge a staging
git checkout staging
git merge feature/nueva-cosa
git push origin staging
# ✅ Auto-deploy a staging.vercel.app

# 3. QA en staging (ver QA_TESTING_GUIDE.md)
# ... testear todo ...

# 4. Si todo OK, merge a main
git checkout main
git merge staging
git push origin main
# ✅ Auto-deploy a producción
```

---

## **📞 Ayuda**

Si tienes problemas:

1. **Verifica `.env.staging.local`:** Asegúrate de que las credenciales sean correctas
2. **Revisa consola del navegador:** Busca errores de CORS o autenticación
3. **Supabase logs:** Dashboard > Logs para ver errores de backend
4. **Vercel logs:** Dashboard > Deployments > [tu deploy] > Runtime Logs

---

**¡Listo!** 🎉 Ahora tienes un ambiente de staging completamente funcional.

**Próximos pasos sugeridos:**
1. Ejecutar `QA_TESTING_GUIDE.md` en staging
2. Invitar a tu equipo a probar staging
3. Documentar credenciales en 1Password/LastPass

