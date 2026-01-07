# 🔧 Solución: Crash de Cámara en TestFlight Build 112

## 📋 Análisis del Crash

**Crash Report ID**: `F3634EE7-CF0E-49FD-B267-12C73350E49A`  
**Build afectado**: v1.0.1 (build 112)  
**Dispositivo**: iPhone 15 Pro (iPhone15,4) con iOS 26.1

### Error Principal

```
"termination" : {
  "flags":518,
  "code":0,
  "namespace":"TCC",
  "details":[
    "This app has crashed because it attempted to access privacy-sensitive data without a usage description. 
    The app's Info.plist must contain an NSCameraUsageDescription key with a string value explaining to the user 
    how the app uses this data."
  ]
}
```

**Causa**: El build 112 fue generado **antes** de agregar los permisos de cámara al `Info.plist`.

## ✅ Estado Actual

### Permisos Configurados Correctamente

1. **`app.config.ts`** ✅ - Tiene todos los permisos:
   ```typescript
   NSCameraUsageDescription: "Necesitamos acceso a la cámara para tomar fotos de perfil y eventos.",
   NSMicrophoneUsageDescription: "Necesitamos acceso al micrófono para grabar video cuando lo solicites.",
   NSPhotoLibraryUsageDescription: "Necesitamos acceso a tu galería para seleccionar fotos de perfil y eventos.",
   NSPhotoLibraryAddUsageDescription: "Permite guardar fotos en tu galería cuando lo desees.",
   ```

2. **`ios/DondeBailarMX/Info.plist`** ✅ - Tiene todos los permisos (líneas 78-85)

### Problema

El build 112 en TestFlight **NO incluye estos permisos** porque fue generado antes de agregarlos.

## 🚀 Solución: Generar Nuevo Build

### Paso 1: Verificar Versión

El `app.config.ts` tiene versión `1.0.2`, pero el build 112 es `1.0.1`. Asegúrate de que la versión sea correcta:

```typescript
// app.config.ts
version: "1.0.2",  // ✅ Ya está correcto
```

### Paso 2: Regenerar Proyecto iOS (Opcional pero Recomendado)

Si hiciste cambios en `app.config.ts`, regenera el proyecto iOS para asegurar que los permisos se incluyan:

```bash
# Desde la raíz del proyecto
npx expo prebuild --platform ios --clean
```

O si usas pnpm:
```bash
pnpm prebuild:ios  # Si existe el script
# o
npx expo prebuild --platform ios --clean
```

### Paso 3: Verificar Info.plist

Después de regenerar, verifica que `ios/DondeBailarMX/Info.plist` contenga:

```xml
<key>NSCameraUsageDescription</key>
<string>Necesitamos acceso a la cámara para tomar fotos de perfil y eventos.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Necesitamos acceso al micrófono para grabar video cuando lo solicites.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Necesitamos acceso a tu galería para seleccionar fotos de perfil y eventos.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Permite guardar fotos en tu galería cuando lo desees.</string>
```

### Paso 4: Generar Nuevo Build con EAS

```bash
# Build de producción para App Store
pnpm build:prod:ios

# O directamente con EAS
eas build --platform ios --profile production
```

### Paso 5: Verificar el Build

Después de que EAS termine el build:

1. Descarga el `.ipa` desde EAS
2. Extrae el `Info.plist` del `.ipa` (o verifica en Xcode si usas Archive)
3. Confirma que contiene los 4 permisos de privacidad

### Paso 6: Subir a TestFlight

```bash
# Subir automáticamente con EAS
pnpm submit:ios

# O manualmente desde App Store Connect
```

### Paso 7: Probar en TestFlight

1. Instala el nuevo build en un dispositivo de prueba
2. Intenta subir una foto de perfil
3. Verifica que:
   - Se solicite permiso de cámara/galería correctamente
   - No haya crash
   - La funcionalidad funcione normalmente

## 📝 Notas para App Review

Si Apple pregunta sobre el crash, puedes responder:

> "We have identified and fixed the issue. The crash occurred because the previous build (112) was missing the required privacy usage descriptions in Info.plist. We have now added all required privacy descriptions (NSCameraUsageDescription, NSPhotoLibraryUsageDescription, NSPhotoLibraryAddUsageDescription, and NSMicrophoneUsageDescription) and generated a new build that includes these permissions. The new build resolves the crash completely."

## 🔍 Verificación Rápida

Para verificar que el build incluye los permisos:

```bash
# Si tienes el .ipa descargado
unzip -q YourApp.ipa
plutil -p Payload/YourApp.app/Info.plist | grep -A 1 "NSCameraUsageDescription"
```

Deberías ver:
```
"NSCameraUsageDescription" => "Necesitamos acceso a la cámara para tomar fotos de perfil y eventos."
```

## ⚠️ Importante

- **NO uses builds antiguos**: El build 112 y anteriores NO tienen los permisos
- **Siempre verifica**: Después de cada build, verifica que el Info.plist incluya los permisos
- **Versión**: Asegúrate de incrementar la versión/build number para cada nuevo build

## 📚 Referencias

- [Apple - NSCameraUsageDescription](https://developer.apple.com/documentation/bundleresources/information_property_list/nscamerausagedescription)
- [Expo - iOS Permissions](https://docs.expo.dev/guides/permissions/#ios)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

