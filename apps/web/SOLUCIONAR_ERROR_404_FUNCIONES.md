# 🔴 Error 404 en Edge Functions - Solución

Si ves un **404 Not Found** cuando intentas llamar a la función, significa que la función no está desplegada o no está accesible.

## ❌ Síntoma

```
Request URL: https://xjagwppplovcqmztcymd.supabase.co/functions/v1/stripe-create-connected-account
Status Code: 404 Not Found
```

## ✅ Soluciones

### 1. Verificar que la Función Esté Desplegada

1. Ve a **Supabase Dashboard** → **Edge Functions**
2. Busca `stripe-create-connected-account` en la lista
3. Verifica:
   - ✅ **Estado**: Debe decir **"Active"** o **"Activa"**
   - ✅ **Última actualización**: Debe ser reciente
   - ❌ Si NO aparece en la lista → La función no está creada
   - ❌ Si aparece pero dice "Error" o "Failed" → Hay un problema

### 2. Si la Función NO Existe en la Lista

**Crear la función desde cero:**

1. En Supabase Dashboard → **Edge Functions**
2. Haz clic en **"Create a new function"** o **"Crear nueva función"**
3. **Nombre**: `stripe-create-connected-account` (exactamente así, sin espacios)
4. Abre el archivo local: `supabase/functions/stripe-create-connected-account/index.ts`
5. **Copia TODO el contenido** (Ctrl+A, Ctrl+C)
6. **Pega** en el editor de Supabase (Ctrl+V)
7. Haz clic en **"Deploy"** o **"Desplegar"**
8. Espera a que diga "Deployed successfully" ✅

### 3. Si la Función Existe pero Sigue dando 404

**Verificar el nombre exacto:**

1. Ve a Supabase Dashboard → **Edge Functions**
2. Haz clic en `stripe-create-connected-account`
3. Verifica que el nombre en la URL sea exactamente:
   ```
   /functions/v1/stripe-create-connected-account
   ```
4. NO debe tener espacios ni caracteres especiales
5. Debe estar en minúsculas

**Verificar que esté activa:**

1. En la página de la función, verifica:
   - Estado: **"Active"**
   - Si dice "Inactive" o "Error", haz clic en **"Deploy"** de nuevo

### 4. Re-desplegar la Función

Si ya existe pero da 404:

1. Ve a la función en Supabase Dashboard
2. Haz clic en **"Edit"** o el botón de editar
3. Verifica que el código esté completo
4. Haz clic en **"Deploy"** o **"Update"**
5. Espera 30-60 segundos
6. Prueba de nuevo

### 5. Verificar la URL Correcta

La URL debe ser exactamente:

```
https://[TU_PROJECT_REF].supabase.co/functions/v1/stripe-create-connected-account
```

Para encontrar tu Project Ref:
1. Ve a Supabase Dashboard → **Settings** → **General**
2. Busca **"Reference ID"** o **"Project Reference"**
3. Debe coincidir con la URL que estás usando

### 6. Probar Directamente desde el Navegador

Abre esta URL en tu navegador (reemplaza con tu project ref):

```
https://xjagwppplovcqmztcymd.supabase.co/functions/v1/stripe-create-connected-account
```

**Si la función está desplegada**, deberías ver un error JSON (porque no es OPTIONS/POST, pero confirma que existe).

**Si ves 404**, la función no está desplegada o el nombre es incorrecto.

### 7. Verificar Logs de Deployment

1. Ve a Supabase Dashboard → **Edge Functions** → `stripe-create-connected-account`
2. Ve a la pestaña **"Deployments"** o **"Despliegues"**
3. Verifica el último deployment:
   - ✅ Status: "Success" o "Successfully deployed"
   - ❌ Si dice "Failed", hay un error en el código

### 8. Checklist de Verificación

Marca lo que verificaste:

- [ ] La función aparece en la lista de Edge Functions
- [ ] Estado: "Active"
- [ ] Último deployment fue exitoso
- [ ] El nombre es exactamente `stripe-create-connected-account` (sin espacios)
- [ ] El código está completo en el editor
- [ ] La URL usa el Project Ref correcto

---

## 🚀 Pasos Recomendados (Si Nada Funciona)

### Opción A: Eliminar y Recrear

1. Si la función existe pero da 404, puedes:
   - Eliminarla (botón "Delete" si está disponible)
   - Crearla de nuevo desde cero

### Opción B: Usar CLI de Supabase

Si tienes problemas con el Dashboard, usa la CLI:

```bash
# 1. Login
npx supabase@latest login

# 2. Link al proyecto
npx supabase@latest link --project-ref xjagwppplovcqmztcymd

# 3. Desplegar
npx supabase@latest functions deploy stripe-create-connected-account
```

### Opción C: Verificar Permisos

1. Asegúrate de tener permisos de administrador en el proyecto
2. Verifica que estés en el proyecto correcto de Supabase

---

## 🔍 Diagnóstico Adicional

**Ejecuta esto en la consola del navegador:**

```javascript
// Verificar si la función existe
fetch('https://xjagwppplovcqmztcymd.supabase.co/functions/v1/stripe-create-connected-account', {
  method: 'GET'
})
.then(r => {
  console.log('Status:', r.status);
  console.log('Status Text:', r.statusText);
  return r.text();
})
.then(text => console.log('Response:', text));
```

**Resultados esperados:**
- **200 o 405**: La función existe (normal que falle con GET)
- **404**: La función NO existe o no está desplegada
- **500**: La función existe pero hay un error en el código

