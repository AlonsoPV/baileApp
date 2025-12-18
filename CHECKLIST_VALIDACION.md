# ✅ Checklist de Validación - Debug de Crash

## 📋 Respuestas a Preguntas Clave

### 1. ¿Es Expo (managed/EAS) o bare React Native?
**Respuesta:** Bare React Native con Expo SDK

### 2. ¿Tus keys/URLs vienen de .env / EXPO_PUBLIC_* / app.config.ts / Xcode Cloud env vars?
**Respuesta:** `EXPO_PUBLIC_*` + `app.config.ts` + Xcode Cloud env vars

### 3. ¿En TestFlight puedes ver logs de consola (Xcode → Devices & Simulators → device logs) o tienes Sentry?
**Respuesta:** Logs de dispositivo vía Xcode

## 🔍 Checklist de Validación

### dSYMs y Symbolication
- [ ] **App Store Connect:** Crash muestra nombres de funciones (no solo offsets)
  - Ve a: App Store Connect → My Apps → DondeBailarMX → TestFlight → Crashes
  - Busca por `build_version` o `incident_id`
  - Verifica que veas nombres como `DondeBailarMX.functionName` en lugar de solo offsets

- [ ] **Xcode Cloud:** dSYMs generados y subidos
  - Ve a: App Store Connect → Xcode Cloud → tu workflow → Run del build
  - Busca en Artifacts: `dSYMs` / `Debug Symbols`
  - Verifica logs: `"Generating dSYM…"` y `"Uploading symbols…"`

- [ ] **Xcode Local:** Build Settings correctos
  - Abre proyecto → Target iOS → Build Settings
  - `Debug Information Format` (Release) = `DWARF with dSYM File`
  - Haz Archive local y verifica que existe `.dSYM`

### ENV/Config
- [ ] **Variables en Xcode Cloud:**
  - `EXPO_PUBLIC_SUPABASE_URL` = `https://xjagwppplovcqmztcymd.supabase.co`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

- [ ] **Logs en TestFlight muestran config presente:**
  - Conecta dispositivo a Xcode → Window → Devices and Simulators
  - Selecciona dispositivo → View Device Logs
  - Busca logs que empiecen con `[ENV]`
  - Debe mostrar: `[ENV] supabaseUrl? true (present)`
  - Debe mostrar: `[ENV] anonKey? true (present)`

- [ ] **app.config.ts se ejecuta:**
  - Verifica que `ci_post_clone.sh` ejecuta `expo prebuild`
  - Logs deben mostrar: `"==> Expo prebuild (ios)"`

### Guardrails
- [ ] **Early logger instalado:**
  - Verifica `index.js` tiene early logger antes de imports
  - Logs deben mostrar: `[EarlyGlobalErrorHandler] Early logger installed successfully`

- [ ] **Error handler global:**
  - Verifica `src/lib/errorHandler.ts` está siendo usado
  - Logs deben mostrar: `[GlobalErrorHandler] Global error handler installed successfully`

- [ ] **assertEnv() ejecutándose:**
  - Verifica `App.tsx` llama `assertEnv()` al inicio
  - Logs deben mostrar: `[ENV] ===== Environment Validation =====`

- [ ] **Supabase nunca crashea:**
  - Verifica `src/lib/supabase.ts` retorna `null` si falta config
  - No debe haber `throw` en código de producción

### Xcode Cloud Workflow
- [ ] **Scheme correcto:**
  - Xcode Cloud workflow usa el scheme correcto para Release
  - Verifica que el Archive está configurado para ese scheme

- [ ] **Build Phases existen:**
  - Xcode → Target → Build Phases
  - Debe existir: "Bundle React Native code and images"
  - Debe existir: Scripts de Hermes/config si aplican

- [ ] **Workspace vs Project:**
  - Xcode Cloud construye `.xcworkspace` (no `.xcodeproj`)
  - Verifica que `pod install` se ejecuta en `ci_post_clone.sh`

## 🚀 Próximos Pasos

1. **Configurar variables en Xcode Cloud** (si no están)
2. **Hacer build nuevo** y verificar logs
3. **Revisar crash en App Store Connect** para ver si está symbolicated
4. **Conectar dispositivo a Xcode** y revisar logs en tiempo real

## 📝 Notas

- Si el crash NO está symbolicated, prioriza arreglar dSYMs
- Si las variables faltan, prioriza configurar Xcode Cloud env vars
- Si el crash persiste pero está symbolicated, el early logger debería capturar el error JS

