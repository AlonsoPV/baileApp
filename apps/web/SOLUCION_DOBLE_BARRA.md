# 🔧 Solución para URL con Doble Barra

## Problema

Si ves una URL como:
```
http://localhost:5173//stripe/onboarding/success
```

Con doble barra `//`, React Router no puede hacer match y muestra 404.

## ✅ Solución Inmediata

### 1. Probar la URL sin doble barra

Abre directamente en tu navegador:
```
http://localhost:5173/stripe/onboarding/success
```

**Debería funcionar** si la ruta está correctamente configurada.

### 2. Verificar Variable SITE_URL

En Supabase Dashboard → Edge Functions → Settings → Secrets:

- **Variable:** `SITE_URL`
- **Valor debe ser:** `http://localhost:5173` 
- ⚠️ **NO debe tener barra al final** (no `http://localhost:5173/`)

### 3. Actualizar Función de Stripe

La función `stripe-create-account-link` ya tiene código para remover la barra final:

```typescript
let baseUrl = Deno.env.get("SITE_URL") || "https://dondebailar.com.mx";
// Limpiar URL: remover barra final si existe
baseUrl = baseUrl.replace(/\/$/, '');
```

**Asegúrate de que esta función esté actualizada en Supabase:**

1. Ve a Supabase Dashboard → Edge Functions → `stripe-create-account-link`
2. Verifica que tenga estas líneas (líneas 133-136)
3. Si no las tiene, copia el código actualizado desde `supabase/functions/stripe-create-account-link/index.ts`
4. Haz clic en "Deploy"

## 🔍 Diagnóstico

Si la ruta **SIN doble barra** funciona pero Stripe sigue redirigiendo con doble barra:

1. Verifica que `SITE_URL` no tenga barra al final
2. Verifica que la función esté actualizada con el código que remueve la barra final
3. Espera 1-2 minutos después de desplegar y prueba de nuevo

## 🧪 Prueba Rápida

Abre estas URLs directamente en tu navegador:

- ✅ `http://localhost:5173/stripe/onboarding/success` (debe funcionar)
- ✅ `http://localhost:5173/stripe/onboarding/refresh` (debe funcionar)

Si funcionan, el problema es solo que Stripe está generando la doble barra. Sigue los pasos arriba para corregirlo.

