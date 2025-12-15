# 🔍 Verificar Configuración de Expo Updates en iOS

## 📋 Paso 1: Generar Archivos Nativos iOS (si no existen)

Si el directorio `ios/` no existe, necesitas generar los archivos nativos primero:

```bash
# Opción 1: Generar localmente (requiere macOS y Xcode)
npx expo prebuild --platform ios

# Opción 2: Hacer un build con EAS (genera los archivos automáticamente)
eas build --profile development --platform ios
```

## 📋 Paso 2: Verificar Archivos .plist

Una vez que exista el directorio `ios/`, busca estos archivos:

### Ubicaciones posibles:

1. **`ios/<TuApp>/Supporting/Expo.plist`**
   - Ejemplo: `ios/DondeBailarMX/Supporting/Expo.plist`

2. **`ios/<TuApp>/Info.plist`**
   - Ejemplo: `ios/DondeBailarMX/Info.plist`

### Comando para buscar:

```bash
# En PowerShell
Get-ChildItem -Path ios -Recurse -Filter "*.plist" | Select-Object FullName

# En Bash/Mac
find ios -name "*.plist" -type f
```

## ✅ Paso 3: Verificar Claves Requeridas

Abre los archivos `.plist` encontrados y verifica que contengan estas claves:

### Claves requeridas en `Expo.plist` o `Info.plist`:

1. **`EXUpdatesURL`** (o `EXUpdatesUrl`)
   - Debe apuntar a: `https://u.expo.dev/8bdc3562-9d5b-4606-b5f0-f7f1f7f6fa66`
   - Esta URL viene de `app.config.ts` → `updates.url`

2. **`EXUpdatesRuntimeVersion`**
   - Debe ser: `1.0.0`
   - Esta versión viene de `app.config.ts` → `runtimeVersion`

3. **`EXUpdatesEnabled`**
   - Debe ser: `true` (o `YES` en formato plist)

## 📝 Configuración Actual en `app.config.ts`

Tu configuración actual es:

```typescript
{
  runtimeVersion: "1.0.0",  // ✅ Se convierte en EXUpdatesRuntimeVersion
  updates: {
    url: "https://u.expo.dev/8bdc3562-9d5b-4606-b5f0-f7f1f7f6fa66",  // ✅ Se convierte en EXUpdatesURL
    fallbackToCacheTimeout: 0,
  },
}
```

## 🔧 Si las claves no existen o están incorrectas

### Opción 1: Regenerar archivos nativos

```bash
# Eliminar directorio iOS existente
rm -rf ios  # En Mac/Linux
Remove-Item -Recurse -Force ios  # En PowerShell

# Regenerar
npx expo prebuild --platform ios
```

### Opción 2: Agregar manualmente en `app.config.ts`

Puedes forzar la configuración agregando estas claves en `ios.infoPlist`:

```typescript
ios: {
  bundleIdentifier: "com.tuorg.dondebailarmx",
  supportsTablet: true,
  infoPlist: {
    ITSAppUsesNonExemptEncryption: false,
    // Agregar configuración de Expo Updates
    EXUpdatesURL: "https://u.expo.dev/8bdc3562-9d5b-4606-b5f0-f7f1f7f6fa66",
    EXUpdatesRuntimeVersion: "1.0.0",
    EXUpdatesEnabled: true,
  },
},
```

**Nota:** Normalmente Expo genera estas claves automáticamente desde `updates.url` y `runtimeVersion`, pero si necesitas forzarlas, puedes hacerlo así.

## 🧪 Verificar después de un Build

Después de hacer un build con EAS, puedes descargar el `.ipa` y extraerlo para verificar los archivos `.plist`:

```bash
# Descargar el build
eas build:list --platform ios

# O verificar directamente en el build
# Los archivos .plist están dentro del .ipa
```

## 📚 Referencias

- [Expo Updates Configuration](https://docs.expo.dev/versions/latest/config/app/#updates)
- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)

