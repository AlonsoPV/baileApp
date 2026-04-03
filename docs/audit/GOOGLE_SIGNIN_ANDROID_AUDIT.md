# Google Sign-In Android Audit

## Objective

Document the current Google Sign-In implementation by platform (flow, config, and callback), and record the verified Android root cause and fix direction without changing iOS native behavior.

## Source Files Reviewed

- `apps/web/src/screens/auth/Login.tsx`
- `apps/web/src/utils/authRedirect.ts`
- `apps/web/src/utils/authProviderAvailability.ts`
- `src/screens/WebAppScreen.tsx`
- `src/auth/assertGoogleAuthConfig.ts`

## Provider Availability Matrix (UI)

- Google: enabled on iOS + Android + other web platforms.
- Apple: enabled only on iOS, hidden on Android/other.
- Source of truth: `apps/web/src/utils/authProviderAvailability.ts`.

## Platform Flow, Configuration, and Callback

### iOS (React Native WebView host + native Google SDK)

**Login flow**

1. User taps "Continuar con Google" in web login UI.
2. `handleGoogleAuth()` detects WebView and platform `ios`.
3. Web sends bridge message `{ type: "NATIVE_AUTH_GOOGLE", requestId }`.
4. Native host (`WebAppScreen`) receives message and calls `AuthCoordinator.signInWithGoogle(...)`.
5. Native obtains Google tokens and injects web session with `window.__BAILEAPP_SET_SUPABASE_SESSION(...)`.

**Configuration in use**

- Runtime config read by host:
  - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- iOS native fallback accepted via Info.plist when JS env values are missing:
  - `GIDClientID`
  - `GIDServerClientID`
- Guardrails:
  - `assertGoogleAuthConfig()` warns if JS values are missing on iOS (does not hard-fail because Info.plist fallback is valid).
  - Throws if iOS Client ID and Web Client ID are equal.

**Callback/session handling**

- Main completion path is token bridge + session injection (no browser OAuth callback required for success path).
- Deep link callback mapping is still supported by host:
  - `dondebailarmx://auth/callback?...` -> `https://dondebailar.com.mx/auth/callback?...`
  - Implemented in `mapIncomingUrlToWebUrl()` in `WebAppScreen`.

### Android (React Native WebView host + web OAuth path)

**Login flow**

1. User taps "Continuar con Google" in web login UI.
2. `handleGoogleAuth()` detects WebView and platform `android`.
3. Android does **not** send `NATIVE_AUTH_GOOGLE`; it proceeds with web OAuth:
   - `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: "https://dondebailar.com.mx/auth/callback" } })`.
4. Host WebView allows Google/Supabase OAuth URLs on Android (`onShouldStartLoadWithRequest` returns `true` for OAuth URLs).

**Configuration in use**

- OAuth redirect for Google in Android WebView uses branded callback:
  - `https://dondebailar.com.mx/auth/callback`.
- Android native Google SDK config is not required for this flow (native Android Google path is not used).
- `assertGoogleAuthConfig()` has Android branch reserved for future native implementation; currently no hard validation for Android-native Google.

**Callback/session handling**

- OAuth provider redirects to app deep link:
  - `dondebailarmx://auth/callback?...`
- Host maps deep link to web callback route and keeps flow inside WebView:
  - `https://dondebailar.com.mx/auth/callback?...`
- Web/Supabase callback route finalizes session as standard OAuth callback flow.

### Web Browser (no React Native host)

**Login flow**

1. User taps "Continuar con Google".
2. No native bridge is used.
3. Web calls `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: getAuthRedirectUrl() } })`.

**Configuration in use**

- `getAuthRedirectUrl()` resolves to `https://<site>/auth/callback`.
- `assertGoogleAuthConfig()` requires web client ID on web platform:
  - hard-fails if `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is missing.

**Callback/session handling**

- Browser returns to `https://<site>/auth/callback`.
- Web callback route completes Supabase session.

## Verified Android Root Cause (historical)

The failure came from platform routing mismatch:

1. Web login previously posted `NATIVE_AUTH_GOOGLE` for any mobile WebView with bridge.
2. Android host accepted that message and tried native Google.
3. Native Google implementation is intentionally iOS-only in this version.
4. Result: Android users saw behavior/messages suggesting Google was "iOS-only".

## Implemented Direction (safe default)

- Keep iOS native Google flow unchanged.
- Route Android WebView Google to web OAuth (already supported by host navigation policy).
- Keep Apple provider iOS-only in UI.
- Maintain deep link callback mapping through `dondebailarmx://auth/callback` -> web `/auth/callback`.

## Validation Checklist

- iOS: Google visible, native flow works, no regression in session injection.
- Android: Google visible, web OAuth runs in WebView, no iOS-only Google messaging.
- Android: Apple hidden.
- Callback: deep link and web callback complete session on both app platforms.
