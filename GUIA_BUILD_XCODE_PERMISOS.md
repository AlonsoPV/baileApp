# 📦 Guía: Build desde Xcode para Corregir Permisos de Cámara

## ⚠️ Importante

**NO uses "Product > Analyze"** - Eso solo hace análisis estático de código, no genera un build.

**Usa "Product > Archive"** - Eso sí genera el build para App Store.

---

## 🚀 Proceso Completo desde Xcode

### **Paso 1: Abrir el Proyecto en Xcode**

1. Abre **Xcode** en tu Mac
2. Abre el workspace: `ios/DondeBailarMX.xcworkspace`
   - **⚠️ IMPORTANTE**: Abre el `.xcworkspace`, NO el `.xcodeproj`
   - Si abres el `.xcodeproj` por error, los pods no se cargarán correctamente
3. Espera a que Xcode termine de indexar el proyecto (puede tardar unos minutos)

### **Paso 2: Verificar Configuración de Permisos**

Antes de hacer el build, verifica que los permisos estén en `app.config.ts`:

1. Abre `app.config.ts` en tu editor
2. Verifica que tenga estas líneas en `ios.infoPlist`:
   ```typescript
   NSCameraUsageDescription: "Necesitamos acceso a la cámara para tomar fotos de perfil y eventos.",
   NSPhotoLibraryUsageDescription: "Necesitamos acceso a tu galería para seleccionar fotos de perfil y eventos.",
   NSPhotoLibraryAddUsageDescription: "Permite guardar fotos en tu galería cuando lo desees.",
   NSMicrophoneUsageDescription: "Necesitamos acceso al micrófono para grabar video cuando lo solicites.",
   ```

3. Si no están, agrégalas y guarda el archivo

### **Paso 3: Regenerar Proyecto iOS (si cambiaste app.config.ts)**

Si acabas de modificar `app.config.ts`, necesitas regenerar el proyecto iOS:

```bash
# Desde la raíz del proyecto
cd /ruta/a/baileapp-mobile
npx expo prebuild --platform ios --clean
```

O si usas pnpm:
```bash
pnpm prebuild:ios
```

Esto regenerará el proyecto iOS con los nuevos permisos.

### **Paso 4: Configurar Scheme y Destino en Xcode**

1. En la barra superior de Xcode, verifica:
   - **Scheme**: `DondeBailarMX` (debe estar seleccionado)
   - **Destination**: `Any iOS Device (arm64)` o un dispositivo físico conectado
   - **⚠️ NO uses el simulador** (no se puede crear archive desde simulador)

2. Si "Archive" está deshabilitado en el menú:
   - Cambia el Destination a "Any iOS Device"
   - O conecta un iPhone/iPad físico

### **Paso 5: Limpiar Build Anterior (Recomendado)**

1. Ve a **Product** → **Clean Build Folder** (o presiona `Cmd+Shift+K`)
2. Espera a que termine
3. Esto asegura que no haya archivos viejos que puedan causar problemas

### **Paso 6: Crear el Archive** ✅

1. Ve a **Product** → **Archive** (NO "Analyze")
   - Si "Archive" está deshabilitado, verifica el Paso 4
2. Espera a que Xcode compile el proyecto
   - Puede tardar varios minutos (5-15 minutos dependiendo de tu Mac)
   - Verás el progreso en la barra de estado de Xcode
3. Cuando termine, se abrirá automáticamente el **Organizer** con el archive creado

### **Paso 7: Verificar que el Archive se Creó Correctamente**

1. En el **Organizer** (ventana que se abrió automáticamente):
   - Deberías ver tu archive listado con la fecha y hora actual
   - El nombre debería ser algo como: `DondeBailarMX - [Fecha]`

2. **Verificar Info.plist** (opcional pero recomendado):
   - Haz clic derecho en el archive → **Show in Finder**
   - Navega a: `DondeBailarMX.xcarchive/Products/Applications/DondeBailarMX.app`
   - Haz clic derecho en `DondeBailarMX.app` → **Show Package Contents**
   - Abre `Info.plist` con un editor de texto
   - Busca y verifica que existan:
     - `NSCameraUsageDescription`
     - `NSPhotoLibraryUsageDescription`
     - `NSPhotoLibraryAddUsageDescription`
     - `NSMicrophoneUsageDescription`

### **Paso 8: Distribuir el App**

1. En el **Organizer**, selecciona el archive que acabas de crear
2. Haz clic en **"Distribute App"** o **"Distribuir App"**
3. Selecciona el método de distribución:
   - **App Store Connect** (para subir a TestFlight/App Store) ← **Usa esta opción**
   - Ad Hoc (para distribución limitada)
   - Enterprise (si tienes cuenta Enterprise)
   - Development (para desarrollo)

4. Para App Store, selecciona **"App Store Connect"**:
   - Haz clic en **"Next"**
   - Selecciona **"Upload"** (subir directamente a App Store Connect)
   - O **"Export"** (guardar .ipa localmente para subir después)
   - Haz clic en **"Next"**

