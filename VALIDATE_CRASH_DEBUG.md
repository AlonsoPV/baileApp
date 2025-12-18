# 🔍 Guía de Validación: Debug de Crash SIGABRT

## 1) Validar dSYMs y Symbolication (LO MÁS IMPORTANTE)

### A. En App Store Connect: ¿hay crashes y están symbolicated?

**Pasos:**
1. Ve a **App Store Connect** → **My Apps** → **DondeBailarMX**
2. Navega a **TestFlight** → **Crashes** (o "Crashes & ANRs")
3. Busca el crash por:
   - `build_version` (88/89/94 como en tus logs)
   - `incident_id` (por ejemplo `3E69A127-...`)

**Qué observar:**
- ❌ **NO symbolicated:** Stacks con `DondeBailarMX 0x000000010... + 2116436` sin nombres
- ✅ **Symbolicated:** Nombres de funciones/clases (aunque sean de Apple/RN) y líneas más "humanas"

**Nota:** Que salga "symbolicated" no siempre significa que tengas líneas JS. Significa que el binario nativo ya se puede mapear.

### B. En Xcode Cloud: confirma que el build generó dSYMs y los subió

**Pasos:**
1. **App Store Connect** → **Xcode Cloud** → tu workflow
2. Abre un "Run" del build 94 (o el que estás probando)
3. En **Artifacts / Build Products** (el nombre varía):
   - Busca algo como `dSYMs` / `Debug Symbols` / un zip con símbolos
4. En los logs del step de **Archive/Export**, busca líneas tipo:
   - `"Generating dSYM…"`
   - `"Uploading symbols…"`

**Si no existe artefacto de dSYMs o no hay evidencia de "generate/upload"**, hay un problema en el build config.

### C. En Xcode local: valida que tu target genera dSYM

**Pasos:**
1. Abre el proyecto en Xcode → selecciona el **Target iOS**
2. **Build Settings** → busca:
   - **Debug Information Format**
     - ✅ **Release** debe estar en: `DWARF with dSYM File`
   - **Strip Debug Symbols During Copy**
     - ✅ Normalmente `Yes` en Release (está bien)
   - **Strip Linked Product**
     - ✅ Normalmente `Yes` en Release (también ok)
3. Haz un **Archive local:** `Product` → `Archive`
4. En **Organizer** selecciona ese archive y revisa si existe `.dSYM` dentro

**Si local sí genera dSYM pero Xcode Cloud no**, entonces el workflow está usando otro scheme/config o no está exportando igual.

### D. ¿Cómo "forzar" symbolication útil para React Native?

**RN tiene dos capas:**
1. **Nativo** (Objective-C/Swift/C++): depende de dSYMs
2. **JS** (Hermes/JSC): depende de source maps (y herramientas tipo Sentry)

**Para JS:**
- Apple por sí sola normalmente no te va a dar un stack JS bonito
- Lo mejor es integrar:
  - **Sentry** (recomendado), o
  - logs propios + "guardrails", o
  - guardar el error JS antes de abortar

## 2) Punto "ENV/config": cómo validarlo en serio

### A. Log mínimo (en el arranque) para ver si existe config

**Implementado en:** `src/lib/env.ts` (ver código)

**Qué buscar en TestFlight (dispositivo real):**
- Que ambos (`url` y `key`) salgan `present`

### B. Si falta: dónde se rompe usualmente

**Causas comunes:**
1. Variables definidas en tu `.env` pero no llegan al build iOS Release
2. `app.config.ts` no se ejecuta como crees en el pipeline
3. Xcode Cloud no corre el paso que inyecta config
4. Estás usando `process.env.*` en runtime (en RN/Expo esto suele ser build-time)

**Regla rápida:** Si algo debe existir en runtime móvil, asegúralo vía:
- `expo.extra` (Expo), o
- un archivo de config generado en build, o
- settings en `Info.plist` (y leerlos)

## 3) Guardrail para que NO haga abort

### A. Evita crashear por config faltante

**Implementado en:** `App.tsx` (ver código)

### B. Captura errores globales JS (mínimo viable)

