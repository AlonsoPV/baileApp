# 🔧 Fix: Crash de New Architecture (TurboModules) en iOS 18.1

## 📋 Problema

La app crashea inmediatamente al abrir (uptime ~58s, pero el proceso vive milisegundos) con el siguiente error:

```
queue: com.meta.react.turbomodulemanager.queue
ObjCTurboModule::performVoidMethodInvocation(...)
termina en objc_exception_rethrow → abort()
```

**Diagnóstico:** Una llamada a un TurboModule (New Architecture) está lanzando una NSException y iOS aborta. Esto ocurre muy temprano en el ciclo de vida de la app.

## ✅ Solución Aplicada

### Cambio Realizado

Se desactivó New Architecture en `app.config.ts`:

```typescript
newArchEnabled: false, // ⚠️ Deshabilitado temporalmente debido a crash en TurboModules (iOS 18.1)
```

### Rebuild Limpio Requerido

**⚠️ IMPORTANTE:** Después de cambiar `newArchEnabled`, es **crítico** hacer un rebuild limpio porque si no, se quedan flags viejos en iOS.

## 🚀 Pasos para Aplicar el Fix

### Opción 1: Usar el Script Automatizado (Recomendado)

```bash
# Desde la raíz del proyecto
./scripts/rebuild-ios-clean.sh
```

### Opción 2: Pasos Manuales

```bash
# 1. Eliminar carpeta ios (se regenerará)
rm -rf ios

# 2. Regenerar con expo prebuild (limpio)
npx expo prebuild --clean --platform ios

# 3. Instalar pods
cd ios
pod install
```

### Opción 3: Para Xcode Cloud / CI

El script `ci_scripts/ci_post_clone.sh` ya ejecuta `expo prebuild`, así que el cambio se aplicará automáticamente en el próximo build.

## ✅ Verificación

Después del rebuild:

1. **Compila localmente:**
   ```bash
   cd ios
   xcodebuild -workspace DondeBailarMX.xcworkspace -scheme DondeBailarMX -configuration Release
   ```

2. **O abre en Xcode:**
   ```bash
   open ios/DondeBailarMX.xcworkspace
   ```

3. **Prueba en dispositivo/simulador**

4. **Si funciona, sube a TestFlight**

## 📊 Resultados Esperados

- ✅ La app debería abrir sin crashear
- ✅ No debería haber errores de TurboModules
- ✅ La app funcionará con la arquitectura antigua (estable)

## 🔄 Plan Futuro: Reactivar New Architecture

Una vez confirmado que el fix funciona, hay 3 caminos para reactivar New Architecture:

### Camino A) Mantener New Arch OFF (Válido para Producción)

Es totalmente válido mantener New Architecture desactivada para salir a producción rápido. Puedes reactivarla cuando tengas tiempo de revisar compatibilidad.

**Ventajas:**
- Estable y probado
- Sin riesgo de crashes relacionados con TurboModules
- Puedes enfocarte en features

**Desventajas:**
- No tendrás las mejoras de rendimiento de New Architecture
- Eventualmente necesitarás migrar (pero no es urgente)

### Camino B) Identificar el Módulo Problemático (Lo Correcto)

Para identificar qué TurboModule está causando el crash:

1. **Subir dSYM del build:**
   - En Xcode / App Store Connect: sube dSYM del build
   - Si ya lo sube automático, espera que App Store lo simbolice
   - Esto te dará el stack trace completo con nombres de módulos

2. **Integrar Sentry:**
   - Sentry te dice el módulo exacto aunque sea mezcla native/JS
   - Muy útil para debugging en producción

3. **Revisar logs simbolizados:**
   - Con el dSYM, podrás ver exactamente qué TurboModule está fallando
   - Luego puedes actualizar esa dependencia específica

### Camino C) Arreglar Compatibilidad New Arch (Completo)

Casi siempre el problema es:

1. **Actualizar dependencias:**
   ```bash
   # Actualizar Expo SDK
   npx expo install --fix
   
   # Actualizar React Native
   npm install react-native@latest
   
   # Actualizar libs nativas críticas
   npm install react-native-reanimated@latest
   npm install react-native-gesture-handler@latest
   npm install react-native-screens@latest
   ```

2. **Verificar módulos "dev" en release:**
   - Asegúrate de que no haya módulos de desarrollo colándose en release
   - Revisa `package.json` y `ios/Podfile`

3. **Confirmar flags coherentes:**
   - Verifica que `RCT_NEW_ARCH_ENABLED` esté coherente en todos los pods
   - Revisa `ios/Podfile.properties.json`

4. **Probar incrementalmente:**
   - Activa New Arch
   - Prueba en desarrollo
   - Si funciona, prueba en release
   - Si falla, usa Sentry/dSYM para identificar el módulo

## 🐛 Contexto del Problema

### ¿Por qué ocurre?

- **iOS 18.1** es relativamente nuevo y puede tener incompatibilidades con New Architecture
- Algunos TurboModules pueden no estar completamente compatibles con iOS 18.1
- El crash ocurre muy temprano (milisegundos después del inicio), lo que sugiere un problema en la inicialización

### ¿Es común?

Sí, es muy común que New Architecture tenga problemas de compatibilidad, especialmente:
- Con versiones nuevas de iOS
- Con dependencias nativas que no han sido actualizadas
- En builds de producción (vs desarrollo)

## 📝 Checklist

- [x] Cambiar `newArchEnabled: false` en `app.config.ts`
- [ ] Ejecutar rebuild limpio (`./scripts/rebuild-ios-clean.sh`)
- [ ] Compilar y probar localmente
- [ ] Verificar que la app abre sin crashear
- [ ] Subir a TestFlight
- [ ] Confirmar que funciona en producción
- [ ] (Opcional) Planear reactivación de New Architecture

## 🔗 Referencias

- [React Native New Architecture](https://reactnative.dev/docs/new-architecture-intro)
- [Expo New Architecture](https://docs.expo.dev/development/new-architecture/)
- [TurboModules Documentation](https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules)

## ⚠️ Nota Importante

Este fix es **temporal pero válido para producción**. New Architecture es el futuro de React Native, pero no es crítico tenerlo activado ahora. Puedes mantenerlo desactivado mientras:
- La app funciona correctamente
- No necesitas features específicas de New Architecture
- Prefieres estabilidad sobre las mejoras de rendimiento

Cuando tengas tiempo, puedes seguir el "Camino B" o "Camino C" para reactivarlo de forma segura.

