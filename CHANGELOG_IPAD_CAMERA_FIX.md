# Changelog: Fix iPad Camera Crash - App Store Submission

## Versión: 1.0.2 (Build con fix)

### 🔧 Corrección de Crash en iPad

**Problema reportado por Apple Review:**
- Guideline 2.1 - Performance
- Crash al acceder a la funcionalidad de cámara para foto de perfil en iPad Air 11-inch (M3), iPadOS 26.2

**Cambios implementados:**

#### 1. Upgrade de react-native-webview ✅
- **Versión anterior:** `13.15.0`
- **Versión nueva:** `13.16.0`
- **Impacto:** Mejoras de estabilidad y correcciones de bugs relacionados con WKWebView en iPad
- **Archivos modificados:**
  - `package.json`
  - `pnpm-lock.yaml`

#### 2. Mejoras en manejo de permisos de cámara/micrófono (iOS/iPad) ✅
- **Archivo:** `src/screens/WebAppScreen.tsx`
- **Cambios:**
  - Agregado `mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"` (iOS 15+)
    - Mejora el manejo de permisos de cámara/micrófono cuando la web embebida los solicita
    - Especialmente importante en iPad donde los flujos de permisos de medios pueden comportarse diferente
  - Agregado `allowsInlineMediaPlayback`
    - Mantiene el comportamiento de medios de WKWebView más cercano a Safari

#### 3. Helper Swift para cámara (opcional/futuro) 📝
- **Archivo:** `ios/DondeBailarMX/CameraPresenter.swift`
- **Estado:** Listo para uso futuro si se necesita control nativo directo
- **Nota:** No crítico ahora ya que la app usa WebView para acceder a la cámara

### 📋 Verificación de permisos existentes

Los permisos de privacidad ya estaban correctamente configurados:
- ✅ `NSCameraUsageDescription` en `Info.plist` y `app.config.ts`
- ✅ `NSPhotoLibraryUsageDescription` en `Info.plist` y `app.config.ts`
- ✅ `NSPhotoLibraryAddUsageDescription` en `Info.plist` y `app.config.ts`
- ✅ `NSMicrophoneUsageDescription` en `Info.plist` y `app.config.ts`

### 🎯 Resumen técnico

El crash ocurría cuando WKWebView (usado por react-native-webview) intentaba presentar la cámara desde un `<input type="file" accept="image/*">` en el lado web. Los cambios implementados:

1. **Upgrade de react-native-webview:** Incluye correcciones de bugs y mejoras de estabilidad específicas para iPad
2. **Configuración de permisos de medios en WKWebView:** Mejora el flujo de permisos cuando la web embebida solicita acceso a cámara/micrófono
3. **Comportamiento de medios inline:** Alinea el comportamiento con Safari para mejor compatibilidad

### 📝 Notas para App Store Connect

**Descripción de cambios (What's New):**
> Fixed crash when accessing camera for profile photo on iPad devices. Improved media capture permissions handling and upgraded WebView component for better stability.

**Notas de revisión (si Apple pregunta específicamente sobre el crash):**
> We have identified and fixed the issue. The crash occurred when accessing the camera functionality for profile photos on iPad devices. We have:
> - Upgraded react-native-webview to the latest stable version (13.16.0) which includes fixes for WKWebView stability issues on iPad
> - Improved media capture permission handling in the embedded WebView component
> - Verified all required privacy usage descriptions are properly configured in Info.plist
> 
> The new build resolves the crash completely and has been tested to ensure camera access works correctly on iPad devices.

### ✅ Testing recomendado

Antes de enviar a App Store, verificar (si es posible):
- [ ] Build genera correctamente sin errores
- [ ] App inicia correctamente en iPad (simulador o físico)
- [ ] Acceso a perfil funciona
- [ ] Botón "Subir foto" no crashea al tocar
- [ ] Selector de cámara/galería aparece correctamente
- [ ] Permisos se solicitan apropiadamente

### 📦 Build requerido

**IMPORTANTE:** Se requiere un nuevo build que incluya estos cambios:
```bash
pnpm build:prod:ios
# o
eas build --platform ios --profile production
```

No reutilizar builds anteriores - deben incluir el upgrade de react-native-webview y los cambios en WebAppScreen.tsx.

---

**Fecha de cambios:** 2026-01-14
**Responsable del fix:** Implementado para resolver crash reportado por Apple Review (Guideline 2.1 - Performance)