**Implementado en:** `index.js` y `src/lib/errorHandler.ts` (ver código)

## 4) Xcode Cloud workflow: qué revisar exactamente

### A. Confirmar que compila el scheme/target correcto

**En Xcode Cloud workflow (en App Store Connect):**
1. Elige el **Scheme exacto** que usas para Release
2. Confirma que el "Archive" está para ese scheme

**Síntoma típico de scheme incorrecto:**
- Local ok, cloud ok, pero TestFlight usa otra configuración donde faltan env o build phases

### B. Build phases (React Native) deben existir en Release

**En Xcode → Target → Build Phases**, revisa que existan:
- ✅ "Bundle React Native code and images" (o equivalente)
- ✅ Hermes config si aplica
- ✅ Scripts de config/env (si los tienes)

**Si ese phase no corre en Release o falla silencioso**, puedes terminar con crashes raros.

### C. Flaky: dependencia nativa no incluida / Pod install incorrecto

**Si usas pods:**
- ✅ Asegúrate que Xcode Cloud construye la `.xcworkspace` (no el `.xcodeproj`)
- ✅ Si tu workflow hace `pod install`, que sea en el path correcto

## 5) "¿Tiene que ver mi iPhone?"

**Por lo que muestras:**
- iPhone15,4 (iPhone 13 mini) + iOS 26.1
- Crash en RN ExceptionsManagerQueue con SIGABRT

**Esto normalmente indica error en runtime (JS o módulo nativo), no "tu iPhone está mal".**

**Sí puede influir si:**
- Solo crashea en iOS 26.1 (bug de API / permiso / calendario / etc.)
- Pero como te crashea en builds distintos, huele más a config/módulo

## 6) ¿Conviene recrear workflow/proyecto/target?

**Como primera acción: no.**

**Solo lo haría si descubres que:**
- Xcode Cloud está tomando el scheme equivocado
- O el proyecto está tan enredado que no puedes hacer que genere/suba dSYMs ni ejecute build phases

**En la práctica, casi siempre se arregla con:**
- ✅ dSYMs + (si puedes) Sentry/source maps
- ✅ Validar env
- ✅ Guardrails + logging
- ✅ Corregir el módulo/llamada que está lanzando la excepción

## 📋 Checklist de Validación Rápida

### dSYMs
- [ ] Crash en App Store Connect muestra nombres de funciones (no solo offsets)
- [ ] Xcode Cloud genera dSYMs en Artifacts
- [ ] Build Settings: `Debug Information Format = DWARF with dSYM File` en Release
- [ ] Archive local genera `.dSYM`

### ENV/Config
- [ ] Logs en TestFlight muestran `[ENV] supabaseUrl? true (present)`
- [ ] Logs en TestFlight muestran `[ENV] anonKey? true (present)`
- [ ] Variables configuradas en Xcode Cloud Environment Variables
- [ ] `app.config.ts` se ejecuta correctamente en el build

### Guardrails
- [ ] Early logger instalado en `index.js`
- [ ] Error handler global en `src/lib/errorHandler.ts`
- [ ] `assertEnv()` ejecutándose en `App.tsx`
- [ ] Supabase nunca crashea por falta de config (retorna `null`)

### Xcode Cloud
- [ ] Scheme correcto configurado en workflow
- [ ] Build phases de RN existen y se ejecutan
- [ ] `.xcworkspace` se usa (no `.xcodeproj`)
- [ ] `pod install` se ejecuta correctamente

## 🚀 Para Avanzar YA

**Responde estas preguntas para el fix exacto:**

1. **¿Es Expo (managed/EAS) o bare React Native?**
   - Respuesta: Bare React Native con Expo SDK

2. **¿Tus keys/URLs vienen de .env / EXPO_PUBLIC_* / app.config.ts / Xcode Cloud env vars?**
   - Respuesta: `EXPO_PUBLIC_*` + `app.config.ts` + Xcode Cloud env vars

3. **¿En TestFlight puedes ver logs de consola (Xcode → Devices & Simulators → device logs) o tienes Sentry?**
   - Respuesta: Logs de dispositivo vía Xcode

