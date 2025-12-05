# 🔍 Verificar que las Funciones de Stripe Estén Funcionando

Si no ves logs cuando llamas a la función, sigue estos pasos para diagnosticar:

## 1. Verificar que las Funciones Estén Desplegadas

### En Supabase Dashboard:

1. Ve a **Edge Functions** en el menú lateral
2. Busca `stripe-create-connected-account`
3. Verifica que:
   - ✅ Estado: **"Active"** o **"Activa"**
   - ✅ Última actualización: Reciente (hace pocos minutos)
   - ❌ Si dice "Error" o "Failed", hay un problema

### Verificar el Código en Supabase:

1. Haz clic en `stripe-create-connected-account`
2. Verifica que las primeras líneas del código sean:

```typescript
serve(async (req) => {
  // Log de depuración - verificar que la función se está ejecutando
  console.log("[stripe-create-connected-account] Request received:", {
    method: req.method,
    url: req.url,
  });

  // Manejo de preflight CORS
  if (req.method === "OPTIONS") {
    console.log("[stripe-create-connected-account] Handling OPTIONS preflight");
    return new Response("ok", { headers: corsHeaders });
  }
```

**Si NO ves estos logs en el código**, la función no se actualizó. Copia el código actualizado y despliégalo.

---

## 2. Verificar que la Función se Está Llamando

### En el Navegador (DevTools):

1. Abre **DevTools** (F12)
2. Ve a la pestaña **Network** (Red)
3. Filtra por: `stripe-create-connected-account`
4. Intenta hacer clic en "Conectar con Stripe"
5. Deberías ver:
   - **OPTIONS** request → Status debería ser 200
   - **POST** request → Status puede variar

### Si NO ves NINGÚN request:

- El problema está en el frontend, no en la función
- Verifica que `supabase.functions.invoke` se esté llamando
- Revisa la consola del navegador por errores de JavaScript

### Si ves el request pero falla:

- Haz clic derecho en el request → **Copy** → **Copy as cURL**
- Comparte el error que ves

---

## 3. Verificar los Logs en Supabase

### Acceder a los Logs:

1. En Supabase Dashboard → **Edge Functions**
2. Haz clic en `stripe-create-connected-account`
3. Ve a la pestaña **Logs** (o **"Registros"**)
4. Selecciona el rango de tiempo: **Última hora** o **Último día**

### Lo que deberías ver:

Si la función se está ejecutando, deberías ver:

```
[stripe-create-connected-account] Request received: { method: "OPTIONS", url: "..." }
[stripe-create-connected-account] Handling OPTIONS preflight
```

O si es POST:

```
[stripe-create-connected-account] Request received: { method: "POST", url: "..." }
[stripe-create-connected-account] Processing POST request
[stripe-create-connected-account] Body received: { userId: "...", roleType: "..." }
```

### Si NO ves NINGÚN log:

**Posibles causas:**
1. ❌ La función no se desplegó correctamente
2. ❌ El código no tiene los logs (versión antigua)
3. ❌ La función no se está llamando (error de CORS bloqueando todo)

---

## 4. Probar la Función Directamente

### Opción A: Usar curl desde la Terminal

```bash
# Probar OPTIONS
curl -X OPTIONS \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v \
  https://xjagwppplovcqmztcymd.supabase.co/functions/v1/stripe-create-connected-account
```

**Deberías ver:**
- Status: 200 OK
- Headers: `Access-Control-Allow-Origin: *`

### Opción B: Usar la Consola del Navegador

Abre la consola del navegador (F12 → Console) y ejecuta:

```javascript
fetch('https://xjagwppplovcqmztcymd.supabase.co/functions/v1/stripe-create-connected-account', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:5173'
  }
})
.then(r => {
  console.log('Status:', r.status);
  console.log('Headers:', Object.fromEntries(r.headers.entries()));
  return r.text();
})
.then(text => console.log('Response:', text));
```

**Deberías ver:**
- Status: 200
- Response: "ok"
- Headers con CORS

---

## 5. Verificar Variables de Entorno

1. En Supabase Dashboard → **Edge Functions** → **Settings** → **Secrets**
2. Verifica que existan:
   - ✅ `STRIPE_SECRET_KEY`
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - ✅ `SITE_URL`

Si falta alguna, agrégala.

---

## 6. Re-desplegar las Funciones

Si nada funciona, vuelve a desplegar:

1. **Actualiza el código:**
   - Copia TODO el contenido de `supabase/functions/stripe-create-connected-account/index.ts`
   - Pégalo en el editor de Supabase
   - Haz clic en **"Deploy"** o **"Update"**

2. **Espera 30-60 segundos**

3. **Prueba de nuevo**

---

## 7. Checklist de Diagnóstico

Marca lo que verificaste:

- [ ] La función está "Active" en Supabase Dashboard
- [ ] El código en Supabase tiene los logs de depuración
- [ ] Veo requests en Network tab del navegador
- [ ] Veo logs en Supabase Dashboard → Logs
- [ ] Las variables de entorno están configuradas
- [ ] El curl/consola funciona

**Si marcaste todo pero sigue sin funcionar:**
- Comparte una captura de pantalla de los logs de Supabase
- Comparte el error exacto de la consola del navegador
- Verifica que no haya errores de sintaxis en el código