5. **Si elegiste "Upload"**:
   - Xcode validará el archive
   - Si hay errores, los verás aquí
   - Si todo está bien, haz clic en **"Upload"**
   - Xcode subirá el .ipa directamente a App Store Connect
   - Puede tardar varios minutos

6. **Si elegiste "Export"**:
   - Elige dónde guardar el archivo `.ipa`
   - Haz clic en **"Export"**
   - El archivo se guardará en la ubicación que elegiste
   - Luego puedes subirlo manualmente con Transporter o EAS Submit

### **Paso 9: Verificar en App Store Connect**

1. Ve a [App Store Connect](https://appstoreconnect.apple.com)
2. Selecciona tu app: **DondeBailarMX**
3. Ve a **TestFlight** o **App Store** → **Versiones**
4. Verifica que el nuevo build aparezca
   - Puede tardar unos minutos en procesarse
   - Verás el estado: "Processing" → "Ready to Submit"

---

## 🔍 Verificar que los Permisos Están en el Build

### **Método 1: Desde Xcode (Antes de Subir)**

1. En el Organizer, haz clic derecho en el archive → **Show in Finder**
2. Navega a: `DondeBailarMX.xcarchive/Products/Applications/DondeBailarMX.app`
3. Haz clic derecho en `DondeBailarMX.app` → **Show Package Contents**
4. Abre `Info.plist` con un editor de texto
5. Busca estas claves:
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

### **Método 2: Desde Terminal (Después de Exportar .ipa)**

```bash
# Descomprimir el .ipa (es un .zip)
unzip DondeBailarMX.ipa -d temp_ipa

# Verificar Info.plist
plutil -p temp_ipa/Payload/DondeBailarMX.app/Info.plist | grep -i camera
plutil -p temp_ipa/Payload/DondeBailarMX.app/Info.plist | grep -i photo

# Limpiar
rm -rf temp_ipa
```

---

## ⚠️ Problemas Comunes

### **"Archive" está deshabilitado**

**Solución**:
1. Verifica que el Destination sea "Any iOS Device" (no simulador)
2. O conecta un iPhone/iPad físico
3. Ve a **Product** → **Destination** → Selecciona "Any iOS Device"

### **"No signing certificate found"**

**Solución**:
1. Ve a **Xcode** → **Preferences** → **Accounts**
2. Agrega tu Apple ID si no está
3. Selecciona tu cuenta → Haz clic en **"Download Manual Profiles"**
4. O en el proyecto, ve a **Signing & Capabilities** → Habilita **"Automatically manage signing"**

### **"Provisioning profile doesn't match"**

**Solución**:
1. Verifica que el Bundle ID en Xcode sea: `com.tuorg.dondebailarmx`
2. Ve a **Signing & Capabilities** → Habilita **"Automatically manage signing"**
3. O regenera el Provisioning Profile en Apple Developer Portal

### **El build falla con errores de permisos**

**Solución**:
1. Verifica que `app.config.ts` tenga los permisos correctos
2. Ejecuta `npx expo prebuild --platform ios --clean` para regenerar el proyecto
3. Vuelve a intentar el Archive

### **Los permisos no aparecen en Info.plist**

**Solución**:
1. Verifica que `app.config.ts` tenga los permisos en `ios.infoPlist`
2. Ejecuta `npx expo prebuild --platform ios --clean`
3. Abre el proyecto en Xcode nuevamente
4. Verifica en Xcode: Selecciona el proyecto → **Info** tab → Verifica que aparezcan los permisos

---

## 📋 Checklist Antes de Subir

- [ ] `app.config.ts` tiene los 4 permisos configurados
- [ ] Ejecuté `npx expo prebuild --platform ios --clean` (si modifiqué app.config.ts)
- [ ] Xcode está abierto con el `.xcworkspace` (no `.xcodeproj`)
- [ ] Scheme: `DondeBailarMX`
- [ ] Destination: `Any iOS Device` (no simulador)
- [ ] Archive se creó exitosamente
- [ ] Verifiqué que `Info.plist` tiene los permisos (opcional pero recomendado)
- [ ] Build se subió a App Store Connect o se exportó como .ipa

---

## 🎯 Resumen Rápido

1. **Abrir**: `ios/DondeBailarMX.xcworkspace` en Xcode
2. **Configurar**: Destination = "Any iOS Device"
3. **Limpiar**: Product → Clean Build Folder
4. **Archive**: Product → Archive (NO Analyze)
5. **Distribuir**: En Organizer → Distribute App → App Store Connect → Upload

---

## 📚 Referencias

- [Apple - Archive Your App](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)
- [Expo - Building for iOS](https://docs.expo.dev/build/introduction/)
- Documento relacionado: `FIX_CRASH_CAMERA_PERMISSIONS.md`

