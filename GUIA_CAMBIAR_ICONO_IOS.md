# 🎨 Guía: Cambiar el Icono de la App para TestFlight

Esta guía te explica cómo cambiar el icono de la app para que aparezca correctamente en TestFlight y App Store.

---

## 📍 Dónde se Usa el Icono

En proyectos Expo con código nativo (como este), el icono para **TestFlight y App Store** se toma del proyecto iOS nativo, **NO** del archivo `app.config.ts`.

### Iconos en el Proyecto

1. **Para Expo/desarrollo**: `./assets/icon.png` (definido en `app.config.ts`)
   - Se usa en Expo Go y desarrollo
   - **NO se usa** en builds de producción para TestFlight

2. **Para TestFlight/App Store**: `ios/DondeBailarMX/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png`
   - Este es el icono que verás en TestFlight
   - Tamaño requerido: **1024x1024 px**

---

## 🎯 Opción 1: Reemplazar Manualmente (Rápido)

### Paso 1: Preparar tu Icono

**Requisitos del icono:**
- ✅ Tamaño: **1024x1024 píxeles** (exacto)
- ✅ Formato: **PNG**
- ✅ **Sin transparencia** (fondo sólido)
- ✅ **Sin esquinas redondeadas** (iOS las aplica automáticamente)
- ✅ Sin texto pequeño (no se verá bien en tamaños pequeños)

### Paso 2: Reemplazar el Archivo

1. **Reemplaza el archivo existente:**
   ```
   ios/DondeBailarMX/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
   ```

2. **Asegúrate de que el nuevo archivo tenga:**
   - El mismo nombre: `App-Icon-1024x1024@1x.png`
   - El mismo tamaño: 1024x1024 px
   - Formato PNG

### Paso 3: Actualizar También el Icono de Expo (Opcional pero Recomendado)

También reemplaza `./assets/icon.png` con el mismo icono para mantener consistencia:

```
assets/icon.png
```

---

## 🎯 Opción 2: Usar Expo para Generar Iconos Automáticamente

Si prefieres que Expo genere todos los tamaños automáticamente desde un solo archivo:

### Paso 1: Preparar tu Icono

Coloca tu icono en `./assets/icon.png`:
- Tamaño: 1024x1024 px (o mayor, debe ser cuadrado)
- Formato: PNG
- Sin transparencia

### Paso 2: Ejecutar Prebuild

Ejecuta este comando para que Expo actualice los iconos nativos:

```bash
npx expo prebuild --clean
```

Esto generará/actualizará los iconos en:
- `ios/DondeBailarMX/Images.xcassets/AppIcon.appiconset/`
- `android/app/src/main/res/` (para Android)

### Paso 3: Verificar

Verifica que el icono se haya actualizado:

```bash
# Ver el archivo en iOS
ls -lh ios/DondeBailarMX/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
```

---

## 🚀 Paso 4: Reconstruir y Subir a TestFlight

Después de cambiar el icono, necesitas hacer un nuevo build:

### Opción A: Build con EAS (Recomendado)

```bash
# Build para producción
pnpm build:prod:ios

# O directamente con EAS
eas build --profile production --platform ios
```

### Opción B: Build Local (Solo para pruebas)

Si tienes Xcode configurado:

```bash
# Abrir el proyecto en Xcode
open ios/DondeBailarMX.xcworkspace

# O hacer build desde la terminal
cd ios && xcodebuild -workspace DondeBailarMX.xcworkspace -scheme DondeBailarMX -configuration Release
```

---

## ✅ Verificar que el Icono Está Correcto

### Antes del Build

1. **Abre el proyecto en Xcode:**
   ```bash
   open ios/DondeBailarMX.xcworkspace
   ```

2. **Ve a la configuración del icono:**
   - Selecciona el proyecto "DondeBailarMX" en el navegador
   - Ve a la pestaña "General"
   - Busca "App Icons and Launch Screen"
   - Verifica que el icono aparezca correctamente

### Después del Build en TestFlight

1. Ve a [App Store Connect](https://appstoreconnect.apple.com/)
2. Abre tu app
3. Ve a "TestFlight"
4. Descarga la build y verifica que el icono sea el correcto

---

## 🎨 Recomendaciones de Diseño

### Buenas Prácticas

- ✅ Usa colores contrastantes
- ✅ Diseño simple y reconocible
- ✅ Evita texto (no se lee en tamaños pequeños)
- ✅ Prueba cómo se ve en diferentes tamaños (20x20 hasta 1024x1024)
- ✅ Asegúrate de que funcione en fondo claro y oscuro

### Herramientas Útiles

- **Preview en diferentes tamaños**: Usa [App Icon Generator](https://www.appicon.co/) o [Icon Kitchen](https://icon.kitchen/)
- **Validar formato**: Asegúrate de que el PNG no tenga transparencia

---

## ⚠️ Notas Importantes

1. **El icono NO se actualiza con OTA Updates**: Siempre necesitas hacer un nuevo build
2. **TestFlight puede tardar unos minutos** en mostrar el nuevo icono después de subir
3. **Si usas `expo prebuild --clean`**, se regenerarán TODOS los archivos nativos (no solo iconos)
4. **Para cambios menores**, es mejor reemplazar manualmente el archivo

---

## 🔄 Si Necesitas Cambiar el Icono Frecuentemente

Si planeas cambiar el icono varias veces, puedes automatizar el proceso:

1. Mantén tu icono master en `./assets/icon.png`
2. Ejecuta `npx expo prebuild` antes de cada build
3. O crea un script que copie automáticamente el icono

```bash
# Ejemplo de script (crear scripts/update-ios-icon.sh)
cp ./assets/icon.png ./ios/DondeBailarMX/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
```

---

## 📝 Resumen Rápido

**Para cambiar el icono de TestFlight:**

1. ✅ Prepara tu icono (1024x1024 px, PNG, sin transparencia)
2. ✅ Reemplaza `ios/DondeBailarMX/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png`
3. ✅ (Opcional) Reemplaza también `./assets/icon.png`
4. ✅ Haz un nuevo build: `pnpm build:prod:ios`
5. ✅ Sube a TestFlight

¡Listo! 🎉

