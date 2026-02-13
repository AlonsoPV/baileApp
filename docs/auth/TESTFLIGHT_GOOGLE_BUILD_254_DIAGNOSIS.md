# Diagnóstico y correcciones: Google Sign-In en builds 254/255 (TestFlight)

## Resumen

Google Sign-In funcionaba en build 253 y fallaba en 254/255 con "Google no configurado" / NETWORK_ERROR. Los cambios aplicados aseguran configuración consistente, logs en Release y limpieza opcional al cambiar de build (keychain).

---

## A) Archivos revisados y cambios aplicados (estilo diff)

### 1. `ios/DondeBailarMX/Info.plist`
- **Añadido:** `LSApplicationQueriesSchemes` con `google` y `com-google` para que `canOpenURL` y el flujo de Google funcionen correctamente en iOS.
```xml
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>google</string>
  <string>com-google</string>
</array>
```

### 2. `ios/DondeBailarMX/GoogleSignInModule.swift`
- **Añadido:** Log **siempre en Release** al inicio de `signIn` (sin depender de `shouldLog()`), con:
  - `bundleId`, `build` (CFBundleVersion)
  - `GIDClientID_plist`: "MISSING" o "present(primeros 18 chars...)"
  - `GIDServer_plist`: "MISSING" o "present"
  - `effectiveClientId`: "empty" o "present"
  - `expectedScheme` y `schemeOK`
- **Refactor:** Cálculo de `effectiveClientId`, `expectedScheme`, `schemeOK`, `bundleId` al inicio del método para usarlos en el log y en el resto del flujo; eliminada duplicación posterior.

### 3. `ios/DondeBailarMX.xcodeproj/project.pbxproj` (Run Script Google Sign-In)
- **Inicio del script:** Si el plist construido no existe (`$PLIST`), se hace `exit 0` con mensaje de advertencia para no fallar ni sobrescribir nada.
- **Final del script:** Verificación y log del valor final de `GIDClientID` en el plist construido:  
  `echo "📌 [GoogleSignIn] Built plist GIDClientID: ${VERIFIED_GID:-MISSING}"`  
  Así en los logs de Xcode Cloud / EAS se ve si el build inyectó bien el client ID.

### 4. `App.tsx`
- **Health check Supabase:** El botón "Health check Supabase" ahora usa `GET ${SUPABASE_URL}/rest/v1/` con headers `apikey` y `Authorization: Bearer <anon_key>`, muestra `status` y un preview del body (200 confirma conectividad con anon key).
- **Limpieza al cambiar de build:** `useEffect` que:
  - Lee `currentBuild` de `Constants.expoConfig?.ios?.buildNumber` (o `Constants.manifest?.ios?.buildNumber`).
  - Lee `lastBuild` de AsyncStorage (`@baileapp/last_build`).
  - Si `lastBuild !== ""` y `lastBuild !== currentBuild`, llama a `AuthCoordinator.signOut()` y luego guarda `currentBuild` en AsyncStorage.
  - Comentario en código explicando que TestFlight puede preservar tokens en Keychain al actualizar; el signOut evita estado inconsistente entre builds.

### 5. Imports añadidos en `App.tsx`
- `AsyncStorage` desde `@react-native-async-storage/async-storage`
- `AuthCoordinator` desde `./src/auth/AuthCoordinator`

---

## B) Checklist para verificar en Apple / TestFlight / Google Cloud

- [ ] **Bundle ID** en Xcode y en App Store Connect coincide con el de Google Cloud Console (iOS client): `com.tuorg.dondebailarmx`.
- [ ] **Google Cloud Console (iOS):** El cliente OAuth 2.0 tipo "iOS" tiene el bundle ID anterior y el reversed client ID (URL scheme) es `com.googleusercontent.apps.168113490186-xxxx` (el que está en Info.plist).
- [ ] **Info.plist (fuente):** Contiene `GIDClientID` (iOS client ID) y `GIDServerClientID` (Web client ID). No eliminar ni dejar vacíos.
- [ ] **CFBundleURLTypes:** Incluye un ítem con `CFBundleURLSchemes` que contiene el reversed client id (`com.googleusercontent.apps.168113490186-...`).
- [ ] **LSApplicationQueriesSchemes:** Incluye `google` y `com-google` (ya añadido en este fix).
- [ ] **Xcode Cloud / EAS:** Variables de entorno definidas para el perfil Release:
  - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` = iOS client ID completo (*.apps.googleusercontent.com)
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` = Web client ID (mismo proyecto, cliente tipo Web)
- [ ] **Run Script "Google Sign-In":** En los logs del build debe aparecer `✅ [GoogleSignIn] iOS client id present` y `📌 [GoogleSignIn] Built plist GIDClientID: <valor no vacío>`.
- [ ] **Signing:** Mismo Team y provisioning en Debug y Release; no usar bundle id distinto entre perfiles.

---

## C) Plan de pruebas

1. **Clean install (build 256 o el siguiente)**  
   - Borrar la app del dispositivo.  
   - Instalar solo el nuevo build desde TestFlight.  
   - Abrir la app, intentar Google Sign-In.  
   - Esperado: login correcto y en consola el log `[GoogleSignInModule] Release: ... GIDClientID_plist=present ... schemeOK=true`.

2. **Upgrade 253 → 256 (sin borrar app)**  
   - Tener instalado build 253 y haber iniciado sesión con Google.  
   - Actualizar a 256 desde TestFlight (no desinstalar).  
   - Abrir la app: el efecto de cambio de build debe hacer signOut automático.  
   - Intentar Google Sign-In de nuevo.  
   - Esperado: login correcto (sin depender de keychain del build anterior).

3. **Reinstall después de 254/255**  
   - Instalar 254 o 255, reproducir el fallo.  
   - Desinstalar la app.  
   - Instalar de nuevo el mismo build (o 256).  
   - Esperado: login correcto (keychain limpio).

4. **Health check en TestFlight**  
   - Con `SHOW_CONFIG_DEBUG=1` (o equivalente), mostrar el overlay y pulsar "Health check Supabase".  
   - Esperado: `status: 200` y body con respuesta de PostgREST (conectividad con anon key).

---

## D) Logs exactos a buscar en consola del iPhone (Console.app)

- **Al pulsar "Iniciar con Google" (siempre en Release):**  
  `[GoogleSignInModule] Release: bundleId=com.tuorg.dondebailarmx build=<número> GIDClientID_plist=present(168113490186-...) GIDServer_plist=present effectiveClientId=present expectedScheme=com.googleusercontent.apps.168113490186-... schemeOK=true`

- Si falla por configuración:  
  `GIDClientID_plist=MISSING` o `schemeOK=false` → revisar Info.plist y Run Script en el build.

- En logs de **build (Xcode Cloud / EAS):**  
  `📌 [GoogleSignIn] Built plist GIDClientID: 168113490186-xxxx.apps.googleusercontent.com`  
  Si aparece `MISSING`, el script no inyectó el client ID (revisar env vars y que el plist exista en esa fase).

---

## Referencias

- `docs/auth/TESTFLIGHT_GOOGLE_INVALID_JWT.md` — Web Client ID y Supabase.
- `docs/auth/ios-google-signin-config.md` — Configuración nativa iOS (si existe).
- Run Script en `ios/DondeBailarMX.xcodeproj`: fase "Google Sign-In" (o nombre equivalente).
