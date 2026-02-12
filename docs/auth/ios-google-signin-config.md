# Configuración de Google Sign-In en iOS — Diagnóstico y causa raíz

Este documento responde al checklist de diagnóstico **antes** de aplicar correcciones, para identificar exactamente cómo está configurado Google Sign-In en iOS y por qué en **producción** puede aparecer "no está configurado".

---

## Paso 1 — Preguntas / Checklist inicial

### 1) ¿De dónde obtiene el `clientID` iOS?

**Respuesta: A + B (combinados).**

- **A) Info.plist:** El módulo nativo usa como **fallback** `GIDClientID` leyendo de `Bundle.main.object(forInfoDictionaryKey: "GIDClientID")` (ver `GoogleSignInModule.swift` → `plistValue("GIDClientID")` en `resolvedClientId(passed:)`).
- **B) Capa JS / build:** El `clientID` se pasa **desde JavaScript** al llamar a `GoogleSignInModule.signIn(iosClientId, requestId)`. Ese `iosClientId` viene de:
  - `Constants.expoConfig.extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (o `process.env` en WebAppScreen),
  - rellenado por `app.config.ts` → `required('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', '')` (default **vacío** en `extra`).
- **Prioridad en runtime:** Si el argumento `clientId` pasado desde JS **no está vacío**, se usa ese; si está vacío, se usa el valor del **Info.plist** (`GIDClientID`).

No se usa `GoogleService-Info.plist` (no existe en el repo). No hay clientID hardcodeado en Swift; el plist en repo sí tiene valores por defecto.

---

### 2) ¿Dónde está definido el URL Scheme requerido?

**En `ios/DondeBailarMX/Info.plist` → `CFBundleURLTypes` → `CFBundleURLSchemes`.**

En el repo está definido así:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>dondebailarmx</string>
      <string>com.tuorg.dondebailarmx</string>
      <string>com.googleusercontent.apps.168113490186-cv9q1lfu1gfucfa01vvdr6vbfghj23lf</string>
    </array>
  </dict>
</array>
```

El scheme de Google es `com.googleusercontent.apps.<prefix>` donde `<prefix>` es la parte del iOS Client ID antes de `.apps.googleusercontent.com` (REVERSED_CLIENT_ID).

---

### 3) ¿Cuál es el Bundle Identifier exacto en producción?

**`com.tuorg.dondebailarmx`.**

En `ios/DondeBailarMX.xcodeproj/project.pbxproj`:

- **Debug:** `PRODUCT_BUNDLE_IDENTIFIER = com.tuorg.dondebailarmx;`
- **Release:** `PRODUCT_BUNDLE_IDENTIFIER = com.tuorg.dondebailarmx;`

Es el **mismo** para Debug y Release. Debe coincidir con el que está registrado en Google Cloud Console para el cliente OAuth tipo "iOS".

---

### 4) ¿Qué `GoogleService-Info.plist` se usa en producción?

**No se usa ningún `GoogleService-Info.plist`.**

La app no incluye ni referencia `GoogleService-Info.plist`. Los valores de Google se inyectan en:

