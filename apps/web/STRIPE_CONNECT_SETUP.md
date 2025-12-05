# 🚀 Integración Stripe Connect - Guía de Implementación

Esta guía describe los pasos necesarios para completar la integración de Stripe Connect (Express) en Donde Bailar MX.

> 📖 **¿Necesitas una guía más simple?** Lee primero: [`STRIPE_SETUP_PASO_A_PASO.md`](./STRIPE_SETUP_PASO_A_PASO.md) - Guía paso a paso con instrucciones detalladas y fáciles de seguir.

## ✅ Pasos Completados

1. ✅ Migración SQL creada (`STRIPE_CONNECT_MIGRATION.sql`)
2. ✅ Stripe SDK instalado y helper creado (`src/lib/stripe.ts`)
3. ✅ Supabase Edge Functions creadas:
   - `stripe-create-connected-account`
   - `stripe-create-account-link`
   - `stripe-create-checkout-session`
   - `stripe-webhook`
4. ✅ Componente React `StripePayoutSettings` creado
5. ✅ Integrado en pantallas de edición:
   - `TeacherProfileEditor.tsx`
   - `AcademyProfileEditor.tsx`
   - `OrganizerProfileEditor.tsx`
6. ✅ Tipos TypeScript actualizados

## 📋 Pasos Pendientes

### 1. Ejecutar Migración SQL

Ejecutar en Supabase SQL Editor:

```sql
-- Ver archivo: apps/web/STRIPE_CONNECT_MIGRATION.sql
```

Este script agrega las columnas necesarias a:
- `profiles_teacher`
- `profiles_academy`
- `profiles_organizer`

### 2. Configurar Variables de Entorno

Agregar en Supabase Dashboard → Settings → Edge Functions → Secrets:

