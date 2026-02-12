# Google Sign-In App Debug — Diagnóstico End-to-End

## Resumen

Este documento describe el proceso de diagnóstico para identificar dónde falla el login con Google cuando funciona en navegador pero no en la app (React Native Host + WebView + iOS/Android).

**Regla fundamental:** NO hacer cambios "por intuición". Primero aislar dónde se rompe, luego aplicar cambios mínimos.

---

## FASE 1 — Repro + Telemetría Obligatoria

### 1. Identificar plataforma exacta donde falla

**Confirmar:**
- ¿Falla en iOS, en Android o en ambos?
- ¿Falla en dev build, TestFlight/Release, o ambos?

> **Si solo falla en release:** priorizar diferencias de build/env/plist/schemes.
> **Si solo falla en app pero no en web:** priorizar bridge y nativo.

### 2. Activar logs end-to-end

**Flag único:** `BAILEAPP_AUTH_DEBUG=1`

#### Configuración del flag:

**En desarrollo (automático):**
- Los logs están activos por defecto en `__DEV__ === true`

**En producción (TestFlight/Release):**
- **iOS:** Añadir `BAILEAPP_AUTH_DEBUG=1` en `Info.plist` o en variables de entorno de EAS/Xcode Cloud
- **Web:** Añadir `BAILEAPP_AUTH_DEBUG=1` en `process.env` o `window.BAILEAPP_AUTH_DEBUG`

#### Logs estructurados por capa:

##### 2.1 Web (dentro del WebView)
**Archivo:** `apps/web/src/screens/auth/Login.tsx`

**Logs esperados:**
```
[WEB] click Google
[WEB] postMessage NATIVE_AUTH_GOOGLE payload={ type: 'NATIVE_AUTH_GOOGLE', requestId: '...' }
```

**Ubicación:** En `handleGoogleAuth()` cuando se detecta `isMobileWebView()` y se llama a `postMessage`.

##### 2.2 RN Host (WebView onMessage)
**Archivo:** `src/screens/WebAppScreen.tsx`

**Logs esperados:**
```
[HOST] onMessage raw=... (rawLength, rawPreview)
[HOST] action=NATIVE_AUTH_GOOGLE requestId=... platform=ios
[HOST] calling native GoogleSignIn requestId=... iosClientId=... webClientId=...
```

**Ubicación:** En `handleWebMessage()` cuando se recibe y parsea el mensaje, y antes de llamar a `AuthCoordinator.signInWithGoogle()`.

##### 2.3 Módulo nativo iOS/Android
**Archivo:** `ios/DondeBailarMX/GoogleSignInModule.swift`

**Logs esperados:**
```
[NATIVE] signIn start requestId=...
[NATIVE] config bundleId=... clientIdSource=passed|plist clientId=... serverClientId=... schemeOK=true|false
[NATIVE] success token length=... requestId=...
[NATIVE] error code=... domain=... message=... requestId=...
```

**Ubicación:** 
- Al inicio de `signIn()`
- Después de resolver configuración (clientId, serverClientId, scheme)
- En éxito: antes de resolver con token
- En error: antes de rechazar

##### 2.4 Supabase exchange
**Archivo:** `src/auth/AuthCoordinator.ts`

**Logs esperados:**
```
[AUTH] signInWithIdToken start provider=google requestId=... hasNonce=true|false tokenLength=...
[AUTH] signInWithIdToken success requestId=... hasSession=true userId=...
[AUTH] signInWithIdToken error requestId=... name=... message=... status=...
```

**Ubicación:** En `callSupabase()` dentro de `signInWithGoogle()`, antes y después de llamar a `supabase.auth.signInWithIdToken()`.

---

## FASE 2 — Aislar el punto exacto de falla (árbol de decisión)

### Caso A) NO llega el mensaje del WebView al host

**Síntoma:**
- Ves logs `[WEB]` pero NO ves `[HOST] onMessage`

**Acciones de diagnóstico:**

1. **Validar que el WebView tiene `onMessage` realmente conectado:**
   ```typescript
   // En WebAppScreen.tsx, verificar:
   <WebView
     onMessage={handleWebMessage}
     // ...
   />
   ```

2. **Validar que el web está posteando al bridge correcto:**
   ```typescript
   // En Login.tsx, verificar:
   window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'NATIVE_AUTH_GOOGLE', requestId }))
   ```

