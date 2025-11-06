# 🧪 Configuración de Ambiente Staging

Este documento explica cómo configurar un ambiente de staging para desarrollo y pruebas.

---

## **📁 Estructura de Archivos .env**

```
apps/web/
├── .env                    # Variables compartidas (base)
├── .env.local              # Desarrollo local (gitignored)
├── .env.staging.local      # Staging local (gitignored) 👈 CREAR ESTE
├── .env.production.local   # Producción local (gitignored)
└── .env.example            # Ejemplo público (versionado)
```

---

## **1️⃣ Crear `.env.staging.local`**

Crea el archivo `apps/web/.env.staging.local` con el siguiente contenido:

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
# API Configuration
# ----------------------------------------
VITE_API_BASE_URL=https://api-staging.baileapp.com

# ----------------------------------------
# Storage Buckets (Staging)
# ----------------------------------------
VITE_STORAGE_BUCKET_MEDIA=media
VITE_STORAGE_BUCKET_AVATARS=avatars
VITE_STORAGE_BUCKET_VIDEOS=videos

# ----------------------------------------
# OAuth Providers (Staging)
# ----------------------------------------
VITE_GOOGLE_CLIENT_ID=your-staging-google-client-id.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=your-staging-facebook-app-id

# ----------------------------------------
# Payment Gateway (Staging - Sandbox)
# ----------------------------------------
VITE_STRIPE_PUBLIC_KEY=pk_test_your-staging-stripe-key
VITE_PAYPAL_CLIENT_ID=your-staging-paypal-sandbox-client-id
VITE_PAYPAL_MODE=sandbox

# ----------------------------------------
# Logging & Monitoring (Staging)
# ----------------------------------------
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/staging
VITE_SENTRY_ENVIRONMENT=staging
VITE_LOG_LEVEL=debug

# ----------------------------------------
# Email Configuration (Staging)
# ----------------------------------------
VITE_EMAIL_FROM=noreply-staging@baileapp.com
VITE_EMAIL_SUPPORT=support-staging@baileapp.com

# ----------------------------------------
# Rate Limiting (Staging)
# ----------------------------------------
VITE_RATE_LIMIT_REQUESTS=1000
VITE_RATE_LIMIT_WINDOW=60000

# ----------------------------------------
# Debugging (Staging)
# ----------------------------------------
VITE_SHOW_DEV_TOOLS=true
VITE_SHOW_GRID_OVERLAY=false
VITE_MOCK_API_DELAYS=false
```

---

## **2️⃣ Configurar Proyecto Staging en Supabase**

### **Opción A: Proyecto Separado (Recomendado)**

1. **Crear nuevo proyecto en Supabase:**
   - Ve a https://app.supabase.com
   - Clic en "New Project"
   - Nombre: `baileapp-staging`
   - Región: Misma que producción
   - Password: Guarda en 1Password/LastPass

2. **Copiar credenciales:**
   ```bash
   # Project Settings > API
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

3. **Ejecutar migraciones:**
   ```bash
   # Conectar a staging
   supabase link --project-ref xxxxx
   
   # Aplicar migraciones
   supabase db push
   
   # O manual: copia SQL a SQL Editor de staging
   ```

4. **Configurar Storage Policies:**
   - SQL Editor > Ejecutar scripts de `supabase/migrations/*.sql`
   - Verificar buckets: `media`, `avatars`, `videos`

### **Opción B: Branch Database (Supabase Pro)**

Si tienes plan Pro, puedes crear un branch:

```bash
supabase branches create staging
supabase link --branch staging
```

---

## **3️⃣ Usar Ambiente Staging Localmente**

### **Ejecutar en modo staging:**

```bash
cd apps/web

# Vite leerá .env.staging.local
npm run dev -- --mode staging

# O agregar script a package.json:
# "dev:staging": "vite --mode staging"
```

### **Verificar variables cargadas:**

En el navegador, abre consola y ejecuta:

```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
// Debe mostrar: https://your-staging-project.supabase.co
```

---

## **4️⃣ Deploy a Vercel/Netlify (Staging)**

### **Vercel:**

1. **Crear nuevo proyecto (staging):**
   - Dashboard > Add New > Project
   - Importar mismo repo
   - Nombre: `baileapp-staging`
   - Branch: `staging` (crear branch en git)

2. **Configurar Environment Variables:**
   - Settings > Environment Variables
   - Agregar todas las variables de `.env.staging.local`
   - Environment: **Preview** (o crear "Staging")

3. **Deploy:**
   ```bash
   git checkout -b staging
   git push origin staging
   # Vercel auto-deploya a: https://baileapp-staging.vercel.app
   ```

### **Netlify:**

1. **Crear nuevo site:**
   - Sites > Add new site > Import existing project
   - Repo: mismo que producción
   - Branch: `staging`

2. **Environment Variables:**
   - Site settings > Environment variables
   - Agregar variables de staging

3. **Deploy:**
   ```bash
   git push origin staging
   # Netlify auto-deploya
   ```

