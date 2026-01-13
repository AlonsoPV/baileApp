# ✅ Solución: Error ITMS-91111 - Missing App Icon 1024x1024

## ❌ Error Encontrado

```
ITMS-91111: Missing app icon - Include a large app icon as a 1024 by 1024 pixel PNG 
for the 'Any Appearance' image well in the asset catalog of apps built for iOS or iPadOS.
```

## 🔍 Causa

El asset catalog de iOS (`Contents.json`) estaba configurado para buscar un archivo llamado `AppIcon-1024-opaque.png`, pero ese archivo no existía en el directorio. Solo existía `App-Icon-1024x1024@1x.png`.

## ✅ Solución Implementada

Se ha copiado el archivo existente `App-Icon-1024x1024@1x.png` al nombre que espera el `Contents.json`: `AppIcon-1024-opaque.png`.

### Archivos Actualizados

1. **`ios/DondeBailarMX/Images.xcassets/AppIcon.appiconset/AppIcon-1024-opaque.png`**
   - ✅ Creado copiando desde `App-Icon-1024x1024@1x.png`
   - ✅ Tamaño: 1024x1024 px
   - ✅ Formato: PNG
   - ✅ Usado para App Store Connect

2. **`ios/DondeBailarMX/Images.xcassets/AppIcon.appiconset/Contents.json`**
   - ✅ Ya estaba configurado correctamente para usar `AppIcon-1024-opaque.png`
   - ✅ Configurado para dos ubicaciones:
     - `"idiom": "universal"` (línea 106-110)
     - `"idiom": "ios-marketing"` (línea 112-116)

---

## 🚀 Próximos Pasos

### 1. Verificar que el Icono Existe

```bash
# Verificar que el archivo existe
Test-Path "ios/DondeBailarMX/Images.xcassets/AppIcon.appiconset/AppIcon-1024-opaque.png"
# Debe retornar: True
```

### 2. Generar Nuevo Build

```bash
# Generar build de producción
pnpm build:prod:ios
```

### 3. Subir a App Store Connect

El build debería pasar la validación de App Store Connect sin el error ITMS-91111.

---

## 📋 Verificación del Icono

### Requisitos del Icono 1024x1024

- ✅ **Tamaño**: Exactamente 1024x1024 píxeles
- ✅ **Formato**: PNG
- ✅ **Sin transparencia**: Fondo sólido (opaco)
- ✅ **Sin esquinas redondeadas**: iOS las aplica automáticamente
- ✅ **Sin texto pequeño**: No se verá bien en tamaños pequeños

### Verificar en Xcode (Opcional)

1. Abre el proyecto en Xcode:
   ```bash
   open ios/DondeBailarMX.xcworkspace
   ```

2. Ve a la configuración del icono:
   - Selecciona el proyecto "DondeBailarMX" en el navegador
   - Ve a la pestaña "General"
   - Busca "App Icons and Launch Screen"
   - Verifica que el icono aparezca correctamente en el slot de 1024x1024

---

## 🔍 Estructura del Asset Catalog

El `Contents.json` está configurado para usar el icono de 1024x1024 en dos lugares:

1. **`"idiom": "universal"`** - Para uso general en iOS/iPadOS
2. **`"idiom": "ios-marketing"`** - Para App Store Connect (requerido)

Ambos apuntan al mismo archivo: `AppIcon-1024-opaque.png`

---

## ⚠️ Notas Importantes

1. **El icono NO se actualiza con OTA Updates**: Siempre necesitas hacer un nuevo build
2. **App Store Connect puede tardar unos minutos** en procesar el nuevo icono después de subir
3. **Si cambias el icono en el futuro**, asegúrate de actualizar ambos archivos:
   - `App-Icon-1024x1024@1x.png` (para desarrollo)
   - `AppIcon-1024-opaque.png` (para App Store)

---

## 🔄 Si Necesitas Cambiar el Icono en el Futuro

### Opción 1: Reemplazar Manualmente

1. Reemplaza `assets/icon.png` con tu nuevo icono (1024x1024 px)
2. Copia a ambos lugares:
   ```bash
   Copy-Item -Path "assets/icon.png" -Destination "ios/DondeBailarMX/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png" -Force
   Copy-Item -Path "assets/icon.png" -Destination "ios/DondeBailarMX/Images.xcassets/AppIcon.appiconset/AppIcon-1024-opaque.png" -Force
   ```

### Opción 2: Usar Expo Prebuild

```bash
# Coloca tu icono en assets/icon.png
# Luego ejecuta:
npx expo prebuild --clean
```

Esto regenerará todos los iconos automáticamente.

---

## ✅ Checklist de Verificación

Antes de generar el build, verifica:

- [x] El archivo `AppIcon-1024-opaque.png` existe
- [x] El archivo tiene exactamente 1024x1024 píxeles
- [x] El archivo es PNG
- [x] El archivo no tiene transparencia (fondo opaco)
- [x] El `Contents.json` apunta correctamente al archivo

---

**Última actualización**: Enero 2025
