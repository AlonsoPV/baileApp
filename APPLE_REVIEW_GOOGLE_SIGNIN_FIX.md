# Fix: Google Sign-In Error en iPad (Guideline 2.1)

## Problema reportado por Apple Review

**Error**: Al tocar "Continuar con Google" en iPad Air 11-inch (M3) con iPadOS 26.2, la app muestra un mensaje de error.

## Cambios implementados

### 1. Validación de Google iOS Client ID (`src/screens/WebAppScreen.tsx`)

**Antes**: Se pasaba `clientId` vacío a `signInWithGoogle` sin validar.

**Ahora**: 
- Se valida que `clientId` no esté vacío antes de intentar sign-in
- Si falta, se muestra un mensaje claro: "Google Sign-In no está configurado. Falta Google iOS Client ID."
- El error se inyecta correctamente en la web para mostrarlo al usuario

### 2. Mejora de mensajes de error (`src/screens/WebAppScreen.tsx`)

**Antes**: Mensajes genéricos de error.

**Ahora**: Mensajes específicos y útiles según el tipo de error:
- `GOOGLE_MISSING_CLIENT_ID`: "Google Sign-In no está configurado. Contacta al soporte."
- `GOOGLE_NO_PRESENTING_VC`: "No se pudo mostrar la pantalla de Google. Intenta cerrar y reabrir la app."
- `GOOGLE_CANCELED`: "Inicio de sesión cancelado."
- Errores de token: "Error al obtener credenciales de Google. Intenta de nuevo."

### 3. Mejora de `topMostViewController` para iPad (`ios/DondeBailarMX/NativeAuthTopViewController.swift`)

**Problema**: En iPad, a veces no se encontraba el ViewController correcto para presentar Google Sign-In.

**Solución**:
- Múltiples fallbacks para encontrar el ViewController:
  1. `activeRootViewController()` (método principal)
  2. Key window del window scene activo
  3. AppDelegate window (legacy)
  4. Primer window scene disponible
- Soporte mejorado para `UISplitViewController` (iPad)
- Logs de debugging para identificar problemas

### 4. Logs de debugging (`ios/DondeBailarMX/GoogleSignInModule.swift`)

**Agregado**: Logs detallados cuando falla `topMostViewController` para facilitar debugging:
- Número de window scenes
- Número de windows
- Si hay key window

## Verificación

### Checklist antes de re-subir a App Review:

- [ ] **Google iOS Client ID configurado**:
  - Verificar que `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` esté en Xcode Cloud environment variables
  - Verificar que esté en `config/local.env` para builds locales
  - El valor debe ser el Client ID de Google Cloud Console (formato: `xxxxx-xxxxx.apps.googleusercontent.com`)

- [ ] **Probar en iPad real**:
  - Abrir la app en iPad
  - Ir a Login
  - Tocar "Continuar con Google"
  - Verificar que:
    - No muestra error si está configurado correctamente
    - Muestra mensaje claro si falta configuración
    - El modal de Google se presenta correctamente
    - Al completar, regresa a la app sin errores

- [ ] **Probar en iPhone**:
  - Verificar que el flujo sigue funcionando correctamente

- [ ] **Verificar logs**:
  - Si hay errores, revisar los logs de `GoogleSignInModule` para identificar el problema específico

## Configuración requerida

### Xcode Cloud / EAS Build

Agregar environment variable:
- **Name**: `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- **Value**: Tu Google iOS Client ID (de Google Cloud Console)

### Local development

Agregar a `config/local.env`:
```env
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxxxx-xxxxx.apps.googleusercontent.com
```

## Resultado esperado

- ✅ Google Sign-In funciona correctamente en iPad
- ✅ Si falta configuración, muestra mensaje claro (no error genérico)
- ✅ Si hay error de presentación, muestra mensaje útil
- ✅ Los errores se muestran correctamente en la UI de Login
- ✅ El estado de loading se resetea correctamente cuando hay error
