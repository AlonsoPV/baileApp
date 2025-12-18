# 🔧 Fix: SIGABRT Crash en React Native Exception Manager

## 📋 Problema

La app crashea inmediatamente al abrir con un `SIGABRT` en el queue `com.facebook.react.ExceptionsManagerQueue`. El crash report muestra:

```
exception: {"codes":"0x0000000000000000, 0x0000000000000000","type":"EXC_CRASH","signal":"SIGABRT"}
termination: {"flags":0,"code":6,"namespace":"SIGNAL","indicator":"Abort trap: 6"}
asi: {"libsystem_c.dylib":["abort() called"]}
queue: "com.facebook.react.ExceptionsManagerQueue"
```

**Diagnóstico:** Un error fatal de JavaScript está siendo procesado por React Native's exception manager, que llama a `abort()` y causa el crash.

**Causa Raíz Identificada:**
- El código de Supabase usaba acceso dinámico a `process.env[key]` que Metro NO puede inlinear
- En TestFlight, esto resulta en `undefined` para las variables de entorno
- El Proxy de Supabase lanzaba un error al primer acceso
- React Native trata el error como fatal → `RCTFatal` → `NSException` → `abort()` → SIGABRT

## 🔍 Causa Raíz Técnica

### Problema 1: Acceso Dinámico a process.env

Metro (el bundler de React Native) solo puede inlinear variables `EXPO_PUBLIC_*` cuando se acceden de forma **estática**:

```typescript
// ✅ FUNCIONA: Metro puede inlinear esto en build-time
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;

// ❌ NO FUNCIONA: Metro NO puede inlinear acceso dinámico
const url = process.env[key]; // En runtime devuelve undefined
```

En TestFlight, el acceso dinámico devuelve `undefined`, causando que la configuración falle.

### Problema 2: Proxy que Lanza Errores

El código anterior usaba un `Proxy` que podía lanzar errores cuando se accedía a propiedades. En producción, cualquier error no capturado se convierte en fatal.

### Problema 3: React Native Exception Manager

React Native tiene dos tipos de manejo de errores:

1. **ErrorBoundary**: Solo captura errores durante el render de componentes React
2. **Global Error Handler**: Captura errores de JavaScript fuera del ciclo de render

Cuando un error fatal ocurre (especialmente durante la inicialización), React Native's default handler llama a `abort()`, causando SIGABRT.

## ✅ Solución Aplicada

### Cambios Realizados

1. **Refactorizado `src/lib/supabase.ts`** (FIX PRINCIPAL):
   - ✅ Cambiado a acceso **estático** a `process.env.EXPO_PUBLIC_*` para que Metro pueda inlinear
   - ✅ Eliminado el `Proxy` que podía lanzar errores
   - ✅ Retorna `null` si falta configuración (en lugar de un proxy que falla)
   - ✅ NO lanza errores en producción

2. **Creado `src/lib/errorHandler.ts`**: Handler global que intercepta todos los errores de JavaScript antes de que lleguen al handler por defecto de React Native (protección adicional).

3. **Instalado en `index.js`**: El handler se instala ANTES de registrar el componente raíz, asegurando que capture errores desde el inicio.

### Cambios en supabase.ts

**Antes (PROBLEMÁTICO):**
```typescript
// ❌ Acceso dinámico - Metro NO puede inlinear
const getEnvVar = (key: string) => process.env[key];

// ❌ Proxy que puede lanzar errores
export const supabase = new Proxy({}, { ... });
```

**Después (CORRECTO):**
```typescript
// ✅ Acceso estático - Metro puede inlinear
const ENV_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ENV_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// ✅ Retorna null si falta config - NO lanza errores
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
```

### Características del Error Handler (Protección Adicional)

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

- `src/lib/supabase.ts` (refactorizado completamente - FIX PRINCIPAL)
- `src/lib/errorHandler.ts` (nuevo - protección adicional)
- `index.js` (modificado para instalar el handler)

## 📝 Uso de Supabase Después del Fix

Ahora `supabase` puede ser `null` si falta configuración. Siempre verifica antes de usar:

```typescript
import { supabase } from "@/lib/supabase";

if (!supabase) {
  // Muestra fallback UI / bloquea features que requieren backend
  console.warn("Supabase not configured");
  return;
}

// Usar supabase de forma segura
const { data, error } = await supabase.from("table").select();
```

