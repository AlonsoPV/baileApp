# 🔧 Solución: "Preparing build for App Store Connect failed"

## ❌ Error Encontrado

```
Preparing build for App Store Connect failed
```

Este error ocurre cuando EAS intenta preparar el build para subirlo a App Store Connect pero encuentra un problema.

---

## 🔍 Causas Comunes y Soluciones

### 1. ❌ Problema con Credenciales de Apple

**Síntomas:**
- Error al validar certificados
- Error al crear/actualizar provisioning profiles
- "No signing certificate found"

**Solución:**

```bash
# 1. Limpia las credenciales guardadas en EAS
eas credentials

# 2. Selecciona iOS → Production → Remove credentials
# 3. Vuelve a generar el build
pnpm build:prod:ios

# 4. Cuando EAS pregunte, selecciona:
# - "Set up new credentials"
# - "Yes" para que EAS gestione las credenciales
```

**Alternativa (si persiste):**

1. Ve a [Apple Developer Console](https://developer.apple.com/account/resources/certificates/list)
2. Verifica que tengas un **Distribution Certificate** válido
3. Verifica que tengas un **App Store Provisioning Profile** para `com.tuorg.dondebailarmx`
4. Si faltan, créalos manualmente o deja que EAS los cree automáticamente

---

### 2. ❌ Problema con Bundle ID o App en App Store Connect

**Síntomas:**
- "Bundle identifier not found"
- "App not found in App Store Connect"

**Solución:**

1. **Verifica que la app existe en App Store Connect:**
   - Ve a [App Store Connect](https://appstoreconnect.apple.com/)
   - Verifica que existe una app con Bundle ID `com.tuorg.dondebailarmx`
   - Si no existe, créala:
     - Clic en "My Apps" → "+" → "New App"
     - Bundle ID: `com.tuorg.dondebailarmx`
     - Name: "Donde Bailar MX"

2. **Verifica que el Bundle ID esté registrado:**
   - Ve a [Apple Developer Console](https://developer.apple.com/account/resources/identifiers/list)
   - Verifica que `com.tuorg.dondebailarmx` existe
   - Si no existe, créalo

---

### 3. ❌ Problema con Versión o Build Number

**Síntomas:**
- "Version already exists"
- "Build number already in use"

**Solución:**

1. **Verifica la versión actual en App Store Connect:**
   - Ve a App Store Connect → Tu App → "App Store" o "TestFlight"
   - Revisa qué versión y build number están actualmente en uso

2. **Incrementa la versión en `app.config.ts`:**
   ```typescript
   version: "1.0.3",  // Incrementa desde 1.0.2
   ```

3. **O incrementa el build number en Xcode:**
   - Abre `ios/DondeBailarMX.xcodeproj/project.pbxproj`
   - Busca `CURRENT_PROJECT_VERSION`
   - Incrementa el valor (ej: de `113` a `114`)

4. **O usa `autoIncrement` en `eas.json` (ya está configurado):**
   ```json
   {
     "production": {
       "autoIncrement": true  // ✅ Ya está configurado
     }
   }
   ```

---

### 4. ❌ Problema con Permisos de Cuenta de Apple

**Síntomas:**
- "Insufficient permissions"
- "Account not authorized"

**Solución:**

1. **Verifica que tu cuenta tenga permisos:**
   - Ve a [App Store Connect](https://appstoreconnect.apple.com/)
   - Verifica que tu cuenta (`alpeva96@gmail.com`) tenga acceso a la app
   - Si no, pide al administrador que te dé acceso

2. **Verifica que tu cuenta de Apple Developer esté activa:**
   - Ve a [Apple Developer](https://developer.apple.com/account/)
   - Verifica que tu membresía esté activa ($99 USD/año)

---

### 5. ❌ Problema con Configuración de EAS

**Síntomas:**
- Error genérico sin detalles
- Build falla antes de empezar

**Solución:**

1. **Verifica que estés logueado en EAS:**
   ```bash
   eas whoami
   # Si no estás logueado:
   eas login
   ```

2. **Verifica la configuración en `eas.json`:**
   ```json
   {
     "submit": {
       "production": {
         "ios": {
           "appleId": "alpeva96@gmail.com"  // ✅ Verifica que sea correcto
         }
       }
     }
   }
   ```

3. **Limpia la caché de EAS:**
   ```bash
   # Agrega un cache key único en eas.json para invalidar caché
   # Cambia "cache-key-1" por algo único cada vez
   ```

   En `eas.json`:
   ```json
   {
     "production": {
       "cache": {
         "key": "cache-key-$(date +%s)"  // O un valor único manual
       }
     }
   }
   ```

---

### 6. ❌ Problema con Network/API de Apple

**Síntomas:**
- Timeout al conectar con App Store Connect
- "Network error"
- "API rate limit exceeded"

**Solución:**

1. **Espera unos minutos y vuelve a intentar:**
   - Apple a veces tiene problemas con su API
   - Espera 5-10 minutos y vuelve a ejecutar el build

2. **Verifica tu conexión a internet:**
   ```bash
   ping appstoreconnect.apple.com
   ```

3. **Intenta en otro momento:**
   - Los servidores de Apple pueden estar sobrecargados
   - Intenta en horas de menor tráfico (madrugada en tu zona horaria)

---

## 🚀 Solución Rápida (Paso a Paso)

### Paso 1: Verificar Pre-requisitos

```bash
# 1. Verifica que estés logueado
eas whoami

# 2. Verifica la configuración
cat eas.json | grep -A 3 "submit"

# 3. Verifica la versión
cat app.config.ts | grep version
```

### Paso 2: Limpiar y Reintentar

```bash
# 1. Limpia credenciales (si es necesario)
eas credentials

# 2. Genera el build nuevamente
pnpm build:prod:ios

# 3. Cuando EAS pregunte sobre credenciales:
#    - Si es la primera vez: "Set up new credentials"
#    - Si ya tienes: "Use existing credentials"
#    - Siempre: "Yes" para que EAS gestione las credenciales
```

### Paso 3: Verificar en App Store Connect

1. Ve a [App Store Connect](https://appstoreconnect.apple.com/)
2. Verifica que:
   - ✅ La app existe con Bundle ID `com.tuorg.dondebailarmx`
   - ✅ Tu cuenta tiene acceso a la app
   - ✅ No hay versiones/builds duplicados

---

## 📋 Checklist de Diagnóstico

Antes de reportar el error, verifica:

- [ ] Estás logueado en EAS: `eas whoami`
- [ ] Tu cuenta de Apple Developer está activa
- [ ] La app existe en App Store Connect con Bundle ID `com.tuorg.dondebailarmx`
- [ ] El Bundle ID está registrado en Apple Developer
- [ ] La versión en `app.config.ts` es única (no existe en App Store Connect)
- [ ] El build number es único (o `autoIncrement: true` está activo)
- [ ] Tu cuenta tiene permisos para subir builds
- [ ] No hay problemas de red/conectividad

---

## 🔍 Obtener Más Información del Error

Si el error persiste, ejecuta el build con más verbosidad:

```bash
# Build con logs detallados
eas build --profile production --platform ios --verbose

# O revisa los logs en el dashboard de EAS:
# https://expo.dev/accounts/[tu-cuenta]/projects/[tu-proyecto]/builds
```

Los logs detallados te dirán exactamente qué está fallando.

---

## 📞 Contactar Soporte

Si ninguna solución funciona:

1. **Revisa los logs completos en el dashboard de EAS**
2. **Toma capturas de pantalla del error completo**
3. **Contacta a:**
   - [Expo Support](https://expo.dev/support)
   - O abre un issue en [expo/eas-cli](https://github.com/expo/eas-cli/issues)

---

**Última actualización**: Enero 2025
