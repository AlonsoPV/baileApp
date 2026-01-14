# Guideline 4.0 — Login/Registro in-app (iOS / iPad)

## Objetivo

Evitar que el login/registro abra el navegador por defecto. En iOS el flujo debe ocurrir **in-app**:

- **Apple**: `AuthenticationServices` (`ASAuthorizationController`)
- **Google**: SDK oficial `GoogleSignIn` (presentación sobre el top-most VC; iPad-safe)

La web (`apps/web`) corre dentro de un `react-native-webview` y pide a la app nativa iniciar sesión vía `postMessage`.

---

## Configuración iOS requerida

### 1) Capability: Sign in with Apple

- Archivo: `ios/DondeBailarMX/DondeBailarMX.entitlements`
- Debe contener:
  - `com.apple.developer.applesignin = ["Default"]`

En Xcode: Target → **Signing & Capabilities** → agregar **Sign In with Apple** (si Xcode no lo refleja automáticamente).

### 2) Google Sign-In (Client ID + URL scheme)

- Variable requerida en runtime Expo:
  - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- URL scheme callback requerido en `Info.plist`:
  - `GOOGLE_REVERSED_CLIENT_ID`

Archivos involucrados:
- `app.config.ts` (expone `extra.googleIosClientId`)
- `ios/DondeBailarMX/Info.plist` (tiene `$(GOOGLE_REVERSED_CLIENT_ID)` en `CFBundleURLSchemes`)
- `ios/DondeBailarMX/AppDelegate.swift` (maneja callback con `GIDSignIn.sharedInstance.handle(url)`)

---

## Flujo end-to-end (en la app)

1. Usuario entra a `/auth/login` dentro del WebView.
2. Toca **Continuar con Apple** o **Continuar con Google** (UI web).
3. La web detecta WebView (`isMobileWebView()`) y manda:
   - `window.ReactNativeWebView.postMessage({ type: "NATIVE_AUTH_APPLE" | "NATIVE_AUTH_GOOGLE" })`
4. `src/screens/WebAppScreen.tsx` recibe `onMessage` y llama:
   - `AuthCoordinator.signInWithApple()` o `AuthCoordinator.signInWithGoogle()`
5. La app obtiene un `idToken` nativo (Apple/Google) y lo intercambia en Supabase con:
   - `supabase.auth.signInWithIdToken(...)`
6. La app inyecta tokens al WebView:
   - `window.__BAILEAPP_SET_SUPABASE_SESSION({ access_token, refresh_token })`
7. La web hace `supabase.auth.setSession(...)` y navega a `/auth/callback`.

---

## Checklist manual de verificación

### A) iPad (principal)
- [ ] Abrir la app en iPad.
- [ ] Ir a Login (`/auth/login`).
- [ ] Tap **Continuar con Apple**:
  - [ ] No se abre Safari.
  - [ ] Se presenta el sheet/modal nativo de Apple.
  - [ ] Al completar, regresa a la app y termina en `/auth/callback` → `/explore` o onboarding.
- [ ] Tap **Continuar con Google**:
  - [ ] No se abre Safari.
  - [ ] Se presenta UI de Google correctamente centrada (sin “blank popover”).
  - [ ] Al completar, regresa a la app y termina en `/auth/callback`.

### B) Errores (sin crash, sin spinner infinito)
- [ ] Cancelar Apple → muestra error en-app y permite reintentar.
- [ ] Cancelar Google → muestra error en-app y permite reintentar.
- [ ] Config faltante (`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` vacío) → error visible (no crash).

### C) Logout
- [ ] Cerrar sesión desde la web (perfil/settings):
  - [ ] La web borra sesión (UI logged out).
  - [ ] La app nativa recibe `NATIVE_SIGN_OUT` y limpia sesión del SDK de Google (best-effort).

---

## Dónde probar

- **Simulador iOS**: útil para flujo general (Apple/Google pueden tener limitaciones).
- **Dispositivo real iPhone**: validación completa.
- **iPad real**: validación de presentación (top-most VC) + guideline 4.0.

