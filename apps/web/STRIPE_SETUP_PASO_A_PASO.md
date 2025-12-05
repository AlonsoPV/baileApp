# 🎯 Guía Paso a Paso: Configurar Stripe Connect

Esta guía te lleva paso a paso para configurar Stripe Connect sin complicaciones.

---

## 📋 PASO 1: Ejecutar la Migración SQL 

1. Abre tu navegador y ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú lateral izquierdo, busca **"SQL Editor"** (Editor SQL)
4. Haz clic en **"New query"** (Nueva consulta)
5. Abre el archivo `apps/web/STRIPE_CONNECT_MIGRATION.sql` en tu editor de código
6. Copia TODO el contenido del archivo (Ctrl+A, luego Ctrl+C)
7. Pega el contenido en el SQL Editor de Supabase (Ctrl+V)
8. Haz clic en **"Run"** (Ejecutar) o presiona Ctrl+Enter
9. Deberías ver un mensaje de éxito ✅

**✅ Verificación:** Deberías ver que se agregaron las columnas `stripe_account_id`, `stripe_onboarding_status`, `stripe_charges_enabled`, `stripe_payouts_enabled` a las tablas.

---

## 🔑 PASO 2: Configurar Variables de Entorno en Supabase

1. En el Dashboard de Supabase, ve a **"Edge Functions"** (Funciones Edge) en el menú lateral
2. Haz clic en **"Settings"** (Configuración) o busca **"Secrets"** (Secretos)
3. Necesitas agregar 3 variables:

### Variable 1: STRIPE_SECRET_KEY
- **Nombre:** `STRIPE_SECRET_KEY`
- **Valor:** Tu clave secreta de Stripe
  - Ve a https://dashboard.stripe.com/apikeys
  - ⚠️ **IMPORTANTE - MODO DE PRUEBAS:**
    - Para desarrollo local: Usa la clave que empieza con `sk_test_` (Test mode)
    - Para producción: Usa la clave que empieza con `sk_live_` (Live mode)
  - Asegúrate de estar en **"Test mode"** en el Dashboard de Stripe (toggle en la parte superior)
  - Copia la **"Secret key"** de test mode
  - Pega en el campo "Value"
  - ✅ **Para desarrollo, DEBES usar test mode.** Funciona perfectamente y no procesa pagos reales.

### Variable 2: SUPABASE_URL
- **Nombre:** `SUPABASE_URL`
- **Valor:** La URL de tu proyecto Supabase
  - Ve a Supabase Dashboard → Settings → API
  - Copia el valor de **"Project URL"** (algo como `https://xxxxx.supabase.co`)
  - Pega en el campo "Value"

### Variable 3: SUPABASE_SERVICE_ROLE_KEY
- **Nombre:** `SUPABASE_SERVICE_ROLE_KEY`
- **Valor:** Tu Service Role Key de Supabase
  - En la misma página (Settings → API)
  - Copia el valor de **"service_role"** key (⚠️ **MUY IMPORTANTE:** Es la clave secreta, no la anon key)
  - Pega en el campo "Value"
  - ⚠️ **ADVERTENCIA:** Esta clave tiene permisos completos, no la compartas

### Variable 4: STRIPE_WEBHOOK_SECRET
- **Nombre:** `STRIPE_WEBHOOK_SECRET`
- **Valor:** Lo obtendrás en el PASO 4 (por ahora déjalo vacío o usa un valor temporal)

### Variable 5: SITE_URL
- **Nombre:** `SITE_URL`
- **Valor:** La URL de tu aplicación 
  - **Para desarrollo local:** `http://localhost:5173` (o el puerto que uses)
  - **Para producción:** `https://dondebailar.com.mx`
  - ⚠️ **IMPORTANTE:** Esta URL se usa para redirects después de pagos y onboarding. Si cambias de desarrollo a producción, actualiza este valor.

**✅ Verificación:** Deberías ver las 5 variables listadas en Secrets:
- `STRIPE_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_WEBHOOK_SECRET` (temporal por ahora)
- `SITE_URL`

---

## 📝 PASO 3: Crear las Edge Functions (Método Fácil)

### Función 1: stripe-create-connected-account

1. En Supabase Dashboard, ve a **"Edge Functions"**
2. Haz clic en **"Create a new function"** (Crear nueva función)
3. **Nombre de la función:** Escribe exactamente: `stripe-create-connected-account`
4. En el editor de código que aparece, **borra todo** el contenido que viene por defecto
5. Abre en tu editor de código el archivo: `supabase/functions/stripe-create-connected-account/index.ts`
6. Copia TODO el contenido (Ctrl+A, luego Ctrl+C)
7. Pega en el editor del Dashboard (Ctrl+V)
8. Haz clic en **"Deploy"** (Desplegar)
9. Espera a que diga "Deployed successfully" ✅

### Función 2: stripe-create-account-link

1. Haz clic en **"Create a new function"** otra vez
2. **Nombre:** `stripe-create-account-link`
3. Borra el contenido por defecto
4. Abre: `supabase/functions/stripe-create-account-link/index.ts`
5. Copia TODO el contenido
6. Pega en el editor
7. Haz clic en **"Deploy"** ✅

### Función 3: stripe-create-checkout-session

1. **Crear nueva función**
2. **Nombre:** `stripe-create-checkout-session`
3. Borra contenido por defecto
4. Abre: `supabase/functions/stripe-create-checkout-session/index.ts`
5. Copia TODO
6. Pega
7. **Deploy** ✅

### Función 4: stripe-webhook

1. **Crear nueva función**
2. **Nombre:** `stripe-webhook`
3. Borra contenido por defecto
4. Abre: `supabase/functions/stripe-webhook/index.ts`
5. Copia TODO
6. Pega
7. **Deploy** ✅

