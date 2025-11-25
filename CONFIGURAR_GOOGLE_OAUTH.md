# 🔐 Guía: Configurar Google OAuth para mostrar tu dominio

## 📋 Pasos para que Google muestre `dondebailar.com.mx` en lugar de `xjagwppplovcqmztcymd.supabase.co`

### 1️⃣ Configurar Site URL en Supabase Dashboard

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Settings** → **Authentication** → **URL Configuration**
3. En **Site URL**, agrega:
   ```
   https://dondebailar.com.mx
   ```
4. En **Redirect URLs**, agrega:
   ```
   https://dondebailar.com.mx/auth/callback
   https://dondebailar.com.mx/**
   ```
5. Guarda los cambios

### 2️⃣ Configurar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** → **Credentials**
4. Abre tu **OAuth 2.0 Client ID**
5. En **Authorized redirect URIs**, agrega:
   ```
   https://xjagwppplovcqmztcymd.supabase.co/auth/v1/callback
   https://dondebailar.com.mx/auth/callback
   ```
6. En **Application name** (si está disponible), cambia a:
   ```
   Dónde Bailar
   ```
7. Guarda los cambios

### 3️⃣ Configurar Variable de Entorno

Asegúrate de tener en tu `.env` o variables de entorno de Vercel:

```env
VITE_SITE_URL=https://dondebailar.com.mx
```

### 4️⃣ Verificar Configuración en Supabase

1. Ve a **Authentication** → **Providers** → **Google**
2. Verifica que estén configurados:
   - **Enabled**: ✅ Activado
   - **Client ID**: Tu Client ID de Google
   - **Client Secret**: Tu Client Secret de Google

### ✅ Resultado Esperado

Después de estos cambios:
- Google mostrará "Dónde Bailar" o tu dominio en la pantalla de consentimiento
- La redirección usará `dondebailar.com.mx` en lugar de la URL de Supabase
- El flujo de autenticación funcionará correctamente

### 🔍 Nota Importante

El mensaje "Accede a xjagwppplovcqmztcymd.supabase.co" puede seguir apareciendo temporalmente porque:
- Google cachea la información del OAuth
- Puede tomar unos minutos en actualizarse

Si después de configurar todo sigue apareciendo, espera 5-10 minutos y prueba de nuevo.

