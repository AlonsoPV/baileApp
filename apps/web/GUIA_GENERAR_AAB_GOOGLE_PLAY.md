# 📱 Guía: Generar Archivo AAB para Google Play Console

Esta guía te ayudará a generar el archivo AAB (Android App Bundle) necesario para subir tu app a Google Play Console.

---
f
## ✅ PREREQUIfSITOS

Antes de comenzar, asegúrate de tener:

- [x] Cuenta de Expo/EAS configurada (`eas login`)
- [x] Proyecto configurado con EAS (`eas.json` y `app.config.ts`)
- [x] Credenciales de Google Play Console (si vas a usar `eas submit`)
- [x] Variables de entorno configuradas (Supabase, etc.)

---

## 📋 PASO 1: Verificar Configuración

### 1.1 Verificar `app.config.ts`

Asegúrate de que tu configuración de Android esté correcta:

```typescript
android: {
  package: "com.tuorg.dondebailarmx.app",  // ✅ Debe coincidir con Google Play
  adaptiveIcon: {
    foregroundImage: "./assets/adaptive-icon.png",
    backgroundColor: "#000000",
  },
  // ...
}
```

### 1.2 Verificar `eas.json`

Tu archivo `eas.json` ya tiene el perfil de producción configurado:

```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "android": {
        "image": "latest"
      }
    }
  }
}
```

### 1.3 Verificar Versión

Revisa la versión en `app.config.ts`:

```typescript
version: "1.0.0",  // ✅ Actualiza si es necesario
```

**Nota:** Google Play requiere que cada nueva versión tenga un `versionCode` mayor. EAS incrementa esto automáticamente con `autoIncrement: true`.

---

## 🔐 PASO 2: Iniciar Sesión en EAS (si no lo has hecho)

```bash
npx eas-cli login
```

O si ya tienes `eas-cli` instalado globalmente:

```bash
eas login
```

---

## 🏗️ PASO 3: Generar el AAB

### Opción A: Usando el Script de package.json (Recomendado)

```bash
pnpm build:prod:android
```

O si estás usando npm:

```bash
npm run build:prod:android
```

### Opción B: Comando Directo

```bash
npx eas-cli build --profile production --platform android
```

---

## 📝 PASO 4: Seguir el Proceso Interactivo

EAS te preguntará:

1. **¿Quieres crear un nuevo keystore?**
   - Si es la primera vez: Selecciona **"Create a new one"**
   - Si ya tienes uno: Selecciona **"Use existing"**

2. **¿Quieres subir las credenciales a EAS?**
   - Recomendado: **"Yes"** (EAS las guarda de forma segura)

3. **¿Quieres generar un AAB o APK?**
   - Selecciona: **"AAB"** (requerido para Google Play)

4. **Espera a que termine el build**
   - El proceso puede tardar 10-20 minutos
   - EAS construirá tu app en la nube
   - Recibirás un enlace para descargar el AAB cuando termine

---

## 📥 PASO 5: Descargar el AAB

Una vez que el build termine:

1. **Opción A: Desde el enlace que te da EAS**
   - EAS te mostrará un enlace directo para descargar
   - Haz clic y descarga el archivo `.aab`

2. **Opción B: Desde el Dashboard de EAS**
   - Ve a: https://expo.dev/accounts/[tu-cuenta]/projects/[tu-proyecto]/builds
   - Busca el build más reciente
   - Haz clic en "Download" para descargar el AAB

---

## 📤 PASO 6: Subir a Google Play Console

### Opción A: Subir Manualmente

1. **Ve a Google Play Console**
   - https://play.google.com/console

2. **Selecciona tu app** (o créala si es la primera vez)

3. **Ve a "Producción" → "Crear nueva versión"**

4. **Sube el archivo AAB**
   - Arrastra y suelta el archivo `.aab` descargado
   - O haz clic en "Subir" y selecciona el archivo

5. **Completa la información requerida:**
   - Notas de la versión
   - Capturas de pantalla (si es la primera vez)
   - Descripción de la app
   - Categoría
   - Etc.

6. **Revisa y publica**

### Opción B: Usar EAS Submit (Automático)

Si tienes configurado el servicio de cuenta de Google:

1. **Obtén el archivo de cuenta de servicio de Google:**
   - Ve a Google Play Console → Configuración → Acceso API
   - Crea una cuenta de servicio
   - Descarga el archivo JSON

2. **Guarda el archivo como `google-service-account.json` en la raíz del proyecto**

3. **Ejecuta:**
   ```bash
   pnpm submit:android
   ```
   
   O:
   ```bash
   npx eas-cli submit --platform android --profile production
   ```

4. **EAS subirá automáticamente el AAB a Google Play Console**

---

## 🔍 PASO 7: Verificar el Build

Después de subir el AAB:

1. **En Google Play Console:**
   - Ve a "Producción" → "Versiones"
   - Verifica que el AAB se haya procesado correctamente
   - Revisa si hay errores o advertencias

2. **Revisa los requisitos:**
   - Política de privacidad configurada
   - Contenido calificado
   - Información de la app completa
   - Capturas de pantalla
   - Icono y gráficos

---

## ⚙️ CONFIGURACIÓN ADICIONAL

### Configurar Build Number Automático

Tu `eas.json` ya tiene `autoIncrement: true`, lo que significa que EAS incrementará automáticamente el `versionCode` en cada build.

### Actualizar Versión Manualmente

Si necesitas actualizar la versión manualmente, edita `app.config.ts`:

```typescript
version: "1.0.1",  // Incrementa según semver
```

### Ver Historial de Builds

```bash
npx eas-cli build:list
```

### Ver Detalles de un Build Específico

```bash
npx eas-cli build:view [BUILD_ID]
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "No se encontró el keystore"

**Solución:**
- Si es la primera vez, selecciona "Create a new one"
- Si ya tienes uno, asegúrate de haberlo subido a EAS anteriormente

### Error: "Package name no coincide"

**Solución:**
- Verifica que el `package` en `app.config.ts` coincida exactamente con el de Google Play Console
- El package name debe ser: `com.tuorg.dondebailarmx.app`

### Error: "Version code ya existe"

**Solución:**
- EAS debería incrementar automáticamente con `autoIncrement: true`
- Si persiste, incrementa manualmente la versión en `app.config.ts`

### Build Tarda Mucho

**Normal:**
- Los builds de producción pueden tardar 10-20 minutos
- EAS construye en la nube, no localmente
- Puedes ver el progreso en el dashboard de EAS

---

## 📚 RECURSOS ADICIONALES

- [Documentación de EAS Build](https://docs.expo.dev/build/introduction/)
- [Guía de Google Play Console](https://support.google.com/googleplay/android-developer)
- [Formato AAB de Android](https://developer.android.com/guide/app-bundle)

---

## ✅ CHECKLIST FINAL

Antes de generar el AAB, verifica:

- [ ] Versión actualizada en `app.config.ts`
- [ ] Package name correcto (`com.tuorg.dondebailarmx.app`)
- [ ] Icono y splash screen configurados
- [ ] Variables de entorno configuradas
- [ ] Iniciado sesión en EAS (`eas login`)
- [ ] Credenciales de Google Play configuradas (si usas `eas submit`)

---

## 🚀 COMANDO RÁPIDO

Para generar el AAB rápidamente:

```bash
# 1. Asegúrate de estar en la raíz del proyecto
cd /ruta/a/baileapp-mobile

# 2. Genera el AAB
pnpm build:prod:android

# 3. Sigue las instrucciones interactivas
# 4. Descarga el AAB cuando termine
# 5. Súbelo a Google Play Console
```

---

**Última actualización:** Enero 2025

