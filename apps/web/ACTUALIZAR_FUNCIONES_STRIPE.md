# 🔄 Actualizar Funciones de Stripe en Supabase

Si ya tienes las funciones creadas pero necesitas actualizarlas con los cambios de CORS, sigue estos pasos:

## 📋 PASO A PASO: Actualizar Funciones Existentes

### 1. Ir al Dashboard de Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **"Edge Functions"**

### 2. Actualizar `stripe-create-connected-account`

1. En la lista de funciones, busca **`stripe-create-connected-account`**
2. Haz clic en el nombre de la función
3. Verás un editor de código con el código actual
4. **Borra TODO el contenido** del editor (Ctrl+A, luego Delete)
5. Abre el archivo en tu editor local: `supabase/functions/stripe-create-connected-account/index.ts`
6. **Copia TODO el contenido** (Ctrl+A, luego Ctrl+C)
7. **Pega** en el editor del Dashboard (Ctrl+V)
8. Haz clic en **"Deploy"** o **"Update"** (botón verde, generalmente abajo a la derecha)
9. Espera a que diga **"Deployed successfully"** ✅

### 3. Actualizar `stripe-create-account-link`

1. Vuelve a la lista de funciones (flecha atrás o menú lateral)
2. Haz clic en **`stripe-create-account-link`**
3. Repite los pasos 3-9 del punto anterior:
   - Borra el contenido
   - Copia desde `supabase/functions/stripe-create-account-link/index.ts`
   - Pega en el editor
   - Haz clic en **"Deploy"**

### 4. Actualizar `stripe-create-checkout-session`

1. Vuelve a la lista de funciones
2. Haz clic en **`stripe-create-checkout-session`**
3. Repite los pasos:
   - Borra el contenido
   - Copia desde `supabase/functions/stripe-create-checkout-session/index.ts`
   - Pega en el editor
   - Haz clic en **"Deploy"**

### 5. Verificar que están activas

1. Vuelve a la lista de funciones
2. Verifica que las 3 funciones muestren estado **"Active"** o **"Activa"**
3. Si alguna muestra error, haz clic en ella y revisa los logs

---

## ✅ Verificación Final

Después de actualizar todas las funciones:

1. **Espera 30-60 segundos** para que los cambios se propaguen
2. **Refresca tu aplicación local** (Ctrl+F5 o Cmd+Shift+R para hard refresh)
3. Intenta hacer clic en **"Conectar con Stripe"** nuevamente
4. El error de CORS debería desaparecer

---

## 🐛 Si Sigue Fallando

### Verificar que los cambios estén aplicados:

1. Ve a Supabase Dashboard → Edge Functions → `stripe-create-connected-account`
2. Verifica que la primera línea del código (después de `serve(async (req) => {`) sea:
   ```typescript
   // CORS headers - Manejar preflight OPTIONS PRIMERO
   if (req.method === "OPTIONS") {
   ```
3. Si NO aparece esta línea al inicio, significa que no se actualizó correctamente

### Verificar logs:

1. En Supabase Dashboard → Edge Functions → `stripe-create-connected-account` → **"Logs"**
2. Intenta hacer la llamada desde tu app
3. Revisa si aparece algún error en los logs

### Si nada funciona:

1. **Elimina** las funciones y vuelve a crearlas desde cero usando la guía `STRIPE_SETUP_PASO_A_PASO.md`
2. Asegúrate de copiar TODO el contenido sin omitir líneas

---

## 📝 Notas Importantes

- ⚠️ **NO crees funciones duplicadas** - Si ya existen, actualízalas
- ⚠️ **Asegúrate de copiar TODO el código** - No omitas líneas
- ⚠️ **Espera a que termine el deploy** antes de probar
- ✅ Los cambios de CORS están en las primeras 10 líneas de cada función

