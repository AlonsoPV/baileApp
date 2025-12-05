# 💰 Configurar Precios y Pagos para Clases

Esta guía te explica cómo configurar el precio de tus clases y cómo funciona el sistema de pagos con Stripe.

## 📋 Índice

1. [Configurar Precio en una Clase](#1-configurar-precio-en-una-clase)
2. [Cómo Funciona el Pago](#2-cómo-funciona-el-pago)
3. [Flujo Completo de Pago](#3-flujo-completo-de-pago)
4. [Verificar que Todo Funcione](#4-verificar-que-todo-funcione)

---

## 1. Configurar Precio en una Clase

### Paso 1: Ir al Editor de Perfil

1. Ve a tu perfil de Academia o Maestro:
   - **Academia:** `http://localhost:5173/profile/academy/edit`
   - **Maestro:** `http://localhost:5173/profile/teacher/edit`

2. En la sección de **"Clases"**, haz clic en:
   - **"Crear Clase"** (si es nueva)
   - **"Editar"** en una clase existente

### Paso 2: Configurar el Precio

En el formulario de crear/editar clase, encontrarás la sección **"💰 Precio"**:

```
💰 Precio
┌─────────────────────────────────────┐
│ Precio (opcional)                   │
│ ┌─────────────────────────────────┐ │
│ │ 💵 [ 200                       ] │ │
│ └─────────────────────────────────┘ │
│ Déjalo vacío para no mostrar precio │
│ Pon 0 para marcar como Gratis       │
└─────────────────────────────────────┘
```

**Opciones:**

- **Sin precio:** Deja el campo vacío → La clase no mostrará precio
- **Gratis:** Escribe `0` → La clase mostrará "Gratis"
- **Con precio:** Escribe el precio en pesos (ej: `200`) → La clase mostrará "$200"

### Paso 3: Guardar

Haz clic en **"Guardar"** o **"Crear Clase"**. El precio se guardará automáticamente.

---

## 2. Cómo Funciona el Pago

### Requisitos

Para que una clase pueda recibir pagos, necesitas:

1. ✅ **Cuenta de Stripe conectada** (ya la tienes)
2. ✅ **Stripe habilitado para recibir pagos** (debe estar activo después del onboarding)
3. ✅ **Precio configurado en la clase** (> 0)

### Comisiones

Cuando un usuario paga por una clase:
- **El pago va a tu cuenta de Stripe** (menos la comisión de Stripe)
- **La plataforma cobra una comisión** (configurable, por defecto 5%)

Ejemplo:
- Precio de la clase: $200 MXN
- Comisión de plataforma (5%): $10 MXN
- Comisión de Stripe (~3.6% + $3): ~$10.20 MXN
- **Tu recibes:** ~$179.80 MXN

---

## 3. Flujo Completo de Pago

### Para el Usuario (Estudiante)

1. **Ver la clase:**
   - Usuario visita la página pública de la clase
   - Ve el precio y la descripción

2. **Iniciar pago:**
   - Hace clic en el botón "Pagar" o "Reservar"
   - Se crea una reserva en la base de datos

3. **Procesar pago:**
   - Es redirigido a Stripe Checkout
   - Ingresa su información de tarjeta
   - Confirma el pago

4. **Confirmación:**
   - Stripe procesa el pago
   - El webhook actualiza la reserva como "pagado"
   - El usuario es redirigido a la página de éxito

### Para Ti (Academia/Maestro)

1. **Recibir notificación:**
   - Recibes el pago directamente en tu cuenta de Stripe
   - La reserva se marca como "pagado" en la plataforma

2. **Ver pagos:**
   - Ve a tu dashboard de Stripe: https://dashboard.stripe.com
   - Verás todos los pagos recibidos

---

## 4. Verificar que Todo Funcione

### Verificar Precio en la Clase

1. Ve a la página pública de tu clase:
   ```
   http://localhost:5173/clase?type=academy&id=TU_ID&classId=CLASE_ID
   ```

2. Verifica que:
   - ✅ El precio se muestra correctamente
   - ✅ El botón de pago aparece (si tiene precio > 0)

### Verificar Cuenta de Stripe

1. Ve a tu perfil de academia/maestro
2. En la sección de Stripe, verifica:
   - ✅ Estado: "Conectado" o "Activo"
   - ✅ "Listo para recibir pagos"

### Verificar Webhook de Stripe

1. Ve a Supabase Dashboard → Edge Functions → Logs
2. Busca la función `stripe-webhook`
3. Verifica que recibe eventos de Stripe

---

## 🔧 Configuración Técnica (Ya Hecha)

El sistema ya tiene configurado:

- ✅ **Hook de checkout:** `useCreateCheckoutSession()` en `src/hooks/useStripeCheckout.ts`
- ✅ **Función de Stripe:** `stripe-create-checkout-session` en Supabase
- ✅ **Webhook:** `stripe-webhook` que actualiza las reservas después del pago
- ✅ **Rutas de éxito/cancelación:** `/pago/exitoso` y `/pago/cancelado`

---

## 💡 Ejemplos de Uso

### Clase Gratis

```
Precio: 0
Resultado: Se muestra "Gratis" en la clase
```

### Clase de Pago

```
Precio: 200
Resultado: Se muestra "$200" y aparece botón de pago
```

### Clase sin Precio

```
Precio: (vacío)
Resultado: No se muestra precio ni botón de pago
```

---

## ❓ Preguntas Frecuentes

### ¿Puedo cambiar el precio después de crear la clase?

Sí, puedes editar la clase y cambiar el precio en cualquier momento.

### ¿Qué pasa si un usuario paga pero no puedo dar la clase?

Puedes procesar un reembolso directamente desde tu dashboard de Stripe.

### ¿Cuánto tarda en llegar el dinero a mi cuenta?

Stripe típicamente tarda 2-7 días hábiles en transferir el dinero a tu cuenta bancaria.

### ¿Puedo ofrecer descuentos?

Por ahora, el precio es fijo. Puedes crear múltiples "costos" con diferentes precios para la misma clase (ej: "Paquete 1 clase", "Paquete 5 clases").

---

## 🎯 Próximos Pasos

1. ✅ Configura el precio en tus clases
2. ✅ Verifica que tu cuenta de Stripe esté activa
3. ✅ Prueba hacer un pago de prueba (usa tarjetas de prueba de Stripe)
4. ✅ Revisa que los pagos lleguen correctamente

---

**¿Necesitas ayuda?** Revisa los logs de Supabase o contacta al equipo de desarrollo.

