# Onboarding y Login (Magic Link + PIN)

Este documento describe el flujo de autenticación y onboarding de la app web: inicio de sesión por Magic Link (email), verificación mediante PIN de 4 dígitos y el guard de onboarding.

## Resumen
- Autenticación primaria: Magic Link (solo email).
- Segunda capa: PIN de 4 dígitos (solo en login y/o durante el onboarding).
- Onboarding Gate: restringe el acceso si el PIN no está verificado o si el onboarding no está completo.
- Persistencia y seguridad: `pin_hash` en `profiles_user`; hash/verify en frontend; RLS en Supabase.

## Páginas y componentes clave
- Pantallas
  - `/auth/login` → pantalla de Magic Link (solicita email únicamente). En el router se redirige a `/auth/pin` cuando corresponde.
  - `/auth/callback` → procesa la sesión de Supabase tras el Magic Link y marca `needsPinVerify`.
  - `/auth/pin` → Login con PIN (4 dígitos). Incluye “¿Olvidé mi PIN?”.
  - `/auth/pin/setup` → Configurar/actualizar PIN (requiere sesión).
- Guard
  - `OnboardingGate.tsx` → si `needsPinVerify === true` y `isPinVerified === false`, redirige a `/auth/pin`; también evita loops tras completar onboarding.

## Rutas relevantes
- `/auth/login` → Magic Link (email only).
- `/auth/callback` → `AuthCallback.tsx`.
- `/auth/pin` → `PinLogin.tsx`.
- `/auth/pin/setup` → `PinSetup.tsx`.
- Perfiles (ejemplos): `/profile`, `/profile/academy`, `/profile/teacher`.

## Flujo de autenticación
1. Usuario ingresa su email en `/auth/login`.
2. Recibe Magic Link; al abrirlo llega a `/auth/callback`.
3. `AuthCallback` establece `needsPinVerify = true` y navega a la app.
4. `OnboardingGate` detecta `needsPinVerify` y redirige a `/auth/pin`.
5. Usuario ingresa PIN correcto → `setPinVerified(true)` para la sesión actual.
6. Si no tiene PIN o lo olvidó → “¿Olvidé mi PIN?” → `/auth/pin/setup` (con sesión válida) o `/auth/login` si no hay sesión.

## PIN de 4 dígitos
- Persistencia en DB: columna `pin_hash` en `profiles_user`.
  - SQL: `apps/web/SCRIPT_21_ADD_PIN_HASH.sql`.
- Frontend utils: `apps/web/src/lib/pin.ts`
  - `hashPin(pin)`, `verifyPin(pin, hash)`.
  - `setPinVerified(bool)`, `isPinVerified()`, `setNeedsPinVerify(bool)`, `needsPinVerify()`.
- Pantallas
  - `PinSetup.tsx`: formulario de 4 dígitos (en `<form>`), guarda hash en DB, redirige.
  - `PinLogin.tsx`: formulario de 4 dígitos; incluye “¿Olvidé mi PIN?”.

## Onboarding
- Gate: `OnboardingGate.tsx` (protege rutas tras login).
  - Si requiere PIN y no verificado → `/auth/pin`.
  - Si el onboarding no está completo → redirige a pasos (ej. `PickZonas.tsx`).
- Evitar loops: `PickZonas.tsx` invalida `onboarding-status` y `profile/me`, y setea `onboarding_complete: true` en cache.

## Estados y cache (React Query)
- `queryClient`:
  - `staleTime = 5m`, `retry = 1`, sin refetch en focus/reconnect/mount.
- Algunas pantallas invalidan queries críticas (roles, perfil) para evitar datos obsoletos.

## Errores comunes
- “No auth” en `/auth/pin/setup`: requiere sesión. Solución: volver a `/auth/login` y firmarse.
- Placeholders de imagen rotos: normalizados con `Avatar` y `avatarFromName`.
- Redirecciones que se repiten: revisar `OnboardingGate`, `AuthCallback` y `onboarding_complete` en cache.

## Seguridad
- El PIN nunca se guarda en texto plano; se almacena `pin_hash`.
- Verificación local con `verifyPin` usando el hash del perfil.
- RLS limita acceso/updates a dueños autenticados.

## Pruebas rápidas
1. Login con email → Magic Link → `/auth/callback` sin errores.
2. Gate redirige a `/auth/pin` si no está verificado.
3. Ingresar PIN correcto → acceso normal a `/profile`.
4. “¿Olvidé mi PIN?”: sin sesión → `/auth/login`; con sesión → `/auth/pin/setup`.
5. Completar onboarding (ej. zonas) sin loops.

## Archivos de referencia
- Pantallas: `apps/web/src/screens/auth/Login.tsx`, `AuthCallback.tsx`, `PinLogin.tsx`, `PinSetup.tsx`.
- Guard: `apps/web/src/guards/OnboardingGate.tsx`.
- Utilidades PIN: `apps/web/src/lib/pin.ts`.
- SQL PIN: `apps/web/SCRIPT_21_ADD_PIN_HASH.sql`.
- Onboarding: `apps/web/src/screens/onboarding/PickZonas.tsx`.

> Mantén este documento alineado con cambios futuros en router y guardas.
