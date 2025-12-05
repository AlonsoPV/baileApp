   # ✅ Crear la Función Stripe Correcta

El error 404 ocurre porque la función `stripe-create-connected-account` **no existe** en Supabase.

Tu frontend está llamando a:
```javascript
's upabase.functions.invoke('stripe-create-connected-account', ...)
```

Pero esa función no está desplegada. Necesitas crearla.

---

## 📋 Pasos para Crear la Función

### 1. Ve a Supabase Dashboard

1. Abre https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **"Edge Functions"**

### 2. Crear Nueva Función

1. Haz clic en **"Create a new function"** o **"Crear nueva función"**
2. **Nombre de la función:** 
   - Escribe **exactamente**: `stripe-create-connected-account`
   - ⚠️ **IMPORTANTE:** 
     - Todo en minúsculas
     - Con guiones `-`, NO espacios ni guiones bajos `_`
     - Exactamente como está escrito arriba

### 3. Copiar el Código

1. En el editor de código que aparece, **borra TODO** el contenido por defecto
2. Abre en tu editor local el archivo:
   ```
   supabase/functions/stripe-create-connected-account/index.ts
   ```
3. Selecciona **TODO** el contenido (Ctrl+A)
4. Copia (Ctrl+C)
5. Pega en el editor de Supabase (Ctrl+V)

### 4. Desplegar

1. Haz clic en **"Deploy"** o **"Desplegar"** (botón verde, generalmente abajo)
2. Espera a que aparezca **"Deployed successfully"** ✅
3. Puede tomar 30-60 segundos

### 5. Verificar

1. Vuelve a la lista de funciones
2. Deberías ver `stripe-create-connected-account` en la lista
3. Estado debe ser **"Active"**

---

## 🔄 Repetir para las Otras Funciones

Necesitas crear **3 funciones** en total:

1. ✅ `stripe-create-connected-account` (crear ahora)
2. ✅ `stripe-create-account-link` (crear después)
3. ✅ `stripe-create-checkout-session` (crear después)

**Repite los pasos 2-5 para cada una**, usando los archivos correspondientes:
- `supabase/functions/stripe-create-account-link/index.ts`
- `supabase/functions/stripe-create-checkout-session/index.ts`

---

## ✅ Verificación Final

Después de crear todas las funciones:

1. Ve a Edge Functions
2. Deberías ver estas 3 funciones en la lista:
   - `stripe-create-connected-account` ✅
   - `stripe-create-account-link` ✅
   - `stripe-create-checkout-session` ✅

3. Todas deben estar **"Active"**

4. Prueba en tu app - el error 404 debería desaparecer

---

## 🐛 Si Sigue dando 404

1. Verifica que el nombre sea **exactamente** `stripe-create-connected-account`
2. Sin espacios antes o después
3. Todo en minúsculas
4. Verifica que el deployment fue exitoso
5. Espera 1-2 minutos y prueba de nuevo (a veces tarda en propagarse)

