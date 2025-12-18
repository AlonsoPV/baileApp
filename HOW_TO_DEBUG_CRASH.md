# 🔍 Cómo Debuggear el Crash SIGABRT - Guía Paso a Paso

## Orden Exacto de Validación

### 1) Device Logs: Localizar Unhandled JS Exception Real

**Pasos:**
1. Conecta el iPhone a tu Mac
2. **Xcode** → **Window** → **Devices and Simulators**
3. Selecciona tu iPhone
4. Abre **Open Console** (o en la parte inferior "Console")
5. En el filtro, pon: `DondeBailarMX` (o tu bundle id)
6. Reproduce el crash

**Qué buscar en la consola (literalmente):**
- `Unhandled JS Exception: ...`
- `Invariant Violation: ...`
- `TypeError: Cannot read property ... of undefined`
- `Error: ...`
- `Possible Unhandled Promise Rejection`
- `ReactNativeJS: ...` (muchas veces el mensaje viene con ese prefijo)

**Si no aparece nada:**
- Cambia la vista de Console a **"All Processes"**
- Filtra por `ReactNativeJS` / `Unhandled` / `Invariant`

**Si aún no aparece:**
- El `installGlobalErrorLogging()` en `App.tsx` debería capturarlo
- Busca logs que empiecen con `[GlobalError]` o `[UnhandledRejection]`

### 2) ENV Report: Confirmar Constants.expoConfig.extra

**Qué buscar en logs:**
```
[ENV_REPORT] {
  "hasExpoConfig": true,
  "hasSupabaseUrl": true,
  "hasAnonKey": true,
  "extraKeys": ["EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_ANON_KEY", ...],
  "jsEngine": "Hermes"
}
```

**Si `hasSupabaseUrl: false` o `hasAnonKey: false`:**
- ✅ Ya encontraste la causa: tu build Release no está metiendo config
- Ve al paso 3 para validar Xcode Cloud

### 3) Xcode Cloud: Validar que las env vars llegan al bundling script

**Temporalmente, agrega esto al Build Phase:**

En **Xcode** → **Target iOS** → **Build Phases** → el script de **"Bundle React Native code and images"** (o crea uno nuevo arriba), agrega:

```bash
echo "=== ENV CHECK ==="
echo "EXPO_PUBLIC_SUPABASE_URL: ${EXPO_PUBLIC_SUPABASE_URL:0:12}..."
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY: ${EXPO_PUBLIC_SUPABASE_ANON_KEY:0:12}..."
echo "NODE_BINARY: $NODE_BINARY"
echo "================="
```

**Luego:**
1. Dispara un build en Xcode Cloud
2. Revisa logs del run
3. Si salen vacías → Xcode Cloud no las está pasando donde importa

**Asegura que las variables estén en el "Workflow Environment":**
- **App Store Connect** → **Xcode Cloud** → **Workflow** → **Environment Variables**
- Confirma que están exactamente como:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Sin espacios, sin comillas raras

### 4) app.config.ts en bare: Lo que sí y lo que NO debes asumir

**✅ Lo que SÍ funciona:**
- `app.config.ts` se ejecuta durante `expo prebuild`
- Las variables en `extra` llegan a `Constants.expoConfig.extra` en runtime
- Usa `ENV` (de `src/lib/env.ts`) que lee de `Constants.expoConfig.extra`

**❌ Lo que NO funciona:**
- `process.env.EXPO_PUBLIC_*` en runtime (solo funciona en build-time)
- Asumir que `app.config.ts` se "lee mágicamente" en runtime

**✅ Recomendación implementada:**
```typescript
// src/lib/env.ts
export const ENV = {
  supabaseUrl: extra.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: extra.EXPO_PUBLIC_SUPABASE_ANON_KEY,
};

// Usar ENV en lugar de process.env
if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
  // Error claro que el global handler capturará
}
```

### 5) Otros Checks Típicos

#### 5.1. Permisos/Calendario
Si usas "Agregar a calendario":
- Loguea los inputs antes de llamar
- Wrap en try/catch y `console.log("[CalendarError]", e)`

