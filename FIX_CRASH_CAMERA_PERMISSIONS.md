# Fix: Crash al Guardar Perfil - Permisos de Cámara

## Problema Reportado

**Guideline 2.1 - Performance - App Completeness**

El app crashea cuando se intenta guardar el perfil en iPad Air 11-inch (M3) con iPadOS 26.2.

### Análisis del Crash Log

El crash log muestra:
```
"termination" : {
  "flags":518,
  "code":0,
  "namespace":"TCC",
  "details":[
    "This app has crashed because it attempted to access privacy-sensitive data without a usage description. The app's Info.plist must contain an NSCameraUsageDescription key with a string value explaining to the user how the app uses this data."
  ]
}
```

**Causa raíz**: La app intenta acceder a la cámara (a través de `UIImagePickerController`) sin tener `NSCameraUsageDescription` en el `Info.plist`.

## Solución Implementada

### 1. Permisos en `app.config.ts` ✅

Las descripciones de permisos ya están configuradas en `app.config.ts`:

```typescript
ios: {
  supportsTablet: true,
  bundleIdentifier: "com.tuorg.dondebailarmx",
  infoPlist: {
    ITSAppUsesNonExemptEncryption: false,
    NSCameraUsageDescription: "Necesitamos acceso a la cámara para tomar fotos de perfil y eventos.",
    NSMicrophoneUsageDescription: "Necesitamos acceso al micrófono para grabar video cuando lo solicites.",
    NSPhotoLibraryUsageDescription: "Necesitamos acceso a tu galería para seleccionar fotos de perfil y eventos.",
    NSPhotoLibraryAddUsageDescription: "Permite guardar fotos en tu galería cuando lo desees.",
  },
},
```

### 2. Mejoras en Manejo de Errores ✅

Se mejoró el manejo de errores en `ProfileBasics.tsx` para:
- Capturar errores de permisos si es posible
- Mostrar mensajes de error más claros y específicos
- Detectar errores de conexión vs errores de permisos

### 3. Acción Requerida: Rebuild

**⚠️ IMPORTANTE**: El build que se envió a App Store probablemente no incluyó estas descripciones porque:
1. El build se hizo antes de agregar las descripciones, o
2. El build no se regeneró después de agregar las descripciones

**Solución**: Se requiere un nuevo build de iOS que incluya las descripciones de permisos.

## Pasos para Resolver

1. **Verificar configuración** (ya hecho ✅):
   - Las descripciones están en `app.config.ts`
   - Los permisos están correctamente configurados

2. **Generar nuevo build**:
   ```bash
   # Limpiar build anterior
   rm -rf ios/build
   
   # Generar nuevo build con permisos
   pnpm build:prod:ios
   # o
   eas build --platform ios --profile production
   ```

3. **Verificar Info.plist generado**:
   - Después del build, verificar que `ios/DondeBailarMX/Info.plist` contenga:
     - `NSCameraUsageDescription`
     - `NSPhotoLibraryUsageDescription`
     - `NSPhotoLibraryAddUsageDescription`
     - `NSMicrophoneUsageDescription`

4. **Probar en dispositivo**:
   - Instalar el nuevo build en un iPad/iPhone
   - Intentar subir foto de perfil
   - Verificar que se solicite permiso correctamente
   - Verificar que no haya crash

5. **Enviar a App Store**:
   - Subir el nuevo build a App Store Connect
   - Incluir en las notas de revisión que se corrigió el problema de permisos de cámara

## Notas Adicionales

- El crash ocurre cuando el usuario toca el input file y iOS intenta abrir `UIImagePickerController` con la opción de cámara
- En iOS/iPadOS, `<input type="file" accept="image/*">` puede mostrar opciones para tomar foto o seleccionar de galería
- Si el usuario elige "tomar foto" y no hay `NSCameraUsageDescription`, la app crashea inmediatamente
- El error de "connection error" que ve el usuario es probablemente un efecto secundario del crash, no la causa principal

## Referencias

- [Apple - Privacy - Camera Usage Description](https://developer.apple.com/documentation/bundleresources/information_property_list/nscamerausagedescription)
- [Expo - iOS Permissions](https://docs.expo.dev/guides/permissions/#ios)
- Crash log: `6D0B44C8-69CA-4ADF-846B-276E21275E8E`

