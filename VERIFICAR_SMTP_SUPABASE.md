# 🔍 Verificar Configuración SMTP en Supabase

## 🚨 Problema

Después de habilitar SMTP personalizado, aparece el error 429 (rate limit) con cualquier email.

## ✅ Checklist de Verificación

### 1️⃣ Verificar Credenciales SMTP

En Supabase Dashboard → Settings → Authentication → SMTP Settings:

- [ ] **Enable Custom SMTP**: ✅ Activado
- [ ] **SMTP Host**: Correcto (ej: `smtp.gmail.com`, `smtp.sendgrid.net`)
- [ ] **SMTP Port**: Correcto (587 para TLS, 465 para SSL)
- [ ] **SMTP User**: Correcto (email o username según el proveedor)
- [ ] **SMTP Password**: Correcto (App Password, no contraseña normal)
- [ ] **Sender Email**: Email válido y verificado
- [ ] **Sender Name**: Nombre del remitente

### 2️⃣ Verificar Según Proveedor

#### **Gmail:**
- [ ] Usar **App Password**, no la contraseña normal
- [ ] Habilitar "Less secure app access" (si aplica)
- [ ] Host: `smtp.gmail.com`
- [ ] Port: `587` (TLS) o `465` (SSL)
- [ ] User: Tu email completo

#### **SendGrid:**
- [ ] Usar API Key como password
- [ ] User: `apikey`
- [ ] Password: Tu API Key de SendGrid
- [ ] Host: `smtp.sendgrid.net`
- [ ] Port: `587`

#### **Resend:**
- [ ] Usar API Key como password
- [ ] User: `resend`
- [ ] Password: Tu API Key de Resend
- [ ] Host: `smtp.resend.com`
- [ ] Port: `587`

### 3️⃣ Probar Configuración

1. **En Supabase Dashboard:**
   - Ve a Authentication → Email Templates
   - Haz clic en "Send test email"
   - Verifica si llega el email

2. **Si el test falla:**
   - Revisa los logs en Supabase Dashboard → Logs → Auth Logs
   - Busca errores relacionados con SMTP

### 4️⃣ Verificar Rate Limits

1. **Settings → API → Rate Limits:**
   - Verifica si hay límites globales configurados
   - Los límites de email pueden estar en otro lugar

2. **Authentication → Settings:**
   - Verifica "Rate limit email sends"
   - Puede estar configurado muy bajo

### 5️⃣ Soluciones Comunes

#### **Error: "Invalid credentials"**
- Verifica que el password sea un App Password (Gmail) o API Key
- No uses la contraseña normal de la cuenta

#### **Error: "Connection timeout"**
- Verifica el host y puerto
- Prueba con puerto 465 (SSL) si 587 (TLS) no funciona

#### **Error: "Rate limit" después de configurar SMTP**
- Puede ser que Supabase aún esté usando el SMTP por defecto
- Desactiva y reactiva "Enable Custom SMTP"
- Espera unos minutos y prueba de nuevo

#### **Error: "Sender email not verified"**
- Verifica que el sender email esté verificado en tu proveedor SMTP
- En Gmail, usa el mismo email que configuraste

### 6️⃣ Deshabilitar Temporalmente

Si necesitas que funcione inmediatamente:

1. **Desactiva Custom SMTP temporalmente**
2. **Usa solo Google OAuth** (no tiene límites)
3. **Configura SMTP correctamente después**

## 🔍 Debug en Consola

Abre la consola del navegador (F12) y busca:
```
[magicLinkAuth] Rate limit error details
```

Esto mostrará información detallada del error para diagnosticar el problema específico.

## 📝 Notas

- Después de cambiar la configuración SMTP, puede tardar 1-2 minutos en aplicarse
- Algunos proveedores SMTP requieren verificar el dominio antes de enviar
- Gmail tiene límites propios (500 emails/día en cuentas personales)

