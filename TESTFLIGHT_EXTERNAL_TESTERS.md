# 🔧 Solución: Testers Externos No Ven Builds en TestFlight

## 🔍 Diagnóstico Rápido

### 1. Verifica el Estado de la Build en App Store Connect

1. Ve a **App Store Connect** → **My Apps** → **DondeBailarMX** → **TestFlight**
2. Busca tu build (la más reciente)
3. Verifica el **estado**:
   - ✅ **"Ready to Submit"** o **"Ready to Test"** → Build lista
   - ⚠️ **"Processing"** → Espera 10-30 minutos
   - ❌ **"Missing Compliance"** → Necesita información de export compliance
   - ❌ **"Invalid Binary"** → Problema con el build

### 2. Verifica Grupos de Testers

1. En TestFlight, ve a la pestaña **"Testers and Groups"**
2. Verifica que:
   - ✅ Los testers están en un **grupo** (no solo añadidos directamente)
   - ✅ El grupo tiene **"External Testing"** habilitado
   - ✅ La build está **asignada al grupo**

### 3. Verifica Distribución Externa

1. En TestFlight, ve a **"iOS Builds"**
2. Selecciona tu build
3. Verifica:
   - ✅ **"External Testing"** está habilitado
   - ✅ La build está **asignada a un grupo de testers externos**

---

## ✅ Soluciones Paso a Paso

### Solución 1: Habilitar Distribución Externa

1. **App Store Connect** → **TestFlight** → **iOS Builds**
2. Selecciona tu build
3. En la sección **"External Testing"**:
   - Si dice **"Not Available"** → La build no está lista para testers externos
   - Haz clic en **"Enable External Testing"**
4. Si te pide **"Export Compliance Information"**:
   - Responde las preguntas sobre export compliance
   - Generalmente: **"No, this app does not use encryption"** (a menos que uses encriptación fuerte)

### Solución 2: Asignar Build a Grupo de Testers Externos

1. **TestFlight** → **"Testers and Groups"**
2. Crea un grupo si no existe:
   - Clic en **"+"** → **"New Group"**
   - Nombre: `External Testers` o similar
   - Tipo: **"External Testing"**
3. Añade testers al grupo:
   - Selecciona el grupo
   - Clic en **"+"** → Añade emails de testers
4. Asigna la build al grupo:
   - Ve a **"iOS Builds"**
   - Selecciona tu build
   - En **"External Testing"**, selecciona el grupo
   - Clic en **"Start Testing"**

### Solución 3: Export Compliance Information

Si la build muestra **"Missing Compliance"**:

1. **App Store Connect** → **TestFlight** → **iOS Builds**
2. Selecciona la build con el problema
3. Busca la sección **"Export Compliance"**
4. Responde las preguntas:
   - **"Does your app use encryption?"**
     - Si NO usas encriptación fuerte: **"No"**
     - Si usas HTTPS/SSL (normal): **"Yes, but exempt"**
   - **"Does your app use any encryption algorithms?"**
     - Generalmente: **"No"** (HTTPS es estándar y está exento)
5. Guarda los cambios
6. Espera 5-10 minutos para que Apple procese

### Solución 4: Verificar Procesamiento de Build

Las builds de Xcode Cloud pueden tardar en procesarse:

1. **App Store Connect** → **TestFlight** → **iOS Builds**
2. Si el estado es **"Processing"**:
   - Espera 10-30 minutos
   - Apple procesa la build automáticamente
   - Recibirás un email cuando esté lista
3. Si después de 30 minutos sigue en **"Processing"**:
   - Verifica los logs en **Xcode Cloud** → Tu workflow → Run
   - Busca errores en el proceso de upload

---

## 🔍 Verificaciones Adicionales

### Verificar que los Testers Recibieron la Invitación

1. **TestFlight** → **"Testers and Groups"**
2. Selecciona el grupo de testers externos
3. Verifica el estado de cada tester:
   - ✅ **"Invited"** → Invitación enviada
   - ✅ **"Installed"** → Tester instaló la app
   - ❌ **"No Status"** → Tester no recibió invitación

### Si los Testers No Recibieron Invitación

1. Verifica que el email es correcto
2. Verifica que no está en spam
3. Reenvía la invitación:
   - Selecciona el tester
   - Clic en **"Resend Invitation"**

### Verificar Permisos de Testers

Los testers externos necesitan:
- ✅ Email válido
- ✅ Aceptar términos de TestFlight (primera vez)
- ✅ Tener iOS 13.0 o superior
- ✅ Tener espacio en el dispositivo

---

## 🚨 Problemas Comunes y Soluciones

### Problema: "No builds available for this tester"

**Causa:** La build no está asignada al grupo del tester

**Solución:**
1. Ve a **"iOS Builds"**
2. Selecciona tu build
3. En **"External Testing"**, verifica que el grupo está seleccionado
4. Si no está, selecciónalo y haz clic en **"Start Testing"**

### Problema: "Build is processing"

**Causa:** Apple está procesando la build (normal, tarda 10-30 min)

**Solución:**
- Espera 10-30 minutos
- Verifica el email de notificación de Apple
- Revisa App Store Connect para ver cuando cambia a "Ready to Test"

### Problema: "Missing Compliance"

**Causa:** Falta información de export compliance

**Solución:**
1. Ve a la build en TestFlight
2. Completa la información de export compliance
3. Guarda y espera 5-10 minutos

### Problema: "Invalid Binary"

**Causa:** Problema con el build (firmado incorrectamente, falta información, etc.)

**Solución:**
1. Verifica los logs de Xcode Cloud
2. Genera un nuevo build
3. Verifica que el bundle ID y version son correctos

---

## 📋 Checklist de Verificación

Antes de reportar el problema, verifica:

- [ ] La build está en estado **"Ready to Test"** o **"Ready to Submit"**
- [ ] La build tiene **"External Testing"** habilitado
- [ ] Los testers están en un **grupo de testers externos**
- [ ] La build está **asignada al grupo** de testers
- [ ] La información de **export compliance** está completa
- [ ] Los testers recibieron la **invitación por email**
- [ ] Los testers aceptaron los **términos de TestFlight** (primera vez)
- [ ] Los testers tienen **iOS 13.0 o superior**

---

## 🎯 Pasos Rápidos para Habilitar Testers Externos

1. **App Store Connect** → **TestFlight** → **iOS Builds**
2. Selecciona tu build más reciente
3. Si no está habilitada para testers externos:
   - Clic en **"Enable External Testing"**
   - Completa export compliance si se solicita
4. **TestFlight** → **"Testers and Groups"**
5. Crea grupo **"External Testers"** si no existe
6. Añade emails de testers al grupo
7. **"iOS Builds"** → Selecciona build → **"External Testing"**
8. Selecciona el grupo → **"Start Testing"**
9. Espera 5-10 minutos
10. Los testers recibirán email de invitación

---

## 📞 Si Nada Funciona

1. Verifica los logs de **Xcode Cloud** para errores
2. Verifica que el **bundle ID** es correcto en `app.config.ts`
3. Verifica que la **versión** es mayor que la anterior
4. Genera un **nuevo build** desde Xcode Cloud
5. Contacta soporte de Apple si el problema persiste

---

**Última actualización:** Enero 2025

