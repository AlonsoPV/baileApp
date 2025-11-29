# 📱 Guía: Preparar App para iOS / App Store

Esta guía te ayudará a preparar y configurar tu app para publicarla en el App Store de Apple.

---

## ✅ PREREQUISITOS

Antes de comenzar, necesitas:

- [ ] **Cuenta de Apple Developer** ($99 USD/año)
  - Regístrate en: https://developer.apple.com/programs/
  - Puede tardar 24-48 horas en aprobarse
  
- [ ] **Cuenta de Expo/EAS configurada** (`eas login`)
  
- [ ] **Proyecto configurado con EAS** (`eas.json` y `app.config.ts`)

- [ ] **Assets preparados** (iconos, splash screen)

---

## 📋 PASO 1: Verificar y Actualizar Configuración

### 1.1 Verificar `app.config.ts`

Tu configuración de iOS ya está básicamente lista:

```typescript
ios: {
  bundleIdentifier: "com.tuorg.dondebailarmx",  // ✅ Ya configurado
  supportsTablet: true,  // ✅ Soporte para iPad
  infoPlist: {
    ITSAppUsesNonExemptEncryption: false,  // ✅ Ya configurado (HTTPS)
  },
}
```

**Recomendaciones adicionales que puedes agregar:**

```typescript
ios: {
  bundleIdentifier: "com.tuorg.dondebailarmx",
  supportsTablet: true,
  buildNumber: "1",  // Se incrementa automáticamente con autoIncrement
  infoPlist: {
    ITSAppUsesNonExemptEncryption: false,
    // Permisos opcionales (agregar según necesites):
    NSCameraUsageDescription: "Necesitamos acceso a la cámara para subir fotos de perfil",
    NSPhotoLibraryUsageDescription: "Necesitamos acceso a tus fotos para subir imágenes",
    NSLocationWhenInUseUsageDescription: "Usamos tu ubicación para mostrarte eventos cercanos",
  },
  // Configuración de App Store Connect
  config: {
    usesNonExemptEncryption: false,  // Ya está en infoPlist, pero también aquí
  },
}
```

### 1.2 Actualizar `eas.json`

