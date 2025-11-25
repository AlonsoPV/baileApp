# 📘 Configurar Facebook OAuth en Supabase

## ✅ Código Frontend Implementado

El código frontend ya está listo. Se ha agregado:
- Botón "Continuar con Facebook" en la sección de login
- Botón "Continuar con Facebook" en la sección de registro
- Función `handleFacebookAuth` que maneja el flujo OAuth
- Estados de carga y deshabilitación de botones durante el proceso

## 🔧 Configuración en Supabase Dashboard

Para que Facebook OAuth funcione, necesitas configurarlo en Supabase:

### 1️⃣ Crear una App en Facebook Developers

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Crea una nueva app o selecciona una existente
3. Agrega el producto "Facebook Login"
4. En "Settings" → "Basic", anota:
   - **App ID**
   - **App Secret**

### 2️⃣ Configurar URLs de Redirección

En Facebook Developers → Settings → Basic:

**Valid OAuth Redirect URIs:**
```
https://[tu-proyecto].supabase.co/auth/v1/callback
https://dondebailar.com.mx/auth/callback
```

Si estás en desarrollo local:
```
http://localhost:5173/auth/callback
http://localhost:3000/auth/callback
```

### 3️⃣ Configurar en Supabase Dashboard

1. Ve a **Supabase Dashboard** → Tu Proyecto → **Authentication** → **Providers**
2. Busca **Facebook** en la lista de proveedores
3. Activa el toggle para habilitar Facebook
4. Ingresa:
   - **Facebook App ID**: Tu App ID de Facebook
   - **Facebook App Secret**: Tu App Secret de Facebook
5. Guarda los cambios

### 4️⃣ Verificar Configuración

1. El **Redirect URL** en Supabase debe ser:
   ```
   https://[tu-proyecto].supabase.co/auth/v1/callback
   ```
2. Este URL debe estar en la lista de "Valid OAuth Redirect URIs" en Facebook

### 5️⃣ Permisos de Facebook

En Facebook Developers → Products → Facebook Login → Settings:

**Permisos recomendados:**
- `email` (requerido)
- `public_profile` (requerido)

**OAuth Login Settings:**
- ✅ Use Strict Mode for Redirect URIs: **Activado**
- Client OAuth Login: **Activado**
- Web OAuth Login: **Activado**

### 6️⃣ Probar

1. Ve a `https://dondebailar.com.mx/auth/login`
2. Haz clic en "Continuar con Facebook"
3. Deberías ser redirigido a Facebook para autorizar
4. Después de autorizar, serás redirigido de vuelta a la app

## ⚠️ Notas Importantes

1. **App en Modo Desarrollo**: Si tu app de Facebook está en modo desarrollo, solo funcionará para usuarios que sean administradores, desarrolladores o probadores de la app.

2. **App en Modo Producción**: Para que funcione para todos los usuarios, necesitas:
   - Completar la revisión de la app en Facebook
   - Agregar un dominio verificado
   - Configurar la política de privacidad y términos de servicio

3. **URLs de Redirección**: Asegúrate de que todas las URLs posibles estén configuradas en Facebook:
   - Producción: `https://dondebailar.com.mx/auth/callback`
   - Desarrollo: `http://localhost:5173/auth/callback` (si aplica)

## 🔍 Troubleshooting

### Error: "Invalid OAuth redirect_uri"
- Verifica que la URL de redirección en Supabase coincida con la configurada en Facebook
- Asegúrate de que la URL esté en la lista de "Valid OAuth Redirect URIs"

### Error: "App Not Setup"
- Verifica que el App ID y App Secret sean correctos
- Asegúrate de que la app de Facebook tenga "Facebook Login" habilitado

### Error: "Redirect URI Mismatch"
- Verifica que `VITE_SITE_URL` esté configurado correctamente en las variables de entorno
- Asegúrate de que la URL de redirección en Facebook incluya todas las variantes posibles

## 📝 Variables de Entorno

Asegúrate de tener configurado en Vercel (o tu plataforma de hosting):

```
VITE_SITE_URL=https://dondebailar.com.mx
```

Esto asegura que el redirectTo en OAuth use la URL correcta.

