# Xcode Cloud: Build fallido con exit code 65

Cuando el comando `xcodebuild archive` termina con **exit code 65**, es un fallo genérico de compilación. Hay que mirar el **log completo** para ver el primer error real.

## Cómo ver el error real

1. En **Xcode Cloud** (App Store Connect o Xcode → Organizer → Cloud), abre el **workflow** que falló.
2. Abre el **log del build** (Build log / Logs).
3. Busca la **primera línea en rojo** o el primer mensaje que diga `error:` o `❌` o `Command PhaseScriptExecution failed`.
4. El nombre del **Phase** que falla suele aparecer justo antes (por ejemplo "Bundle React Native code and images", "Run Script", "[GoogleSignIn]", etc.).

Ese primer error es lo que hay que corregir.

## Causas habituales y qué revisar

| Síntoma en el log | Causa probable | Qué hacer |
|-------------------|----------------|-----------|
| `ENTRY_FILE: unbound variable` | Script "Bundle React Native" con `set -u` | Ya corregido en el proyecto (usa `${ENTRY_FILE:-}`). Asegúrate de tener el último commit. |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID not set` o `invalid_jwt` en script | Variable de Google no definida o trim | Script de Google Sign-In ya usa fallback a Info.plist y trim. Revisa que `ios/DondeBailarMX/Info.plist` tenga `GIDClientID` y `GIDServerClientID`. |
| `Unable to open ... Pods-DondeBailarMX.release.xcconfig` | Pods no instalados o workspace incorrecto | En **Start Script** (ci_post_clone) debe ejecutarse `pod install` desde `ios/`. Revisa que exista `ios/Pods/` y que el workflow use un **workspace** (p. ej. `ios/baileApp.xcworkspace` o `ios/DondeBailarMX.xcworkspace`), no solo el `.xcodeproj`. |
| `Unicode Normalization not appropriate for ASCII-8BIT` (pod install) | Codificación en CocoaPods | En ci_post_clone y ci_pre_xcodebuild se exporta `LANG=en_US.UTF-8` y `LC_ALL=en_US.UTF-8`. Asegúrate de tener esos cambios. |
| `NODE_BINARY not found` / `node: command not found` | Node no disponible en la fase de Archive | El **Start Script** (ci_post_clone) debe instalar Node y crear `ios/.xcode.env` con `NODE_BINARY`. Revisa que ensure_node.sh y la parte de .xcode.env se ejecuten bien. |
| App icon missing / ASSETCATALOG | Icono no generado o sin tamaños aplicables | ci_pre_xcodebuild genera los iconos. Revisa que se ejecute el **Pre-Xcode Build Script** y que exista `assets/adaptive-icon.png` o `ios/DondeBailarMX/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png`. |
| Code signing / provisioning profile | Firma o perfil incorrectos | En el workflow, **DEVELOPMENT_TEAM** y **CODE_SIGN_IDENTITY** deben ser los correctos. El comando que mostraste usa `CODE_SIGN_IDENTITY=-` y `AD_HOC_CODE_SIGNING_ALLOWED=YES`; si el error es de firma, revisa la configuración del workflow en Xcode Cloud. |

## Workspace que usa el build

El comando que mostraste usa:

- **Workspace:** `ios/baileApp.xcworkspace`
- **Scheme:** `DondeBailarMX`

En el repo existen **dos** workspaces que sirven para el mismo proyecto:

- `ios/baileApp.xcworkspace`
- `ios/DondeBailarMX.xcworkspace`

Ambos referencian `DondeBailarMX.xcodeproj` y `Pods`. Puedes usar cualquiera de los dos; si quieres unificar, en la configuración del workflow de Xcode Cloud puedes cambiar a `ios/DondeBailarMX.xcworkspace`.

## Checklist rápido

- [ ] **Start Script (ci_post_clone)** se ejecuta y termina sin error (Node, pnpm install, pod install, .env, .xcode.env).
- [ ] **Pre-Xcode Build Script (ci_pre_xcodebuild)** se ejecuta (LANG/LC_ALL, ensure_pods, iconos, incremento de build).
- [ ] En el log del **xcodebuild**, localizar la **primera** línea de error y el **Phase** que falla.
- [ ] Proyecto actualizado con los últimos fixes (ENTRY_FILE, Google Sign-In trim/fallback, LANG en ci_post_clone).

Si pegas aquí la **primera parte del error** que salga en el log (unas 5–10 líneas), se puede concretar el siguiente paso.