- `STRIPE_SECRET_KEY`: Clave secreta de Stripe (sk_test_... o sk_live_...)
- `STRIPE_WEBHOOK_SECRET`: Secreto del webhook (whsec_...)
- `SITE_URL`: URL base de la aplicación (ej: https://dondebailar.com.mx)

**Nota:** El `STRIPE_WEBHOOK_SECRET` se obtiene después de configurar el webhook en Stripe Dashboard.

### 3. Desplegar Supabase Edge Functions

**Método más fácil: Usar el Dashboard de Supabase (Sin instalar nada)**

Este es el método más simple y no requiere instalar herramientas adicionales:

#### Paso 1: Ir al Dashboard de Supabase

1. Abre tu navegador y ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. En el menú lateral, busca **"Edge Functions"** (o "Funciones" en español)
4. Haz clic en **"Create a new function"** o **"Crear nueva función"**

#### Paso 2: Crear la primera función: `stripe-create-connected-account`

1. **Nombre de la función:** `stripe-create-connected-account`
2. **Código:** Copia TODO el contenido del archivo `supabase/functions/stripe-create-connected-account/index.ts`
   - Abre el archivo en tu editor
   - Selecciona todo (Ctrl+A) y copia (Ctrl+C)
   - Pega en el editor del Dashboard (Ctrl+V)
3. Haz clic en **"Deploy"** o **"Desplegar"**

#### Paso 3: Crear la segunda función: `stripe-create-account-link`

1. Crea otra función nueva
2. **Nombre:** `stripe-create-account-link`
3. **Código:** Copia TODO el contenido de `supabase/functions/stripe-create-account-link/index.ts`
4. Haz clic en **"Deploy"**

#### Paso 4: Crear la tercera función: `stripe-create-checkout-session`

1. Crea otra función nueva
2. **Nombre:** `stripe-create-checkout-session`
3. **Código:** Copia TODO el contenido de `supabase/functions/stripe-create-checkout-session/index.ts`
4. Haz clic en **"Deploy"**

#### Paso 5: Crear la cuarta función: `stripe-webhook`

1. Crea otra función nueva
2. **Nombre:** `stripe-webhook`
3. **Código:** Copia TODO el contenido de `supabase/functions/stripe-webhook/index.ts`
4. Haz clic en **"Deploy"**

#### ✅ Verificación

Después de crear las 4 funciones, deberías verlas listadas en el Dashboard. Cada una debe tener un estado "Active" o "Activa".

---

**Alternativa: Usar CLI (Solo si prefieres usar línea de comandos)**

Si prefieres usar la línea de comandos, puedes usar `npx` sin instalar nada:

```powershell
# 1. Login (abrirá el navegador)
npx supabase@latest login

# 2. Link al proyecto (necesitas el project-ref del Dashboard)
# Lo encuentras en: Settings → General → Reference ID
npx supabase@latest link --project-ref TU_PROJECT_REF_AQUI

# 3. Desplegar cada función
npx supabase@latest functions deploy stripe-create-connected-account
npx supabase@latest functions deploy stripe-create-account-link
npx supabase@latest functions deploy stripe-create-checkout-session
npx supabase@latest functions deploy stripe-webhook
```

### 4. Configurar Webhook en Stripe Dashboard

1. Ir a Stripe Dashboard → Developers → Webhooks
2. Agregar endpoint: `https://<tu-project-ref>.supabase.co/functions/v1/stripe-webhook`
3. Seleccionar eventos:
   - `checkout.session.completed`
   - `account.updated`
4. Copiar el "Signing secret" y agregarlo como `STRIPE_WEBHOOK_SECRET` en Supabase

### 5. Crear Rutas de Éxito/Cancelación

Crear las siguientes rutas en la aplicación:

- `/stripe/onboarding/success` - Página de éxito del onboarding
- `/stripe/onboarding/refresh` - Página para refrescar el onboarding
- `/pago/exitoso` - Página de éxito de pago
- `/pago/cancelado` - Página de cancelación de pago

**Ejemplo de implementación:**

```tsx
// src/screens/payments/StripeOnboardingSuccess.tsx
export default function StripeOnboardingSuccess() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Invalidar queries para refrescar datos de Stripe
    queryClient.invalidateQueries({ queryKey: ['teacher', 'mine'] });
    queryClient.invalidateQueries({ queryKey: ['academy', 'mine'] });
    queryClient.invalidateQueries({ queryKey: ['organizer', 'me'] });
    
    // Redirigir después de 3 segundos
    setTimeout(() => {
      navigate('/profile/edit');
    }, 3000);
  }, []);
  
  return (
    <div>
      <h1>✅ Cuenta de Stripe conectada exitosamente</h1>
      <p>Redirigiendo a tu perfil...</p>
    </div>
  );
}
```

### 6. Agregar Validaciones en Flujos de Pago

En los flujos donde se crean clases o eventos con costo, agregar validación antes de permitir el pago:

**Para Clases:**
```tsx
// Verificar que el maestro/academia tenga Stripe activo
const { data: teacher } = useTeacherMy();
const { data: academy } = useAcademyMy();

const canReceivePayments = 
  (teacher?.stripe_account_id && teacher?.stripe_charges_enabled) ||
  (academy?.stripe_account_id && academy?.stripe_charges_enabled);

if (!canReceivePayments) {
  showToast(
    'Este creador todavía no tiene activados los cobros con Stripe. Intenta más tarde o contacta a la academia/maestro.',
    'error'
  );
  return;
}
```

**Para Eventos:**
```tsx
// Verificar que el organizador tenga Stripe activo
const { data: organizer } = useMyOrganizer();

if (!organizer?.stripe_account_id || !organizer?.stripe_charges_enabled) {
  showToast(
    'Este organizador todavía no tiene activados los cobros con Stripe. Intenta más tarde o contacta al organizador.',
    'error'
  );
  return;
}
```

### 7. Crear Hook para Checkout Session

Crear un hook para facilitar la creación de checkout sessions:

```tsx
// src/hooks/useStripeCheckout.ts
export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async (params: {
      price: number; // en centavos
      description: string;
      connectedAccountId: string;
      origin: 'clase' | 'fecha';
      bookingId: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        'stripe-create-checkout-session',
        { body: params }
      );
      
      if (error) throw error;
      if (!data?.url) throw new Error('No se pudo crear la sesión de pago');
      
      // Redirigir a Stripe Checkout
      window.location.href = data.url;
    },
  });
}
```

## 🔍 Verificación

1. **Verificar columnas en BD:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('profiles_teacher', 'profiles_academy', 'profiles_organizer')
  AND column_name LIKE 'stripe%'
ORDER BY table_name, ordinal_position;
```

2. **Probar creación de cuenta:**
   - Ir a perfil de maestro/academia/organizador → Editar
   - Verificar que aparece la sección "Cobros con Stripe"
   - Hacer clic en "Conectar con Stripe"
   - Completar el onboarding

3. **Verificar webhook:**
   - En Stripe Dashboard → Webhooks → Ver logs
   - Debe recibir eventos `checkout.session.completed` y `account.updated`

## 📝 Notas Importantes

- **Modo Test vs Live:** Asegúrate de usar las claves correctas según el ambiente
- **Fee de plataforma:** Actualmente configurado en 15% (ajustable en `stripe-create-checkout-session`)
- **Moneda:** Configurada como MXN (pesos mexicanos)
- **RLS:** Las Edge Functions usan `SUPABASE_SERVICE_ROLE_KEY` para bypass RLS

## 🐛 Troubleshooting

### Error: "STRIPE_SECRET_KEY is not set"
- Verificar que la variable de entorno esté configurada en Supabase Edge Functions

### Error: "Webhook signature verification failed"
- Verificar que `STRIPE_WEBHOOK_SECRET` coincida con el secreto del webhook en Stripe Dashboard

### La cuenta no se actualiza después del onboarding
- Verificar que el webhook `account.updated` esté configurado
- Verificar que la función `stripe-webhook` esté desplegada correctamente

### No aparece la sección de Stripe en el editor
- Verificar que el usuario tenga el rol aprobado (maestro/academia/organizador)
- Verificar que `useMyApprovedRoles` esté funcionando correctamente