Actualiza el `appleId` en `eas.json` con tu correo de Apple Developer:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "tu-correo@apple.com"  // ⚠️ Cambiar por tu correo real
      }
    }
  }
}
```

---

## 🎨 PASO 2: Preparar Assets para iOS

### 2.1 Icono de la App

**Requisitos:**
- Tamaño: 1024x1024 px
- Formato: PNG (sin transparencia)
- Ubicación: `./assets/icon.png`

**Verificar que existe:**
```bash
# Verificar que el icono existe
ls -la assets/icon.png
```

### 2.2 Splash Screen

**Requisitos:**
- Tamaño: 2048x2048 px (recomendado)
- Formato: PNG
- Ubicación: `./assets/splash-icon.png`

**Verificar que existe:**
```bash
# Verificar que el splash existe
ls -la assets/splash-icon.png
```

### 2.3 Capturas de Pantalla (Para App Store)

Necesitarás capturas de pantalla en diferentes tamaños:

**iPhone requeridos:**
- 6.7" (iPhone 14 Pro Max): 1290 x 2796 px
- 6.5" (iPhone 11 Pro Max): 1242 x 2688 px
- 5.5" (iPhone 8 Plus): 1242 x 2208 px

**iPad requeridos:**
- 12.9" iPad Pro: 2048 x 2732 px
- 11" iPad Pro: 1668 x 2388 px

**Puedes generarlas después del primer build**, pero es bueno tenerlas listas.

---

## 🔐 PASO 3: Configurar Apple Developer Account

### 3.1 Crear App ID en Apple Developer

1. **Ve a Apple Developer Portal:**
   - https://developer.apple.com/account/

2. **Crea un App ID:**
   - Ve a "Certificates, Identifiers & Profiles"
   - Clic en "Identifiers" → "+"
   - Selecciona "App IDs" → "Continue"
   - Selecciona "App"
   - Description: "Donde Bailar MX"
   - Bundle ID: `com.tuorg.dondebailarmx` (debe coincidir con `app.config.ts`)
   - Selecciona las capacidades que necesites (Push Notifications, etc.)
   - Clic en "Continue" → "Register"

### 3.2 Crear App en App Store Connect

1. **Ve a App Store Connect:**
   - https://appstoreconnect.apple.com/

2. **Crea una nueva app:**
   - Clic en "My Apps" → "+" → "New App"
   - Platform: iOS
   - Name: "Donde Bailar MX"
   - Primary Language: Spanish (México) o English
   - Bundle ID: Selecciona `com.tuorg.dondebailarmx`
   - SKU: Un identificador único (ej: `dondebailarmx-ios-001`)
   - User Access: Full Access (o según tu organización)

---

## 🏗️ PASO 4: Generar el Build de iOS

### Opción A: Usando el Script (Recomendado)

```bash
# Desde la raíz del proyecto
pnpm build:prod:ios
```

### Opción B: Comando Directo

```bash
npx eas-cli build --profile production --platform ios
```

### Proceso Interactivo

EAS te preguntará:

1. **¿Quieres crear credenciales nuevas?**
   - Primera vez: Selecciona **"Set up new credentials"**
   - Si ya tienes: Selecciona **"Use existing credentials"**

2. **¿Quieres que EAS gestione las credenciales?**
   - Recomendado: **"Yes"** (EAS las guarda de forma segura)

3. **Espera a que termine el build**
   - El proceso puede tardar 15-30 minutos
   - EAS construirá tu app en la nube
   - Recibirás un enlace para descargar el `.ipa` cuando termine

---

## 📥 PASO 5: Descargar y Subir a App Store Connect

### Opción A: Subir Manualmente

1. **Descarga el `.ipa` desde EAS**
   - EAS te dará un enlace directo
   - O ve al dashboard: https://expo.dev/accounts/[tu-cuenta]/projects/[tu-proyecto]/builds

2. **Sube a App Store Connect:**
   - Ve a App Store Connect → Tu App → "TestFlight" o "App Store"
   - Clic en "+" para crear nueva versión
   - Arrastra y suelta el archivo `.ipa`
   - O usa Transporter (app de Apple)

### Opción B: Usar EAS Submit (Automático)

1. **Configura tu Apple ID en `eas.json`:**
   ```json
   {
     "submit": {
       "production": {
         "ios": {
           "appleId": "tu-correo@apple.com"
         }
       }
     }
   }
   ```

2. **Ejecuta:**
   ```bash
   pnpm submit:ios
   ```
   
   O:
   ```bash
   npx eas-cli submit --platform ios --profile production
   ```

3. **EAS subirá automáticamente el `.ipa` a App Store Connect**

---

## 📝 PASO 6: Completar Información en App Store Connect

### Información Requerida:

1. **Información de la App:**
   - Nombre (hasta 30 caracteres)
   - Subtítulo (hasta 30 caracteres)
   - Descripción (hasta 4000 caracteres)
   - Palabras clave (hasta 100 caracteres)
   - Categoría principal y secundaria
   - URL de soporte
   - URL de marketing (opcional)

2. **Precio y Disponibilidad:**
   - Precio (gratis o de pago)
   - Países donde estará disponible

3. **Privacidad:**
   - Política de privacidad (URL requerida)
   - Información sobre recopilación de datos
   - Tipos de datos que recopilas

4. **Contenido:**
   - Capturas de pantalla (requeridas)
   - Icono de la app (1024x1024)
   - Video promocional (opcional)

5. **Información de Revisión:**
   - Notas para el revisor
   - Información de contacto
   - Cuenta de demostración (si aplica)

---

## 🔍 PASO 7: Revisión de Apple

Después de subir tu app:

1. **Estado en App Store Connect:**
   - "Waiting for Review" → Apple está revisando
   - "In Review" → Revisión en proceso
   - "Ready for Sale" → Aprobada y lista
   - "Rejected" → Necesita correcciones

2. **Tiempo de revisión:**
   - Primera vez: 1-3 días
   - Actualizaciones: 24-48 horas

3. **Si es rechazada:**
   - Apple te enviará un email con razones
   - Corrige los problemas
   - Responde en App Store Connect
   - Vuelve a enviar

---

## ⚙️ CONFIGURACIÓN ADICIONAL

### Permisos iOS (Info.plist)

Si tu app necesita permisos, agrégalos en `app.config.ts`:

```typescript
ios: {
  infoPlist: {
    NSCameraUsageDescription: "Necesitamos acceso a la cámara para subir fotos",
    NSPhotoLibraryUsageDescription: "Necesitamos acceso a tus fotos para subir imágenes",
    NSLocationWhenInUseUsageDescription: "Usamos tu ubicación para mostrarte eventos cercanos",
    NSLocationAlwaysUsageDescription: "Usamos tu ubicación en segundo plano para notificarte de eventos cercanos",
    NSMicrophoneUsageDescription: "Necesitamos acceso al micrófono para grabar videos",
  },
}
```

### Configurar Push Notifications (Opcional)

Si quieres usar notificaciones push:

1. **Habilita Push Notifications en Apple Developer:**
   - Ve a tu App ID
   - Marca "Push Notifications"
   - Configura certificados APNs

2. **EAS manejará los certificados automáticamente** si usas `eas build`

### Configurar In-App Purchases (Opcional)

Si planeas vender contenido dentro de la app:

1. **Crea productos en App Store Connect**
2. **Configura StoreKit en tu código**
3. **Prueba con sandbox**

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Bundle identifier no disponible"

**Solución:**
- Verifica que el Bundle ID esté registrado en Apple Developer
- Debe coincidir exactamente con `app.config.ts`: `com.tuorg.dondebailarmx`

### Error: "No se encontraron credenciales"

**Solución:**
- Primera vez: Selecciona "Set up new credentials"
- EAS creará automáticamente certificados y perfiles

### Error: "Version code ya existe"

**Solución:**
- EAS incrementa automáticamente con `autoIncrement: true`
- Si persiste, incrementa manualmente la versión en `app.config.ts`

### Build Tarda Mucho

**Normal:**
- Los builds de iOS pueden tardar 15-30 minutos
- EAS construye en la nube (macOS)
- Puedes ver el progreso en el dashboard de EAS

---

## 📚 RECURSOS ADICIONALES

- [Documentación de EAS Build para iOS](https://docs.expo.dev/build/introduction/)
- [Guía de App Store Connect](https://developer.apple.com/app-store-connect/)
- [Requisitos de App Store](https://developer.apple.com/app-store/review/guidelines/)
- [Guía de Revisión de Apps](https://developer.apple.com/app-store/review/)

---

## ✅ CHECKLIST ANTES DE GENERAR EL BUILD

- [ ] Cuenta de Apple Developer activa ($99 USD/año)
- [ ] Bundle ID registrado en Apple Developer: `com.tuorg.dondebailarmx`
- [ ] App creada en App Store Connect
- [ ] Versión actualizada en `app.config.ts`
- [ ] `appleId` actualizado en `eas.json`
- [ ] Icono preparado (1024x1024 px)
- [ ] Splash screen preparado
- [ ] Iniciado sesión en EAS (`eas login`)
- [ ] Política de privacidad lista (URL)
- [ ] Descripción de la app preparada

---

## 🚀 COMANDO RÁPIDO

Para generar el build de iOS rápidamente:

```bash
# 1. Asegúrate de estar en la raíz del proyecto
cd /ruta/a/baileapp-mobile

# 2. Actualiza appleId en eas.json (si no lo has hecho)
# Edita: eas.json → submit.production.ios.appleId

# 3. Genera el build
pnpm build:prod:ios

# 4. Sigue las instrucciones interactivas
# 5. Descarga el .ipa cuando termine
# 6. Súbelo a App Store Connect
```

---

## 📝 NOTAS IMPORTANTES

1. **Bundle ID es único:** Una vez que uses `com.tuorg.dondebailarmx` en App Store, no puedes cambiarlo fácilmente.

2. **Versión independiente:** iOS y Android tienen versiones independientes. Puedes tener `1.0.0` en iOS y `1.0.5` en Android.

3. **Revisión más estricta:** Apple es más estricto que Google Play en la revisión. Asegúrate de:
   - Tener política de privacidad clara
   - Cumplir con las guías de diseño de Apple
   - Probar bien la app antes de enviar

4. **TestFlight:** Puedes usar TestFlight para probar la app antes de publicarla:
   - Genera un build de producción
   - Súbelo a App Store Connect
   - Invita testers desde TestFlight

---

**Última actualización:** Enero 2025