3. **Validar que el mensaje no se filtra por algún wrapper:**
   - Verificar que no hay middleware que intercepte `postMessage`
   - Verificar que el WebView no tiene políticas de seguridad que bloqueen mensajes

4. **Confirmar que el click en app dispara el mismo código que en browser:**
   - A veces en app usan ruta distinta o hay condicionales que cambian el flujo

**Fix mínimo:**
- Corregir `postMessage` o `onMessage` wiring
- Verificar que `window.ReactNativeWebView` existe en runtime

---

### Caso B) Llega al host pero NO llama/NO resuelve el nativo

**Síntoma:**
- Ves `[HOST] action=NATIVE_AUTH_GOOGLE` pero no ves `[NATIVE] signIn start`

**Acciones de diagnóstico:**

1. **Confirmar import/linking del NativeModule (iOS + Android):**
   ```typescript
   // En nativeAuth.ts, verificar:
   const { GoogleSignInModule } = NativeModules as any;
   console.log('[HOST] NativeModules.GoogleSignInModule =', GoogleSignInModule);
   ```

2. **Confirmar que no hay try/catch silencioso:**
   - Revisar `AuthCoordinator.signInWithGoogle()` y `nativeSignInWithGoogleWithRequestId()`
   - Verificar que los errores se propagan correctamente

3. **Loggear existencia del módulo:**
   ```typescript
   logHost("NativeModules.GoogleSignInModule exists", { 
     exists: !!GoogleSignInModule,
     hasSignIn: !!GoogleSignInModule?.signIn 
   });
   ```

**Fix mínimo:**
- Corregir el binding o nombre del módulo
- Verificar que el módulo nativo está correctamente vinculado en iOS/Android

---

### Caso C) El nativo inicia pero falla con "not configured / missing client id / scheme"

**Síntoma:**
- Ves `[NATIVE] signIn start` y luego error de configuración

**Acciones iOS (en runtime, NO solo repo):**

1. **Log de configuración en runtime:**
   ```
   [NATIVE] config bundleId=... clientIdSource=passed|plist clientId=... serverClientId=... schemeOK=true|false
   ```

2. **Validar en runtime:**
   - `Bundle.main.bundleIdentifier` (debe coincidir con el Client ID configurado en Google Console)
   - `GIDClientID` presente en Info.plist (solo prefijo en logs)
   - `CFBundleURLSchemes` contiene `com.googleusercontent.apps.<id>`

3. **Confirmar que `application(_:open:options:)` se ejecuta cuando vuelve Google:**
   ```swift
   // En AppDelegate.swift, verificar:
   func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
     if GIDSignIn.sharedInstance.handle(url) {
       return true
     }
     // ...
   }
   ```

**Validación crítica:**
- El `Info.plist` que importa es el del build final (no el del repo)
- Si `GIDClientID` está vacío en runtime -> el build final no trae el valor (scripts/env no aplicaron)

**Fix mínimo:**
- Asegurar `GIDClientID` y scheme en el `Info.plist` final (Release/TestFlight)
- Si ya existe, entonces el error no es "config", es otra cosa (ver Caso D)

---

### Caso D) Nativo entrega token pero Supabase falla (web sí funciona)

**Síntoma:**
- `[NATIVE] success token length=...`
- `[AUTH] signInWithIdToken error ...`

**Acciones:**

1. **Comparar tokens:**
   - **En web:** qué token usas (id_token) y su audience/client id
   - **En app:** idToken viene de iOS client id, pero Supabase a veces espera audiencia del Web client id

2. **Confirmar que `GIDServerClientID` (web client id) está bien configurado:**
   ```swift
   // En GoogleSignInModule.swift:
   let config = GIDConfiguration(
     clientID: effectiveClientId,           // iOS Client ID
     serverClientID: serverClientId         // Web Client ID (para audience del idToken)
   )
   ```

3. **Loggear qué `serverClientID` está resolviendo:**
   ```
   [NATIVE] config ... serverClientId=present(...) o MISSING
   ```

4. **Verificar el audience del token:**
   - Decodificar el JWT del idToken y verificar que `aud` coincide con el Web Client ID configurado en Supabase

**Fix mínimo:**
- Ajustar `serverClientID` correcto (Web Client ID)
- Asegurar que Supabase Google provider esté configurado para aceptar ese flujo

---

## FASE 3 — Verificación "browser vs app" (diferencias típicas)

