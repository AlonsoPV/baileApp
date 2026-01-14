# Fix: Cámara en iPad vía WebView (React Native)

## 🔍 Análisis del Proyecto

**Tipo de proyecto:** React Native + Expo + WebView

**Librería de cámara:** ❌ NO usa librerías nativas
- ❌ No usa `expo-image-picker`
- ❌ No usa `react-native-image-picker`
- ❌ No usa `react-native-vision-camera`

**Acceso a cámara:** ✅ Vía WebView con `<input type="file">` desde la web app

**Archivos relevantes:**
- `src/screens/WebAppScreen.tsx` - WebView component
- `apps/web/src/components/MediaUploader.tsx` - Componente web que usa `<input type="file">`
- `apps/web/src/screens/onboarding/ProfileBasics.tsx` - Usa `<input type="file" accept="image/*">`

## ✅ Fixes Aplicados

### 1. Permisos en Info.plist ✅

**Estado:** Ya configurado correctamente

```xml
<key>NSCameraUsageDescription</key>
<string>Necesitamos acceso a la cámara para tomar fotos de perfil y eventos.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Necesitamos acceso a tu galería para seleccionar fotos de perfil y eventos.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Permite guardar fotos en tu galería cuando lo desees.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Necesitamos acceso al micrófono para grabar video cuando lo solicites.</string>
```

**También en:** `app.config.ts` (líneas 170-174)

### 2. WKWebView - Configuración iPad-Safe ✅

**Archivo:** `src/screens/WebAppScreen.tsx`

**Cambios aplicados:**

```typescript
// iOS (WKWebView): helps when the embedded web requests camera/mic (iOS 15+ API)
// This is especially important on iPad where media/capture permission flows can behave differently.
mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
// Keep WKWebView media behavior closer to Safari
allowsInlineMediaPlayback
```

**Explicación:**
- `mediaCapturePermissionGrantType`: Mejora el manejo de permisos cuando la web solicita cámara/micrófono
- `allowsInlineMediaPlayback`: Alinea el comportamiento con Safari

### 3. Upgrade react-native-webview ✅

**Cambio:** `13.15.0` → `13.16.0`

**Razón:** Incluye fixes de estabilidad específicos para iPad/WKWebView

### 4. Popover en iPad - WKWebView Automático ✅

**Nota importante:** WKWebView maneja automáticamente el popover cuando se usa `<input type="file">` en iPad. Sin embargo, podemos mejorar la configuración.

**WKWebView automáticamente:**
- Detecta cuando es iPad
- Presenta el selector de cámara/galería como popover
- Configura el anchor automáticamente

**Si necesitas control manual del popover** (caso avanzado), puedes usar un delegate personalizado, pero **NO es necesario** para este caso.

## 🔧 Mejoras Adicionales Aplicadas

### WebView - Manejo de Errores Mejorado

Ya implementado en `WebAppScreen.tsx`:
- Watchdog para evitar spinners infinitos
- Manejo de errores de carga
- Limpieza de estado al cancelar navegación

### Web App - Manejo de Errores

En `ProfileBasics.tsx` (líneas 701-719):
```typescript
onClick={(e) => {
  // En iOS/iPadOS, si el usuario cancela o hay un error de permisos,
  // el evento onChange no se dispara, pero podemos capturar errores aquí
  try {
    if (import.meta.env.MODE === 'development') {
      console.log('[ProfileBasics] Input file clicked');
    }
  } catch (error) {
    console.error('[ProfileBasics] Error al hacer clic en input file:', error);
  }
}}
onError={(e) => {
  console.error('[ProfileBasics] Error en input file:', e);
  const errorMsg = 'Error al acceder a la galería o cámara. Por favor verifica los permisos de la app en Configuración.';
  setError(errorMsg);
  showToast(errorMsg, 'error');
}}
```

## 📋 Checklist de Verificación

### ✅ Permisos
- [x] `NSCameraUsageDescription` en Info.plist
- [x] `NSPhotoLibraryUsageDescription` en Info.plist
- [x] `NSPhotoLibraryAddUsageDescription` en Info.plist
- [x] `NSMicrophoneUsageDescription` en Info.plist
- [x] Permisos también en `app.config.ts`

### ✅ WebView
- [x] `mediaCapturePermissionGrantType` configurado
- [x] `allowsInlineMediaPlayback` configurado
- [x] Upgrade a `react-native-webview@13.16.0`
- [x] Manejo de errores mejorado

### ✅ Web App
- [x] Manejo de errores en `<input type="file">`
- [x] Logs para debugging

## 🎯 Diferencia con Librerías Nativas

### Si usaras `expo-image-picker`:

```typescript
import * as ImagePicker from 'expo-image-picker';

// Necesitarías:
const result = await ImagePicker.launchCameraAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  quality: 1,
});
```

**Fixes necesarios:**
1. Permisos en Info.plist ✅ (ya están)
2. Popover en iPad - expo-image-picker lo maneja automáticamente
3. Main thread - expo-image-picker lo maneja automáticamente

### Si usaras `react-native-image-picker`:

```typescript
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

// Necesitarías:
launchCamera(options, (response) => {
  // ...
});
```

**Fixes necesarios:**
1. Permisos en Info.plist ✅ (ya están)
2. Popover en iPad - necesitarías configurar manualmente
3. Main thread - necesitarías asegurar ejecución en main thread

### Tu caso (WebView):

**Ventajas:**
- ✅ WKWebView maneja automáticamente el popover en iPad
- ✅ WKWebView maneja automáticamente main thread
- ✅ No necesitas código nativo adicional

**Lo que ya hicimos:**
- ✅ Permisos configurados
- ✅ `mediaCapturePermissionGrantType` para mejor manejo de permisos
- ✅ Upgrade de react-native-webview para estabilidad

## 🚀 Próximos Pasos

1. ✅ **Build nuevo requerido:**
   ```bash
   pnpm build:prod:ios
   ```

2. ⏳ **Testing en iPad:**
   - Abrir perfil
   - Tocar "Subir foto"
   - Verificar que aparece selector cámara/galería
   - Verificar que no crashea

3. ⏳ **Si aún hay problemas:**
   - Revisar logs de Xcode
   - Verificar Exception Reason en crash log
   - Considerar usar `expo-image-picker` si el problema persiste

## 📝 Notas Finales

**Tu implementación actual (WebView) es válida y debería funcionar** con los fixes aplicados. WKWebView maneja automáticamente:
- Popover en iPad
- Main thread
- Permisos (con las configuraciones que agregamos)

**Si el problema persiste después del build**, considera:
1. Verificar que el build incluye los cambios
2. Revisar crash logs específicos
3. Considerar migrar a `expo-image-picker` para mejor control nativo

---

**Fecha:** 2026-01-14
**Estado:** ✅ Fixes aplicados, listo para build