---

## **5️⃣ Configurar OAuth para Staging**

### **Google OAuth:**

1. **Google Cloud Console:**
   - https://console.cloud.google.com
   - Crear nuevo OAuth Client ID
   - Authorized redirect URIs:
     ```
     https://your-staging-project.supabase.co/auth/v1/callback
     https://staging.baileapp.com/auth/callback
     ```

2. **Supabase (Staging):**
   - Authentication > Providers > Google
   - Pegar Client ID y Client Secret de staging

### **Facebook OAuth:**

1. **Meta for Developers:**
   - https://developers.facebook.com
   - Crear nueva app de prueba (clone de prod)
   - OAuth Redirect URIs:
     ```
     https://your-staging-project.supabase.co/auth/v1/callback
     ```

2. **Supabase (Staging):**
   - Authentication > Providers > Facebook
   - Pegar App ID y App Secret de staging

---

## **6️⃣ Datos de Prueba (Staging)**

### **Seed Database:**

Crea usuarios y contenido de prueba:

```sql
-- Crear usuario de prueba
insert into auth.users (id, email, email_confirmed_at)
values (
  '00000000-0000-0000-0000-000000000001',
  'test@staging.baileapp.com',
  now()
);

-- Crear perfil
insert into public.profiles_user (
  user_id, 
  email, 
  display_name, 
  onboarding_complete
) values (
  '00000000-0000-0000-0000-000000000001',
  'test@staging.baileapp.com',
  'Usuario de Prueba',
  true
);

-- Asignar rol superadmin
insert into public.user_roles (user_id, role_slug)
values (
  '00000000-0000-0000-0000-000000000001',
  'superadmin'
);
```

### **Importar datos de producción (opcional):**

```bash
# Exportar de producción
supabase db dump -f production_dump.sql

# Limpiar datos sensibles
sed -i 's/@example.com/@staging.example.com/g' production_dump.sql

# Importar a staging
psql -h db.xxxxx.supabase.co -U postgres -d postgres < production_dump.sql
```

---

## **7️⃣ Diferencias Staging vs Producción**

| Aspecto | Staging | Producción |
|---------|---------|------------|
| **URL** | staging.baileapp.com | baileapp.com |
| **Supabase** | Proyecto separado | Proyecto principal |
| **Datos** | Datos de prueba | Datos reales |
| **Analytics** | Deshabilitado | Habilitado |
| **Debug Tools** | Habilitado | Deshabilitado |
| **Rate Limits** | Permisivo (1000/min) | Estricto (100/min) |
| **Emails** | noreply-staging@ | noreply@ |
| **Pagos** | Sandbox (Stripe Test) | Live (Stripe Prod) |
| **OAuth** | Credenciales staging | Credenciales prod |

---

## **8️⃣ Flujo de Trabajo Recomendado**

```bash
# 1. Desarrollar en local (dev)
git checkout -b feature/nueva-funcionalidad
npm run dev
# ... hacer cambios ...
git commit -m "feat: nueva funcionalidad"

# 2. Merge a staging
git checkout staging
git merge feature/nueva-funcionalidad
git push origin staging
# Deploy automático a staging.baileapp.com

# 3. QA en staging
# Ejecutar QA_TESTING_GUIDE.md
# Reportar bugs, arreglar

# 4. Merge a main (producción)
git checkout main
git merge staging
git push origin main
# Deploy automático a baileapp.com
```

---

## **9️⃣ Scripts Útiles de package.json**

Agrega estos scripts a `apps/web/package.json`:

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

## **🔟 Checklist de Setup Staging**

- [ ] Crear proyecto Supabase staging
- [ ] Copiar credenciales a `.env.staging.local`
- [ ] Ejecutar migraciones SQL
- [ ] Configurar Storage policies
- [ ] Crear datos de prueba (seed)
- [ ] Configurar OAuth providers
- [ ] Crear branch `staging` en git
- [ ] Deploy a Vercel/Netlify
- [ ] Configurar environment variables en deploy
- [ ] Verificar que la app carga correctamente
- [ ] Ejecutar pruebas de QA básicas
- [ ] Documentar credenciales en 1Password/LastPass

---

## **🐛 Troubleshooting**

### **Error: "Supabase URL inválida"**
- Verifica que `.env.staging.local` esté en `apps/web/`
- Ejecuta con `--mode staging`
- Reinicia el dev server

### **Error: "RLS policies failing"**
- Verifica que ejecutaste todas las migraciones en staging
- Revisa que los nombres de buckets coincidan

### **OAuth no funciona:**
- Verifica redirect URIs en Google/Facebook
- Asegúrate de usar credenciales de staging
- Revisa Supabase > Authentication > Providers

### **Datos no aparecen:**
- Verifica que el usuario esté aprobado (`estado_aprobacion: 'aprobado'`)
- Verifica que `onboarding_complete: true`
- Revisa filtros en queries

---

**Última actualización:** 2025-01-XX  
**Responsable:** [Tu nombre]

