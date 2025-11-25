# 🔧 Solución: Error 429 (Rate Limit) en Supabase

## 🚨 Problema

El error `429 - email rate limit exceeded` aparece con **cualquier email**, incluso la primera vez. Esto indica un problema de configuración en Supabase, no un límite por usuario.

## ✅ Soluciones

### **Opción 1: Configurar SMTP Personalizado (Recomendado)**

1. **Ve a Supabase Dashboard:**
   - Settings → Authentication → SMTP Settings

2. **Configura un servicio SMTP:**
   - **Gmail SMTP** (para desarrollo):
     - Host: `smtp.gmail.com`
     - Port: `587`
     - Username: Tu email de Gmail
     - Password: App Password de Gmail (no tu contraseña normal)
   
   - **SendGrid** (recomendado para producción):
     - Host: `smtp.sendgrid.net`
     - Port: `587`
     - Username: `apikey`
     - Password: Tu API Key de SendGrid
   
   - **Resend** (moderno y fácil):
     - Host: `smtp.resend.com`
     - Port: `587`
     - Username: `resend`
     - Password: Tu API Key de Resend

3. **Habilita SMTP:**
   - Marca "Enable Custom SMTP"
   - Guarda la configuración

### **Opción 2: Verificar Límites del Proyecto**

1. **Ve a Supabase Dashboard:**
   - Settings → Billing
   - Verifica el plan actual (Free tier tiene límites muy bajos)

2. **Si estás en Free tier:**
   - Límite: ~3-4 emails por hora por proyecto
   - Considera actualizar a Pro plan o configurar SMTP personalizado

### **Opción 3: Verificar Configuración de Email**

1. **Ve a Authentication → Email Templates:**
   - Verifica que los templates estén configurados
   - Verifica que "Enable email confirmations" esté activado si es necesario

2. **Verifica Rate Limits:**
   - Settings → API → Rate Limits
   - Verifica si hay límites globales configurados

### **Opción 4: Usar Solo Google OAuth (Temporal)**

Mientras se resuelve el problema de SMTP, puedes:
- Deshabilitar temporalmente los botones de "Enlace mágico"
- Usar solo "Continuar con Google" para autenticación

## 🔍 Debug

Para ver más detalles del error, abre la consola del navegador (F12) y busca:
```
[magicLinkAuth] Rate limit error details
```

Esto mostrará información completa del error para diagnosticar el problema.

## 📝 Notas

- El error 429 puede ser por límites globales del proyecto, no por usuario
- Configurar SMTP personalizado elimina estos límites
- Google OAuth no tiene estos límites y es una buena alternativa