- **Info.plist (origen):** claves `GIDClientID` y `GIDServerClientID` en `ios/DondeBailarMX/Info.plist` (valores por defecto en repo).
- **Build (Xcode):** Run Script de Build Phases que, si existen `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` y `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (env o archivos `config/local.env` / `.env`), hace `PlistBuddy Set/Add` sobre el **Info.plist ya copiado** en `TARGET_BUILD_DIR` (el que lleva el target).
- **CI (Xcode Cloud):** `ci_scripts/ci_post_clone.sh` escribe `.env` desde las variables de entorno de Xcode Cloud y luego modifica el **Info.plist fuente** (`ios/DondeBailarMX/Info.plist`) inyectando `GIDClientID`, `GIDServerClientID` y el scheme en `CFBundleURLTypes`.

No hay plists distintos por configuración (Dev/Prod); hay un solo Info.plist y opcionalmente inyección por env/script.

---

### 5) ¿Se está manejando el retorno OAuth correctamente?

**Sí.**

- En `ios/DondeBailarMX/AppDelegate.swift` existe `application(_:open:options:)`, que llama a `GIDSignIn.sharedInstance.handle(url)` antes de `super` y `RCTLinkingManager`.
- El módulo nativo (`GoogleSignInModule`) no implementa el callback de URL; lo hace el SDK (`GIDSignIn`) y el `AppDelegate`.

No se usa Scene-based lifecycle para este callback en el código revisado.

---

### 6) ¿El error "not configured" se origina en…?

Puede originarse en **B** o **D** (o ambos):

- **B) Nuestro wrapper nativo:** Si tanto el argumento desde JS como `GIDClientID` del Info.plist están vacíos, el módulo hace `reject("GOOGLE_MISSING_CLIENT_ID", "Falta Google iOS Client ID...", nil)`. El mensaje que ve el usuario puede ser el que se muestra en JS al traducir ese código.
- **D) Capa Web/JS:** En `src/auth/assertGoogleAuthConfig.ts` y `src/screens/WebAppScreen.tsx` se muestra "Google Sign-In no está configurado" cuando `getIosClientId()` (o equivalente) devuelve vacío, **antes** de llamar al módulo nativo. Ese getter lee `Constants.expoConfig.extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (y similares). En `app.config.ts`, `extra` usa `required('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', '')` → **default vacío**. Si en el contexto donde se evalúa `app.config.ts` (p. ej. build del bundle en Xcode Cloud) no existe `.env` o no tiene esas variables, `extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` queda `''` y la **capa JS** muestra "no está configurado" sin llegar a llamar al nativo.

**A)** El SDK (GIDSignIn) podría devolver un error si la configuración es inválida, pero el mensaje literal "no está configurado" en el repo viene de nuestro código (JS o reject nativo).  
**C)** Supabase puede rechazar el token (p. ej. audience); el mensaje típico sería otro (invalid_jwt, etc.), no necesariamente "no está configurado".

---

## Paso 2 — Flujo real en el repo

1. **Módulo nativo:** `ios/DondeBailarMX/GoogleSignInModule.swift`.
2. **Cómo se setea el clientID:**
   - Se recibe `clientId` desde JS en `signIn(_ clientId:requestId:resolver:rejecter:)`.
   - `resolvedClientId(passed: clientId)` devuelve ese valor si no está vacío; si está vacío, devuelve `plistValue("GIDClientID")` (Info.plist).
   - Luego se usa `GIDConfiguration(clientID:effectiveClientId, serverClientID: serverClientId)` y `GIDSignIn.sharedInstance.configuration = config`.
