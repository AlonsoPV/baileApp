# 🔧 Fix: SIGABRT Crash en React Native Exception Manager

## 📋 Problema

La app crashea inmediatamente al abrir con un `SIGABRT` en el queue `com.facebook.react.ExceptionsManagerQueue`. El crash report muestra:

```
exception: {"codes":"0x0000000000000000, 0x0000000000000000","type":"EXC_CRASH","signal":"SIGABRT"}
termination: {"flags":0,"code":6,"namespace":"SIGNAL","indicator":"Abort trap: 6"}
asi: {"libsystem_c.dylib":["abort() called"]}
queue: "com.facebook.react.ExceptionsManagerQueue"
```

**Diagnóstico:** Un error de JavaScript no manejado está siendo procesado por React Native's exception manager, que llama a `abort()` y causa el crash.

## 🔍 Causa Raíz

React Native tiene dos tipos de manejo de errores:

1. **ErrorBoundary**: Solo captura errores durante el render de componentes React
2. **Global Error Handler**: Captura errores de JavaScript fuera del ciclo de render (async, event handlers, promise rejections)

El problema es que cuando un error no manejado ocurre fuera del ciclo de render, React Native's default handler llama a `abort()`, causando un SIGABRT.

## ✅ Solución Aplicada

### Cambios Realizados

1. **Creado `src/lib/errorHandler.ts`**: Handler global que intercepta todos los errores de JavaScript antes de que lleguen al handler por defecto de React Native.

2. **Instalado en `index.js`**: El handler se instala ANTES de registrar el componente raíz, asegurando que capture errores desde el inicio.

### Características del Handler

- ✅ Captura errores no manejados de JavaScript
- ✅ Captura promise rejections no manejadas
- ✅ Previene crashes en producción/TestFlight
- ✅ Mantiene red screen en desarrollo para debugging
- ✅ Logging detallado para diagnóstico

### Comportamiento

- **En Desarrollo (`__DEV__ = true`)**: 
  - Errores fatales muestran la red screen (útil para debugging)
  - Errores no fatales se loguean pero no crashean

- **En Producción/TestFlight (`__DEV__ = false`)**:
  - TODOS los errores se loguean pero NO crashean la app
  - La app continúa ejecutándose
  - Los componentes pueden manejar errores con ErrorBoundary

## 🚀 Verificación

Después de aplicar el fix:

1. **Compila y prueba localmente:**
   ```bash
   # iOS
   npx expo run:ios
   
   # O build para TestFlight
   eas build --platform ios
   ```

2. **Verifica los logs:**
   - Los errores deberían aparecer con el prefijo `[GlobalErrorHandler]`
   - La app NO debería crashear con SIGABRT

3. **Prueba en TestFlight:**
   - La app debería abrir sin crashear
   - Los errores se loguean pero no causan crash
   - La app puede continuar funcionando

## 📊 Resultados Esperados

- ✅ La app NO crashea con SIGABRT
- ✅ Errores se loguean para diagnóstico
- ✅ En desarrollo: red screen para errores fatales (útil para debugging)
- ✅ En producción: app continúa ejecutándose
- ✅ ErrorBoundary sigue funcionando para errores de render

## 🔍 Debugging

Si la app aún crashea después del fix:

1. **Revisa los logs de Xcode/device:**
   ```bash
   # Conecta el dispositivo y revisa logs
   xcrun simctl spawn booted log stream --level debug
   ```

2. **Busca errores con prefijo `[GlobalErrorHandler]`:**
   - Estos logs indican qué error está causando el problema

3. **Verifica que el handler se instaló:**
   - Deberías ver: `[GlobalErrorHandler] Global error handler installed successfully`

4. **Si el crash persiste:**
   - Puede ser un crash nativo (no JavaScript)
   - Revisa el crash report completo para identificar el thread y stack trace
   - Verifica si hay problemas con New Architecture (ya deshabilitada en `app.config.ts`)

## 📝 Notas Adicionales

- El handler NO previene crashes nativos (Objective-C/Swift)
- El handler NO previene crashes de módulos nativos mal configurados
- Para crashes nativos, revisa:
  - New Architecture (ya deshabilitada)
  - Configuración de pods
  - Módulos nativos con problemas

## 🔗 Archivos Modificados

- `src/lib/errorHandler.ts` (nuevo)
- `index.js` (modificado para instalar el handler)

