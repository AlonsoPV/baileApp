# Google Sign-In (RN WebView + iOS/Android + Supabase) — Diagnóstico y checklist

## Resumen del flujo

1. **Web (WebView)** → Usuario toca "Continuar con Google" → `Login.tsx` detecta `isMobileWebView()` y envía `postMessage({ type: 'NATIVE_AUTH_GOOGLE', requestId })`.
2. **RN Host** → `WebAppScreen.tsx` recibe `onMessage`, llama `AuthCoordinator.signInWithGoogle(iosClientId, requestId, webClientId)`.
3. **iOS nativo** → `GoogleSignInModule.swift` lee `GIDClientID` y `GIDServerClientID` (de JS o de Info.plist), configura `GIDSignIn`, presenta UI, devuelve `idToken` + `rawNonce`.
4. **AuthCoordinator** → Intercambia con Supabase `signInWithIdToken({ provider: 'google', token: idToken, nonce })`.
5. **WebView** → Se inyecta sesión y se redirige a `/auth/callback`.

---

## Error: "Google Sign-In no está configurado. Contacta al soporte."

### Causa típica (root cause)

- **GOOGLE_MISSING_CLIENT_ID**: El módulo nativo no recibe ningún Client ID (ni desde JS ni desde Info.plist).
  - JS: `Constants.expoConfig?.extra?.googleIosClientId` (y fallbacks) vacíos.
  - iOS: `Info.plist` sin `GIDClientID` en el **target** que se está ejecutando, o build (EAS/Xcode Cloud) sin inyectar las env vars.

### Pasos para reproducir

1. Abrir la app en dispositivo/simulador iOS.
2. Navegar a la pantalla de login (WebView).
3. Tocar "Continuar con Google".
4. Si la config falla, se muestra el mensaje genérico o el mensaje accionable (tras el fix).

### Logs útiles (guardar en repro)

- **iOS (Xcode console)**  
  Buscar: `[GoogleSignInModule]`, `GIDClientID`, `GIDServerClientID`, `expectedScheme`, `schemeOK`, `GOOGLE_MISSING_CLIENT_ID`, `presentingViewController`, `plist GIDClientID=`, `MISSING`.

- **Android (adb logcat)**  
  ```bash
  adb logcat | grep -iE "GoogleSignIn|DEVELOPER_ERROR|12500|ApiException|sign_in_failed|SHA"
  ```
  Guardar el output; si aparece `DEVELOPER_ERROR` o `12500`, revisar SHA1/SHA256 y `google-services.json`.

- **JS (Metro / consola)**  
  Buscar: `[WebAppScreen] NATIVE_AUTH_GOOGLE`, `[AuthCoordinator] Google`, `assertGoogleAuthConfig`, `iosClientIdLen=0`, `webClientIdLen=0`.

---

## Fix aplicado (resumen)

1. **Info.plist (iOS)**  
   - Añadido `GIDServerClientID` con el Web Client ID por defecto (mismo que en Supabase / Google Cloud).  
   - Así el módulo nativo puede obtener el server client id aunque JS no lo pase (p. ej. builds sin `extra`).

2. **Self-check al iniciar auth**  
   - `assertGoogleAuthConfig()` en JS valida:
     - iOS: presencia de iOS Client ID (extra o nativo).
     - Opcional: Web Client ID para mensaje claro si falla Supabase por audience.
   - Si falla, se muestra un mensaje **accionable** (qué falta y dónde configurarlo).

3. **Mensajes de error accionables**  
   - Sustitución de "Contacta al soporte" por textos del tipo:
     - "Falta Google iOS Client ID. Configura EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID en .env y en las variables de entorno de EAS/Xcode Cloud."
     - "Falta el Web Client ID (GIDServerClientID). Añádelo a Info.plist o configura EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID."

4. **Logs (sin tokens)**  
   - Logs de longitud/máscara de client IDs, códigos de error (`GOOGLE_*`, `DEVELOPER_ERROR`), y en Android `statusCode`/`ApiException` para diagnosticar SHA1/SHA256.

---

## Checklist para que no vuelva a ocurrir

### iOS

- [ ] **Info.plist** (target DondeBailarMX):
  - [ ] `GIDClientID` = iOS Client ID (xxx.apps.googleusercontent.com).
  - [ ] `GIDServerClientID` = Web Client ID (el que está en Supabase Auth → Google).
  - [ ] `CFBundleURLTypes` → `CFBundleURLSchemes` incluye `com.googleusercontent.apps.<reversed_client_id>` (derivado del iOS Client ID).
- [ ] **Bundle ID** coincide con el configurado en Google Cloud Console (tipo iOS).
- [ ] **EAS / Xcode Cloud**: variables `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` y `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` definidas; `ci_post_clone.sh` / script de build las inyectan en el plist.
- [ ] **Local**: `config/local.env` o `.env` con las mismas variables para `npx expo prebuild` / desarrollo.

### Android

- [ ] **google-services.json** en `android/app/`, con `applicationId` igual al del build.
- [ ] **SHA-1 y SHA-256** (debug y release) registrados en Google Cloud para ese client.
- [ ] **build.gradle**: classpath de `google-services` y plugin `com.google.gms.google-services` aplicado.
- [ ] En caso de **DEVELOPER_ERROR / 12500**: revisar SHA1/SHA256 y que coincidan con los de la consola.

### Supabase

- [ ] Auth → Providers → Google habilitado.
- [ ] Client ID de Google en Supabase = **Web Client ID** (mismo que `GIDServerClientID` / `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`).
- [ ] `SUPABASE_URL` y `SUPABASE_ANON_KEY` (o `EXPO_PUBLIC_*`) correctos para el environment.

### Builds y entornos

- [ ] Mismo proyecto de Google Cloud para dev/staging/prod (o client IDs correctos por entorno).
- [ ] No mezclar iOS Client ID con Web Client ID (el nativo usa iOS; Supabase espera el Web en el token).

---

## Referencia rápida de códigos de error

| Código | Significado | Acción |
|--------|-------------|--------|
| GOOGLE_MISSING_CLIENT_ID | Falta iOS Client ID en JS o Info.plist | Configurar EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID y/o GIDClientID en plist |
| GOOGLE_MISSING_WEB_CLIENT_ID | Falta Web Client ID (GIDServerClientID) | Añadir a Info.plist o EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID |
| GOOGLE_MISSING_URL_SCHEME | Falta scheme com.googleusercontent.apps.* en Info.plist | Revisar CFBundleURLTypes en Info.plist |
| GOOGLE_NO_PRESENTING_VC | No se encuentra el ViewController para presentar Google | Cerrar y reabrir la app; revisar ventanas/escenas |
| GOOGLE_MISSING_ID_TOKEN | Google no devolvió idToken | Revisar GIDServerClientID y que el Client ID sea el de iOS |
| invalid_jwt / audience | Supabase rechaza el token (audience distinta) | Usar Web Client ID en Supabase y como GIDServerClientID |
| DEVELOPER_ERROR (Android) | Configuración de consola / SHA | Revisar SHA1/SHA256 y google-services.json |
