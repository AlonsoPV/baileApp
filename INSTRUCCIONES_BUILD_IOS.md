# 📱 Instrucciones para Build de iOS

## 🎯 Objetivo

Generar un build de iOS (`.ipa`) que incluya los permisos de cámara y pueda subirse a TestFlight/App Store.

---

## ✅ Pre-requisitos

Antes de empezar, verifica:

- [ ] Tienes cuenta de **Apple Developer** activa ($99 USD/año)
- [ ] Bundle ID `com.tuorg.dondebailarmx` está registrado en Apple Developer
- [ ] App creada en **App Store Connect**
- [ ] Estás logueado en EAS: `eas login`
- [ ] Versión actualizada en `app.config.ts` (actualmente: `1.0.2`)
- [ ] Permisos de cámara configurados en `app.config.ts` ✅ (ya están)

---

## 🚀 Método 1: EAS Build (Recomendado - Más Fácil)

### Paso 1: Verificar Configuración

```bash
# Desde la raíz del proyecto
cd /ruta/a/baileapp-mobile

# Verifica que estés logueado en EAS
eas whoami

# Si no estás logueado:
eas login
```

### Paso 2: Verificar Versión

Abre `app.config.ts` y verifica:

```typescript
version: "1.0.2",  // ✅ Debe ser 1.0.2 o superior
```

### Paso 3: Generar Build

```bash
# Opción A: Usar el script (recomendado)
pnpm build:prod:ios

# Opción B: Comando directo
eas build --profile production --platform ios
```

### Paso 4: Proceso Interactivo

EAS te preguntará:

1. **¿Quieres crear credenciales nuevas?**
   - Si es la primera vez: **"Set up new credentials"**
   - Si ya tienes credenciales: **"Use existing credentials"**

2. **¿Quieres que EAS gestione las credenciales?**
   - Recomendado: **"Yes"** (EAS las guarda de forma segura)

3. **Espera a que termine el build**
   - ⏱️ Tiempo estimado: **15-30 minutos**
   - EAS construirá tu app en la nube
   - Recibirás un enlace para descargar el `.ipa` cuando termine

### Paso 5: Descargar el Build

Cuando termine, EAS te dará:
- Un **enlace directo** para descargar el `.ipa`
- O ve al dashboard: https://expo.dev/accounts/[tu-cuenta]/projects/[tu-proyecto]/builds

### Paso 6: Subir a TestFlight/App Store

**Opción A: Automático con EAS Submit**

```bash
# Sube automáticamente a App Store Connect
pnpm submit:ios

# O directamente:
eas submit --platform ios --profile production
```

**Opción B: Manual desde App Store Connect**