3. **Origen del valor en JS:** `AuthCoordinator.signInWithGoogle(iosClientId, ...)` recibe `iosClientId` de quien inicia el flujo (p. ej. WebAppScreen). WebAppScreen obtiene el client ID de `Constants.expoConfig.extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (o `process.env`), rellenado por `app.config.ts` en el momento en que se evalúa el config (build del bundle). Si en ese momento no hay `.env` con esas variables (o no se cargan), `extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` queda `''`.
4. **Logs útiles (ya presentes en DEBUG o con BAILEAPP_GOOGLE_SIGNIN_DEBUG):** En `GoogleSignInModule` se imprimen, entre otros:
   - `resolved clientID=...`, `expectedScheme=...`, `GIDServerClientID from plist=...`, `CFBundleURLTypes=...`, `schemeOK=...`
   - Si falta client ID: `GOOGLE_MISSING_CLIENT_ID: passed=... plist GIDClientID=...`

Para validar en dispositivo/TestFlight sin asumir nada, conviene añadir (solo DEBUG o con flag) logs que impriman:
- `Bundle.main.bundleIdentifier`
- Si existe `GoogleService-Info.plist` en el bundle (en este proyecto no se usa; se puede omitir o dejar "no usado")
- Prefijo de `GIDClientID` leído (p. ej. primeros 10 caracteres)
- `REVERSED_CLIENT_ID` / scheme esperado
- Comprobación de que `CFBundleURLTypes` contiene ese scheme

---

## Paso 3 — Tabla Debug vs Release (desde repo)

| Aspecto | Debug | Release |
|--------|--------|--------|
| **PRODUCT_BUNDLE_IDENTIFIER** | `com.tuorg.dondebailarmx` | `com.tuorg.dondebailarmx` |
| **Info.plist** | `DondeBailarMX/Info.plist` | Mismo archivo |
| **Plist usado en build** | Copia en `TARGET_BUILD_DIR`; Run Script puede modificarla | Igual |
| **GIDClientID en repo (origen)** | Sí (valor en Info.plist) | Sí (mismo) |
| **GIDServerClientID en repo** | Sí | Sí |
| **Reversed scheme en CFBundleURLSchemes** | Sí (`com.googleusercontent.apps.168113490186-cv9q1lfu1gfucfa01vvdr6vbfghj23lf`) | Sí (mismo) |
| **Run Script (GoogleSignIn)** | Si `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` vacío: no modifica plist, **no falla** (exit 0). Si presente: Set/Add en plist construido. | Si vacío: **exit 1** (build falla). Si presente: Set/Add. |
| **GoogleService-Info.plist** | No usado | No usado |

Conclusión: en el repo, Debug y Release comparten el mismo Bundle ID y el mismo Info.plist. La diferencia crítica es que en **Release**, si la variable de entorno (o el valor leído desde `.env`/`config/local.env`) no está definida, el Run Script **hace fallar el build**. Por tanto, un build Release que llegue a TestFlight debería tener el plist inyectado **o** estar usando el plist fuente que ya tiene `GIDClientID`. Si aun así en producción se ve "no configurado", lo más probable es que el mensaje venga de la **capa JS** (extra vacío) y no del nativo.

---

## Paso 4 — Hipótesis típicas y evidencia

| Hipótesis | Evidencia en repo | Fix mínimo propuesto |
|-----------|-------------------|------------------------|
| **H1) Release usa otro bundleId no dado de alta en Google Cloud** | No. `PRODUCT_BUNDLE_IDENTIFIER` es el mismo Debug/Release: `com.tuorg.dondebailarmx`. | Confirmar en Google Cloud Console que el cliente OAuth iOS tiene exactamente este bundle ID. |
| **H2) GoogleService-Info.plist no está en target Release** | No aplica: no se usa `GoogleService-Info.plist`. Los IDs van en Info.plist. | N/A. |
| **H3) CFBundleURLTypes no incluye REVERSED_CLIENT_ID** | En el Info.plist commiteado sí está el scheme `com.googleusercontent.apps.168113490186-cv9q1lfu1gfucfa01vvdr6vbfghj23lf`. ci_post_clone también puede añadirlo si tiene `GOOGLE_REVERSED_CLIENT_ID`. | Ver en build de Xcode Cloud que el Info.plist final incluya el scheme; si se usa solo script y no plist fuente, asegurar que el script no borre ese ítem. |
| **H4) Se usa plist equivocado (Dev vs Prod)** | Solo hay un Info.plist. No hay GoogleService-Info por entorno. | N/A. |
| **H5) clientID solo se configura en runtime en Debug** | No. El clientID en nativo viene de: 1) argumento JS, 2) fallback Info.plist. El Run Script en Release **exige** tener `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` o falla. El riesgo es que **JS** pase vacío porque `extra` se construye cuando se evalúa `app.config.ts`, y en Xcode Cloud esa evaluación puede ocurrir **sin** el `.env` que genera `ci_post_clone` (p. ej. otro proceso/cwd). | Asegurar que el paso que ejecuta `app.config.ts` (generación de bundle/config) tenga cargado el mismo `.env` que crea `ci_post_clone`, o dar en `app.config.ts` un default no vacío para `extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (y Web) igual que en `infoPlist`, para que en producción el cliente siga funcionando aunque falte env. |
| **H6) El error viene de Supabase / redirect y la UI muestra "no configurado"** | El texto "Google Sign-In no está configurado" en el repo está en nuestro código (assertGoogleAuthConfig, WebAppScreen, mensaje del reject nativo). Supabase suele dar otro tipo de error (p. ej. invalid_jwt). | Si se confirma que el token llega a Supabase y falla, revisar Provider Google en Supabase (Web Client ID) y que `GIDServerClientID` coincida. |