#### 5.2. Hermes / JS engine mismatch
Validación implementada en `envReport()`:
```typescript
console.log("[ENV_REPORT] jsEngine:", report.jsEngine); // "Hermes" o "JSC"
```

#### 5.3. ErrorBoundary para errores de render
Ya implementado en `App.tsx`:
```typescript
<ErrorBoundary title="Error al iniciar la app">
  <RootNavigator />
</ErrorBoundary>
```

## 📋 Checklist de Validación

### Paso 1: Device Logs
- [ ] Conecté iPhone a Mac
- [ ] Abrí Xcode → Devices and Simulators → Console
- [ ] Filtré por `DondeBailarMX`
- [ ] Reproduje el crash
- [ ] Busqué: `Unhandled JS Exception`, `[GlobalError]`, `[UnhandledRejection]`
- [ ] **Resultado:** ¿Encontré el mensaje del error? ✅/❌

### Paso 2: ENV Report
- [ ] Busqué en logs: `[ENV_REPORT]`
- [ ] Verifiqué: `hasSupabaseUrl: true`
- [ ] Verifiqué: `hasAnonKey: true`
- [ ] Verifiqué: `extraKeys` contiene las llaves
- [ ] **Resultado:** ¿Las variables están presentes? ✅/❌

### Paso 3: Xcode Cloud Build Phase
- [ ] Agregué temporalmente el script de ENV CHECK
- [ ] Hice build en Xcode Cloud
- [ ] Revisé logs del run
- [ ] Verifiqué que las variables aparecen en los logs
- [ ] **Resultado:** ¿Las variables llegan al bundling script? ✅/❌

### Paso 4: Workflow Environment Variables
- [ ] Verifiqué en App Store Connect → Xcode Cloud → Workflow → Environment Variables
- [ ] Confirmé que están exactamente como `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Sin espacios, sin comillas
- [ ] **Resultado:** ¿Están configuradas correctamente? ✅/❌

## 🎯 Qué Hacer Según el Resultado

### Si encontraste el mensaje del error (Paso 1 ✅):
- **Ya tienes la causa real** → Corrige el código que está lanzando la excepción
- El error te dirá exactamente qué archivo/línea está fallando

### Si las variables faltan (Paso 2 ❌):
- **Causa:** Build Release no está metiendo config
- **Solución:** 
  1. Verifica Xcode Cloud env vars (Paso 4)
  2. Verifica que `expo prebuild` se ejecuta en `ci_post_clone.sh`
  3. Verifica que las variables llegan al bundling script (Paso 3)

### Si las variables no llegan al bundling (Paso 3 ❌):
- **Causa:** Xcode Cloud no está pasando las variables al script
- **Solución:**
  1. Verifica que están en Workflow Environment Variables (Paso 4)
  2. Verifica que el script de bundling tiene acceso a las variables
  3. Considera usar un script wrapper que exporte las variables explícitamente

## 🚀 Implementaciones Realizadas

✅ **Global Error Logging** (`src/lib/globalError.ts`)
- Captura unhandled JS exceptions
- Captura unhandled promise rejections
- Logs detallados con stack traces

✅ **ENV Report** (`src/lib/envReport.ts`)
- Reporte completo de environment variables
- Detecta JS engine (Hermes/JSC)
- Logs estructurados para fácil debugging

✅ **ENV Centralizado** (`src/lib/env.ts`)
- Usa `Constants.expoConfig.extra` (confiable en bare RN)
- NO depende de `process.env` en runtime
- Exporta `ENV` para uso consistente

✅ **Guardrails** (`App.tsx`)
- `installGlobalErrorLogging()` al inicio
- `envReport()` al inicio
- `ConfigMissingScreen` si falta config (no crashea)

## 📝 Notas Finales

- **El mensaje del error es la clave:** Una vez que lo tengas, sabrás exactamente qué corregir
- **Las variables deben estar en `Constants.expoConfig.extra`:** Si no están ahí, el build no las está inyectando
- **Los logs son tu mejor amigo:** Todo está instrumentado para que aparezca en Device Logs