1. Ve a [App Store Connect](https://appstoreconnect.apple.com/)
2. Selecciona tu app → **TestFlight** o **App Store**
3. Clic en **"+"** para crear nueva versión
4. Arrastra y suelta el archivo `.ipa`
5. O usa **Transporter** (app de Apple)

---

## 🛠️ Método 2: Build Local con Xcode (Avanzado)

Si prefieres hacer el build localmente en tu Mac:

### Paso 1: Abrir Proyecto en Xcode

```bash
# Abre el workspace (NO el .xcodeproj)
open ios/DondeBailarMX.xcworkspace
```

⚠️ **IMPORTANTE**: Abre el `.xcworkspace`, NO el `.xcodeproj`

### Paso 2: Verificar Configuración en Xcode

1. Selecciona el target **DondeBailarMX** en el navegador izquierdo
2. Ve a la pestaña **"Signing & Capabilities"**
3. Verifica:
   - **Team**: Tu equipo de desarrollo (RBFLD93SSL)
   - **Bundle Identifier**: `com.tuorg.dondebailarmx`
   - **Automatically manage signing**: ✅ Marcado (recomendado)

### Paso 3: Verificar Versión

1. Ve a la pestaña **"General"**
2. Verifica:
   - **Version**: `1.0.2`
   - **Build**: `113` (o superior)

### Paso 4: Seleccionar Destino

En la barra superior de Xcode:
- **Scheme**: `DondeBailarMX`
- **Destination**: `Any iOS Device` (NO uses simulador)

### Paso 5: Crear Archive

1. Menú: **Product** → **Archive**
2. ⏱️ Espera a que termine (puede tardar 5-10 minutos)
3. Se abrirá el **Organizer** automáticamente

### Paso 6: Distribuir el Archive

1. En el **Organizer**, selecciona tu archive
2. Clic en **"Distribute App"**
3. Selecciona: **"App Store Connect"**
4. Selecciona: **"Upload"**
5. Sigue las instrucciones para subir a TestFlight

---

## 🔍 Verificación Post-Build

Después de generar el build, verifica que incluya los permisos:

### Si tienes el .ipa descargado:

```bash
# Extrae el Info.plist del .ipa
unzip -q YourApp.ipa
plutil -p Payload/YourApp.app/Info.plist | grep -A 1 "NSCameraUsageDescription"
```

Deberías ver:
```
"NSCameraUsageDescription" => "Necesitamos acceso a la cámara para tomar fotos de perfil y eventos."
```

### Si usas Xcode:

1. Abre el archive en el Organizer
2. Clic derecho → **"Show in Finder"**
3. Clic derecho en el `.xcarchive` → **"Show Package Contents"**
4. Navega a: `Products/Applications/DondeBailarMX.app/Info.plist`
5. Abre el `Info.plist` y verifica que tenga los 4 permisos

---

## ⚠️ Troubleshooting

### Error: "No signing certificate found"

**Solución**:
1. Ve a **Xcode** → **Preferences** → **Accounts**
2. Agrega tu Apple ID si no está
3. Selecciona tu cuenta → **"Download Manual Profiles"**
4. O habilita **"Automatically manage signing"** en el proyecto

### Error: "Provisioning profile doesn't match"

**Solución**:
1. Verifica que el Bundle ID en Xcode coincida: `com.tuorg.dondebailarmx`
2. Regenera el Provisioning Profile en Apple Developer
3. O habilita **"Automatically manage signing"** en Xcode

### Error: "Archive" está deshabilitado

**Solución**:
1. Verifica que el Destination sea **"Any iOS Device"** (NO simulador)
2. Conecta un iPhone/iPad físico o selecciona "Any iOS Device"

### Error: Build falla por permisos faltantes

**Solución**:
- El script de verificación que agregamos debería **fallar el build** si faltan permisos
- Verifica que `ios/DondeBailarMX/Info.plist` tenga los 4 permisos
- Regenera el proyecto: `npx expo prebuild --platform ios --clean`

---

## 📋 Checklist Final

Antes de subir a TestFlight/App Store:

- [ ] Build generado exitosamente
- [ ] Verificado que el `.ipa` incluye los 4 permisos de privacidad
- [ ] Versión correcta: `1.0.2` (o superior)
- [ ] Build number incrementado: `113` (o superior)
- [ ] Probado en dispositivo (si es posible)
- [ ] Listo para subir a TestFlight

---

## 🎯 Comando Rápido (Resumen)

```bash
# 1. Desde la raíz del proyecto
cd /ruta/a/baileapp-mobile

# 2. Verifica que estés logueado
eas whoami

# 3. Genera el build
pnpm build:prod:ios

# 4. Espera a que termine (15-30 min)

# 5. Descarga el .ipa desde EAS

# 6. Sube a TestFlight (automático)
pnpm submit:ios

# O manualmente desde App Store Connect
```

---

## 📚 Referencias

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Apple Developer Portal](https://developer.apple.com/)
- [Expo - iOS Permissions](https://docs.expo.dev/guides/permissions/#ios)

---

## 💡 Notas Importantes

1. **Versión automática**: EAS puede incrementar automáticamente el build number si `autoIncrement: true` está en `eas.json` ✅ (ya está)

2. **Permisos verificados**: El build ahora incluye un script que **falla si faltan permisos**, así que no podrás generar un build sin ellos ✅

3. **TestFlight primero**: Siempre prueba en TestFlight antes de publicar en App Store

4. **Tiempo de procesamiento**: Después de subir a App Store Connect, Apple puede tardar 10-30 minutos en procesar el build antes de que esté disponible en TestFlight

---

**Última actualización**: Enero 2025  
**Versión actual**: 1.0.2  
**Build number**: 113