Validar estas 4 diferencias (son las más comunes cuando web funciona y app no):

### 1) Bridge
- **Browser:** no existe `window.ReactNativeWebView`; usa OAuth web normal
- **App:** existe `window.ReactNativeWebView`; debe usar `postMessage`
- **Problema común:** el botón en app toma otra rama o el bridge no está disponible

### 2) Client IDs
- **Web:** usa Web Client ID directamente
- **App:** usa iOS/Android client + `serverClientID` (Web Client ID)
- **Problema común:** falta `serverClientID` o está mal -> Supabase falla con `invalid_jwt`

### 3) Redirect/URL handling
- **Web:** OAuth redirect funciona automáticamente
- **App:** depende de URL schemes y `openURL` en AppDelegate
- **Problema común:** scheme no configurado o `handle(url)` no implementado

### 4) Build env
- **TestFlight/Release:** puede perder env/plist injection aunque en debug sí
- **Problema común:** variables de entorno no se inyectan en build final

---

## Ejemplo de logs completos (flujo exitoso)

```
[WEB] click Google
[WEB] postMessage NATIVE_AUTH_GOOGLE payload={ type: 'NATIVE_AUTH_GOOGLE', requestId: 'abc123' }
[HOST] onMessage raw=... (rawLength: 50, rawPreview: '{"type":"NATIVE_AUTH_GOOGLE","requestId":"abc123"}')
[HOST] action=NATIVE_AUTH_GOOGLE requestId=abc123 platform=ios
[HOST] calling native GoogleSignIn requestId=abc123 iosClientId=168... webClientId=168...
[NATIVE] signIn start requestId=abc123
[NATIVE] config bundleId=com.dondebailarmx clientIdSource=passed clientId=168... serverClientId=present(168...) schemeOK=true
[NATIVE] success token length=1234 requestId=abc123
[AUTH] signInWithIdToken start provider=google requestId=abc123 hasNonce=true tokenLength=1234
[AUTH] signInWithIdToken success requestId=abc123 hasSession=true userId=...
```

---

## Ejemplo de logs con falla (Caso D)

```
[WEB] click Google
[WEB] postMessage NATIVE_AUTH_GOOGLE payload={ type: 'NATIVE_AUTH_GOOGLE', requestId: 'xyz789' }
[HOST] onMessage raw=...
[HOST] action=NATIVE_AUTH_GOOGLE requestId=xyz789 platform=ios
[HOST] calling native GoogleSignIn requestId=xyz789 iosClientId=168... webClientId=(empty)
[NATIVE] signIn start requestId=xyz789
[NATIVE] config bundleId=com.dondebailarmx clientIdSource=passed clientId=168... serverClientId=MISSING schemeOK=true
[NATIVE] success token length=1234 requestId=xyz789
[AUTH] signInWithIdToken start provider=google requestId=xyz789 hasNonce=true tokenLength=1234
[AUTH] signInWithIdToken error requestId=xyz789 name=AuthApiError message=invalid_jwt status=400
```

**Diagnóstico:** `serverClientId=MISSING` -> el idToken tiene audience del iOS Client ID, pero Supabase espera Web Client ID.

**Fix:** Configurar `GIDServerClientID` (Web Client ID) en Info.plist o en variables de entorno.

---

## Checklist de verificación rápida

- [ ] ¿Los logs `[WEB]` aparecen? → Si no, el click no está disparando el código correcto
- [ ] ¿Los logs `[HOST]` aparecen? → Si no, el bridge WebView no está funcionando
- [ ] ¿Los logs `[NATIVE]` aparecen? → Si no, el módulo nativo no está vinculado
- [ ] ¿`[NATIVE] config` muestra `schemeOK=true`? → Si no, falta URL scheme en Info.plist
- [ ] ¿`[NATIVE] config` muestra `serverClientId=present(...)`? → Si no, falta GIDServerClientID
- [ ] ¿`[AUTH] signInWithIdToken error` muestra `invalid_jwt`? → Verificar audience del token vs Web Client ID configurado en Supabase

---

## Próximos pasos después del diagnóstico

1. **Documentar el punto exacto de falla** (A/B/C/D)
2. **Aplicar fix mínimo** según el caso identificado
3. **Verificar** que los logs muestran el flujo completo exitoso
4. **Probar en Release/TestFlight** si el problema era específico de producción