---

## Causa raíz más probable en producción

- **Capa JS:** En `app.config.ts`, el objeto `extra` usa `required('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', '')` con default **vacío**. Quien inicia el login (p. ej. WebAppScreen) lee `Constants.expoConfig.extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`. Si en el contexto donde se evalúa `app.config.ts` (build del JS en Xcode Cloud) no se ha cargado el `.env` generado por `ci_post_clone` o no están definidas las variables de Xcode Cloud, `extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` queda `''`. Entonces:
  - Se llama a `assertGoogleAuthConfig` con ese getter y se lanza el error "Google Sign-In no está configurado" **antes** de llamar al módulo nativo, o
  - Se pasa `iosClientId` vacío al nativo; si además el Info.plist del build no tuviera `GIDClientID` (poco probable si el Run Script pasó en Release), el nativo rechazaría con `GOOGLE_MISSING_CLIENT_ID`.

- **Conclusión:** La causa más plausible es que **en el entorno donde se genera el bundle/config (app.config.ts), las variables EXPO_PUBLIC_GOOGLE_* no están disponibles**, por lo que `extra` sale con client IDs vacíos y la app muestra "no está configurado" desde la capa JS o, en su caso, desde el nativo si el plist tampoco tuviera valor.

---

## Acciones recomendadas (sin tocar a ciegas)

1. **Comprobar en Xcode Cloud:** Que las variables `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` y `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` estén definidas en el workflow que construye la app y que `ci_post_clone.sh` genere `.env` con ellas antes de cualquier paso que ejecute `app.config.ts` o Metro.
2. **Asegurar orden de ejecución:** Que el `.env` creado por `ci_post_clone` exista y esté en el directorio correcto cuando se ejecute lo que evalúa `app.config.ts` (y que ese proceso lea ese `.env` o reciba las variables por entorno).
3. **Regla definitiva (anti-falsos positivos):** En iOS nativo, **JS no debe bloquear** el login solo porque `Constants.expoConfig.extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` venga vacío. Si JS no tiene `iosClientId`, se debe continuar y permitir que el nativo use el fallback `Info.plist` (`GIDClientID`).
4. **Resiliencia en runtime:** En `app.config.ts`, usar para `extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` y `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` el **mismo valor por defecto** que en `infoPlist` (los client IDs de producción), de modo que si en build no hay env, la app siga teniendo valores en `extra` y no muestre "no está configurado" en producción.
5. **Logs de diagnóstico (TestFlight-safe):**
   - **JS** (solo si `BAILEAPP_GOOGLE_SIGNIN_DEBUG=1|true`): imprimir plataforma, si el client ID viene vacío desde `extra`, y si se usará fallback nativo (sin imprimir valores completos).
   - **Nativo iOS** (solo DEBUG o `BAILEAPP_GOOGLE_SIGNIN_DEBUG` en Info.plist): ya imprime `expectedScheme`, `schemeOK`, y presencia de `GIDServerClientID` / `GIDClientID` con prefijos.

Con esto se cumple la regla: primero identificar "cómo está configurado hoy" y "qué difiere en producción"; después aplicar solo los cambios necesarios (env, orden de pasos, defaults en `extra`, y opcionalmente logs).