**✅ Verificación:** Deberías ver 4 funciones listadas, todas con estado "Active" o "Activa".

---

## 🔗 PASO 4: Configurar Webhook en Stripe

⚠️ **IMPORTANTE:** Asegúrate de estar en **"Test mode"** en el Dashboard de Stripe (toggle en la parte superior) para desarrollo.

1. Ve a https://dashboard.stripe.com/webhooks
2. Haz clic en **"Add endpoint"** (Agregar endpoint)
3. **Endpoint URL:** Necesitas la URL de tu función webhook
   - Ve a Supabase Dashboard → Edge Functions → `stripe-webhook`
   - Copia la URL que aparece (algo como: `https://xxxxx.supabase.co/functions/v1/stripe-webhook`)
   - ⚠️ **NOTA:** Esta es la URL de tu función en Supabase, NO uses localhost aquí. Stripe necesita poder acceder a esta URL pública.
   - Pega en el campo "Endpoint URL" de Stripe
4. **Events to send:** Selecciona estos eventos:
   - ✅ `checkout.session.completed`
   - ✅ `account.updated`
5. Haz clic en **"Add endpoint"**
6. **IMPORTANTE:** Copia el **"Signing secret"** que aparece (empieza con `whsec_`)
7. Ve de vuelta a Supabase → Edge Functions → Settings → Secrets
8. Actualiza `STRIPE_WEBHOOK_SECRET` con el valor que copiaste

**✅ Verificación:** En Stripe Dashboard deberías ver tu webhook listado con estado "Enabled".

**📝 Nota para desarrollo local:** 
- El webhook usa la URL de Supabase (que es pública), así que funcionará tanto en desarrollo como en producción
- La variable `SITE_URL` que configuraste anteriormente es la que controla a dónde redirige Stripe después de pagos/onboarding

---

## 🧪 PASO 5: Probar que Funciona

1. Ve a tu aplicación y loguéate
2. Ve a tu perfil de maestro/academia/organizador → Editar
3. Deberías ver una sección nueva: **"💳 Cobros con Stripe"**
4. Haz clic en **"Conectar con Stripe"**
5. Deberías ser redirigido a Stripe para completar el onboarding
6. Completa el proceso (puedes usar datos de prueba)
7. Al finalizar, deberías ser redirigido de vuelta a tu aplicación

**✅ Verificación:** Si todo funciona, deberías ver que el estado cambia a "✅ Tus cobros con Stripe están activos".

**🧪 Nota sobre Test Mode:**
- En test mode puedes usar datos de prueba para el onboarding
- Stripe proporciona tarjetas de prueba: `4242 4242 4242 4242` (cualquier CVV y fecha futura)
- Los pagos NO se procesan realmente, solo simulan el flujo
- Perfecto para desarrollo y pruebas

---

## 🆘 ¿Problemas?

### Error: "STRIPE_SECRET_KEY is not set"
- Ve a Supabase → Edge Functions → Settings → Secrets
- Verifica que `STRIPE_SECRET_KEY` esté configurada correctamente

### Error: "Webhook signature verification failed"
- Verifica que `STRIPE_WEBHOOK_SECRET` en Supabase coincida con el "Signing secret" en Stripe Dashboard

### No aparece la sección de Stripe
- Verifica que el usuario tenga el rol aprobado (maestro/academia/organizador)
- Verifica que hayas ejecutado la migración SQL correctamente

### Las funciones no se despliegan
- Verifica que copiaste TODO el código sin omitir líneas
- Verifica que no haya errores de sintaxis (el editor debería marcarlos en rojo)

---

## 📞 ¿Necesitas Ayuda?

Si algo no funciona:
1. Revisa los logs en Supabase Dashboard → Edge Functions → [nombre-función] → Logs
2. Revisa los logs en Stripe Dashboard → Developers → Logs
3. Verifica que todas las variables de entorno estén configuradas

---

## ✅ Checklist Final

- [ ] Migración SQL ejecutada
- [ ] 5 variables de entorno configuradas en Supabase
- [ ] 4 Edge Functions creadas y desplegadas
- [ ] Webhook configurado en Stripe (Test mode)
- [ ] `STRIPE_WEBHOOK_SECRET` actualizado en Supabase
- [ ] Probado el flujo completo de onboarding
- [ ] Verificado que estás usando **Test mode** en Stripe Dashboard

¡Listo! 🎉 Tu integración de Stripe Connect está configurada para desarrollo.

---

## 🚀 Cambiar a Producción (Live Mode)

Cuando estés listo para recibir pagos reales:

1. **En Stripe Dashboard:**
   - Cambia el toggle a **"Live mode"** (arriba a la derecha)
   - Ve a API Keys y copia la **"Secret key"** que empieza con `sk_live_`

2. **En Supabase Dashboard:**
   - Ve a Edge Functions → Settings → Secrets
   - Actualiza `STRIPE_SECRET_KEY` con la clave de live mode

3. **Configurar Webhook de Producción:**
   - En Stripe Dashboard (Live mode) → Webhooks
   - Crea un nuevo endpoint con la misma URL de Supabase
   - Copia el nuevo `STRIPE_WEBHOOK_SECRET` y actualízalo en Supabase

4. **Actualizar SITE_URL:**
   - Cambia `SITE_URL` de `http://localhost:5173` a tu URL de producción
   - Ej: `https://dondebailar.com.mx`

5. **Probar en producción:**
   - Crea una cuenta de prueba con datos reales
   - Verifica que todo funcione antes de lanzar

⚠️ **IMPORTANTE:** Asegúrate de probar exhaustivamente antes de cambiar a live mode. Los pagos serán reales.

