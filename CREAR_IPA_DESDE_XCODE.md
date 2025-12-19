# 📦 Guía: Crear Archivo .ipa desde Xcode

## 📋 Objetivo

Generar un archivo `.ipa` desde Xcode para subirlo a TestFlight o App Store Connect.

---

## ✅ Método 1: Archive y Export (Recomendado)

### **Paso 1: Abrir el Proyecto en Xcode**

1. Abre **Xcode** en tu Mac
2. Abre el workspace: `ios/DondeBailarMX.xcworkspace`
   - **Importante**: Abre el `.xcworkspace`, NO el `.xcodeproj`
3. Espera a que Xcode indexe el proyecto

### **Paso 2: Configurar el Scheme y Destino**

1. En la barra superior de Xcode, selecciona:
   - **Scheme**: `DondeBailarMX`
   - **Destination**: `Any iOS Device (arm64)` o un dispositivo físico conectado
   - **NO uses el simulador** (no se puede crear .ipa desde simulador)

### **Paso 3: Limpiar el Build (Opcional pero Recomendado)**

1. Ve a **Product** → **Clean Build Folder** (o presiona `Cmd+Shift+K`)
2. Espera a que termine

### **Paso 4: Crear el Archive**

1. Ve a **Product** → **Archive**
2. Espera a que Xcode compile el proyecto (puede tardar varios minutos)
3. Cuando termine, se abrirá automáticamente el **Organizer** con el archive

### **Paso 5: Exportar el .ipa**

1. En el **Organizer** (ventana que se abrió automáticamente):
   - Selecciona el archive que acabas de crear
   - Haz clic en **"Distribute App"** o **"Distribuir App"**

2. Selecciona el método de distribución:
   - **App Store Connect** (para subir a TestFlight/App Store)
   - **Ad Hoc** (para distribución limitada)
   - **Enterprise** (si tienes cuenta Enterprise)
   - **Development** (para desarrollo)

3. Para TestFlight, selecciona **"App Store Connect"**:
   - Haz clic en **"Next"**
   - Selecciona **"Upload"** (subir directamente) o **"Export"** (guardar .ipa localmente)
   - Si eliges **"Export"**, elige dónde guardar el archivo
   - Haz clic en **"Next"** y luego **"Export"**

4. El archivo `.ipa` se guardará en la ubicación que elegiste

---

## ✅ Método 2: Usar Command Line (xcodebuild)

Si prefieres usar la terminal:

### **Paso 1: Navegar al Directorio del Proyecto**

```bash
cd /ruta/a/baileapp-mobile/ios
```

### **Paso 2: Crear el Archive**

```bash
xcodebuild archive \
  -workspace DondeBailarMX.xcworkspace \
  -scheme DondeBailarMX \
  -configuration Release \
  -archivePath ~/Desktop/DondeBailarMX.xcarchive \
  CODE_SIGN_IDENTITY="Apple Development" \
  DEVELOPMENT_TEAM="TU_TEAM_ID"
```

**Nota**: Reemplaza `TU_TEAM_ID` con tu Team ID de Apple Developer.

### **Paso 3: Exportar el .ipa**

```bash
xcodebuild -exportArchive \
  -archivePath ~/Desktop/DondeBailarMX.xcarchive \
  -exportPath ~/Desktop \
  -exportOptionsPlist ExportOptions.plist
```

**Nota**: Necesitas crear un archivo `ExportOptions.plist` con la configuración de exportación.

---

## ✅ Método 3: Desde Xcode Cloud (Ya lo estás usando)

Si estás usando Xcode Cloud (como mencionaste):

1. **Espera a que termine el build** en Xcode Cloud
2. **Ve a App Store Connect** → **Xcode Cloud** → Tu workflow
3. **Descarga el .ipa** desde la sección "Artifacts"
4. **Listo** - Ya tienes el .ipa para subir a TestFlight

---

## 🔧 Configuración Requerida Antes de Crear .ipa

### **1. Certificados y Provisioning Profiles**

Asegúrate de tener:
- ✅ Certificado de distribución válido
- ✅ Provisioning Profile configurado
- ✅ Team ID configurado en Xcode

**Verificar en Xcode**:
1. Selecciona el proyecto en el navegador
2. Ve a **Signing & Capabilities**
3. Verifica que **"Automatically manage signing"** esté marcado
4. O configura manualmente el **Provisioning Profile**

### **2. Bundle Identifier**

Verifica que el Bundle ID sea correcto:
- Debe ser: `com.tuorg.dondebailarmx`
- Debe coincidir con el configurado en App Store Connect

### **3. Versión y Build Number**

Verifica en `app.config.ts`:
- **version**: `1.0.1` (o la versión que quieras)
- El build number se incrementa automáticamente

---

## 📋 Checklist Antes de Crear .ipa

- [ ] Xcode está actualizado
- [ ] Workspace abierto (`.xcworkspace`, no `.xcodeproj`)
- [ ] Scheme configurado: `DondeBailarMX`
- [ ] Destination: `Any iOS Device` (no simulador)
- [ ] Certificados y Provisioning Profiles configurados
- [ ] Bundle ID correcto: `com.tuorg.dondebailarmx`
- [ ] Versión actualizada en `app.config.ts`

---

## 🚀 Después de Crear el .ipa

### **Opción 1: Subir Directamente desde Xcode**

1. En el Organizer, después de crear el archive
2. Selecciona **"Distribute App"** → **"App Store Connect"** → **"Upload"**
3. Xcode subirá el .ipa directamente a TestFlight

### **Opción 2: Subir Manualmente con EAS Submit**

```bash
cd /ruta/a/baileapp-mobile
eas submit --platform ios --path /ruta/al/DondeBailarMX.ipa
```

### **Opción 3: Subir con Transporter**

1. Descarga **Transporter** desde Mac App Store
2. Arrastra el archivo `.ipa`
3. Haz clic en **"Deliver"**

---

## 🔍 Troubleshooting

### **Problema: "No signing certificate found"**

**Solución**:
1. Ve a **Xcode** → **Preferences** → **Accounts**
2. Agrega tu Apple ID si no está
3. Haz clic en **"Download Manual Profiles"**
4. O habilita **"Automatically manage signing"** en el proyecto

### **Problema: "Provisioning profile doesn't match"**

**Solución**:
1. Verifica que el Bundle ID en Xcode coincida con App Store Connect
2. Regenera el Provisioning Profile en Apple Developer
3. O habilita **"Automatically manage signing"**

### **Problema: "Archive" está deshabilitado**

**Solución**:
1. Verifica que el Destination sea un dispositivo físico o "Any iOS Device"
2. NO uses el simulador
3. Conecta un iPhone/iPad o selecciona "Any iOS Device"

### **Problema: El .ipa no se genera**

**Solución**:
1. Verifica que el archive se haya creado correctamente
2. Revisa los logs de Xcode para ver errores
3. Asegúrate de tener espacio en disco suficiente

---

## 📝 Notas Importantes

1. **Siempre usa el .xcworkspace**, nunca el .xcodeproj directamente
2. **No uses el simulador** para crear .ipa (solo dispositivos físicos)
3. **El proceso puede tardar 10-30 minutos** dependiendo del tamaño del proyecto
4. **Asegúrate de tener una conexión a internet** estable si subes directamente

---

**Última actualización:** Diciembre 2025

