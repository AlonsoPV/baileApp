# Instrucción para Cursor — Flujo Magic Link ➜ Configurar NIP ➜ Acceso con NIP

## 0) Objetivo
- Registro / primer acceso: siempre vía Magic Link.
- Post-registro: obligar a Configurar NIP (4 dígitos) antes de entrar a la app.
- Accesos posteriores: si hay sesión válida (refresh token) ➜ pedir NIP como 2FA rápida y entrar. Si la sesión expiró totalmente, por seguridad se requiere de nuevo Magic Link.

---

## 1) DB y perfil
### 1.1. Columna de PIN (si no existe)
Archivo: `apps/web/SCRIPT_21_ADD_PIN_HASH.sql`

```sql
alter table profiles_user
  add column if not exists pin_hash text;

-- Índice opcional
create index if not exists profiles_user_pin_hash_idx on profiles_user (pin_hash);
```

### 1.2. Vista auxiliar (presencia de PIN)
```sql
create or replace view profiles_user_light as
select
  user_id,
  (pin_hash is not null and length(pin_hash) > 0) as has_pin
from profiles_user;
```

Asegura RLS para que cada usuario solo pueda ver su fila en `profiles_user_light` (por `auth.uid()`).

---

## 2) Utils de PIN (verificar valores de retorno)
Archivo: `apps/web/src/lib/pin.ts`

- `hashPin(pin)`, `verifyPin(pin, hash)`
- `setNeedsPinVerify(boolean)`, `needsPinVerify()`
- `setPinVerified(boolean)`, `isPinVerified()`

Asegúrate de:
- `setNeedsPinVerify(true)` tras callback de Magic Link si el usuario no tiene PIN.
- `setPinVerified(false)` por defecto hasta que ingrese un NIP válido en la sesión actual.

---

## 3) Router y guardias
### 3.1. `/auth/login` (Magic Link, email only)
- SIN contraseña ni NIP aquí.
- Tras enviar el Magic Link, mostrar confirmación.

### 3.2. `/auth/callback` (`AuthCallback.tsx`)
Patch (fragmento):

```ts
// apps/web/src/screens/auth/AuthCallback.tsx
import { setNeedsPinVerify } from '@/lib/pin';

// ... dentro de tu efecto/handler de callback
const { data: light } = await supabase
  .from('profiles_user_light')
  .select('has_pin')
  .eq('user_id', session.user.id)
  .maybeSingle();

setNeedsPinVerify(true);

if (!light?.has_pin) {
  navigate('/auth/pin/setup', { replace: true });
} else {
  navigate('/app/profile', { replace: true });
}
```

### 3.3. `OnboardingGate.tsx`
Regla:
- Si `needsPinVerify() === true` y `isPinVerified() === false` ➜ redirige a `/auth/pin`.
- Cuando el usuario ingrese un NIP correcto en `/auth/pin`, llama `setPinVerified(true)` y deja pasar.

---

## 4) Pantallas de NIP
### 4.1. `PinSetup.tsx` (obligatorio tras el primer acceso por Magic Link)
Patch (flujo):

```ts
// tras guardar hash ok
setNeedsPinVerify(true);
setPinVerified(false);
navigate('/auth/pin', { replace: true });
```

- Si usuario no autenticado ➜ redirige a `/auth/login`.
- Guarda `pin_hash` y luego exige validar en `/auth/pin` (coherencia del flujo).

### 4.2. `PinLogin.tsx` (NIP de 4 dígitos)
- Cargar `pin_hash` del perfil; si no hay ➜ CTA: “Configura tu NIP” ➜ `/auth/pin/setup`.
- Al validar correctamente:
  - `setPinVerified(true)`
  - Redirigir a `/app/profile` o a la ruta protegida original.
- Reestablecer NIP en la misma pantalla (si ya hay sesión):
  - Botón “Olvidé mi NIP / Crear uno nuevo”:
    - Si hay sesión ➜ `/auth/pin/setup`.
    - Si no hay sesión ➜ `/auth/login` (Magic Link) y luego `/auth/pin/setup`.

---

## 5) Flujo final (resumen)
### Registro / primer acceso
1. Usuario mete email en `/auth/login` ➜ recibe Magic Link ➜ entra a `/auth/callback`.
2. Si no tiene PIN ➜ `/auth/pin/setup` para crearlo.
3. Tras crearlo ➜ `/auth/pin` para verificar.

### Accesos posteriores (misma sesión/refresh token válido)
1. Entra a la app ➜ `OnboardingGate` ve `needsPinVerify === true` e `isPinVerified === false` ➜ `/auth/pin`.
2. Mete NIP correcto ➜ `setPinVerified(true)` ➜ acceso.

### Si la sesión expiró completamente
- Por limitaciones de Supabase Auth, no es posible crear sesión solo con NIP desde el cliente.
- Se usa de nuevo Magic Link (email only) y luego NIP como 2FA.

---

## 6) Ajustes menores en UI (consistencia)
- `/auth/login`: “Recibirás un Magic Link. Al entrar configurarás tu NIP para accesos rápidos.”
- `/auth/pin`: placeholder numérico (oculto), 4 dígitos. Link “Olvidé mi NIP”.
- `/auth/pin/setup`: validación `^\d{4}$`, confirmación y feedback claros.

---

## 7) (Opcional) Mejora UX “recordar dispositivo”
- Tras NIP correcto, guardar un flag duradero (ej. `localStorage['trusted_device']=true`, cifrado) para no exigir NIP por X días en ese dispositivo (salvo logout).
- Agregar “Olvidar este dispositivo” en perfil.

---

## 8) Nota de seguridad y alcance
- No es seguro ni factible (sin backend o Edge Function con service role y fuerte rate-limit) crear sesión online con solo email+PIN desde el cliente.
- Diseño recomendado (implementado): Magic Link para sesión y NIP como 2FA para accesos rápidos bajo sesión válida/renovable.
- Para “login solo con NIP”, se requeriría una Edge Function con Service Role, reCAPTCHA, rate-limit, y emitir sesión vía Admin API (backend adicional y más responsabilidad de seguridad).

---

## Archivos implicados en este repo
- Router: `apps/web/src/AppRouter.tsx` y/o `apps/web/src/router.tsx`.
- Guard: `apps/web/src/guards/OnboardingGate.tsx`.
- Auth: `apps/web/src/screens/auth/Login.tsx`, `AuthCallback.tsx`, `PinLogin.tsx`, `PinSetup.tsx`.
- Utils: `apps/web/src/lib/pin.ts`.
- SQL: `apps/web/SCRIPT_21_ADD_PIN_HASH.sql`.

> Mantén este documento alineado con el router, guards y pantallas cuando realices cambios.
