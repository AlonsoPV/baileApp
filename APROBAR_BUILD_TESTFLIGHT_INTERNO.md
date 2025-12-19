# ✅ Guía: Aprobar Build en TestFlight como Tester Interno

## 📋 Objetivo

Como tester interno (admin), necesitas aprobar la build 1.0.0 (102) para que pueda ser distribuida a grupos externos.

---

## ✅ Pasos para Aprobar la Build

### **Opción 1: Aprobar desde App Store Connect (Recomendado)**

1. **Ve a App Store Connect**:
   - Abre [App Store Connect](https://appstoreconnect.apple.com/)
   - Inicia sesión con tu cuenta de admin (`alpeva96@gmail.com`)

2. **Navega a TestFlight**:
   - Selecciona tu app: **DondeBailarMX**
   - Ve a **TestFlight** → **iOS Builds**

3. **Selecciona la Build**:
   - Haz clic en la build **1.0.0 (102)**
   - Verás el estado actual: "En pruebas" (Internal Testing)

4. **Aprobar para Distribución Externa**:
   - En la página de la build, busca la sección **"Distribución externa"** o **"External Testing"**
   - Haz clic en **"Aprobar para distribución externa"** o **"Approve for External Testing"**
   - Si te pide información adicional:
     - **¿Qué probar?**: Descripción breve (ej: "App funcional, lista para pruebas externas")
     - **Notas de la versión**: Cambios o mejoras (ej: "Versión estable para testing")
     - **Información de contacto**: Tu email (alpeva96@gmail.com)

5. **Confirmar Aprobación**:
   - Revisa la información
   - Haz clic en **"Aprobar"** o **"Approve"**

### **Opción 2: Aprobar desde la App TestFlight (iOS)**

1. **Abre la app TestFlight** en tu iPhone/iPad
2. **Inicia sesión** con tu cuenta de admin (`alpeva96@gmail.com`)
3. **Selecciona la app** DondeBailarMX
4. **Ve a la build 1.0.0 (102)**
5. **Busca la opción "Aprobar"** o **"Approve"** (si está disponible)
6. **Confirma la aprobación**

---

## 🔍 Verificar que la Aprobación Funcionó

Después de aprobar:

1. **Ve a TestFlight → iOS Builds → Build 1.0.0 (102)**
2. **Verifica el estado**:
   - Debe cambiar de "En pruebas" a "Aprobada" o "Ready for External Testing"
3. **Intenta asignar al grupo externo**:
   - En la sección "Grupos externos", haz clic en "+"
   - Selecciona "Grupo externo"
   - Ahora debería funcionar sin el error "esta versión beta no está aceptando más pruebas"

---

## ⚠️ Si No Aparece la Opción de Aprobar

Si no ves la opción "Aprobar para distribución externa", puede ser porque:

1. **La build aún está procesando**:
   - Espera unos minutos y recarga la página
   - El estado debe ser "Ready to Test" (no "Processing")

2. **Falta información de exportación**:
   - Ve a **TestFlight → App Information**
   - Completa la información de exportación si te la pide
   - Acepta los términos de distribución externa

3. **La versión beta está cerrada**:
   - Ve a **TestFlight → Versiones iOS**
   - Busca la versión 1.0.0
   - Si está cerrada, créala de nuevo o reabre la versión beta

---

## 📋 Checklist de Aprobación

- [ ] Build 1.0.0 (102) está en estado "Ready to Test"
- [ ] Build está asignada a "Internos" (Internal Testing)
- [ ] Has probado la app y está funcional
- [ ] Has aprobado la build para distribución externa
- [ ] El estado cambió a "Aprobada" o "Ready for External Testing"
- [ ] Puedes asignar la build al grupo externo sin errores

---

## 🎯 Después de Aprobar

Una vez aprobada:

1. **Asigna al grupo externo**:
   - Selecciona la build 1.0.0 (102)
   - En "Grupos externos", haz clic en "+"
   - Selecciona "Grupo externo"
   - Confirma

2. **Los testers externos recibirán acceso**:
   - Recibirán un email de invitación
   - O pueden ir a: https://testflight.apple.com/join/NGZXc9J8
   - Verán la build disponible para descargar

---

## 🆘 Si Sigue Sin Funcionar

Si después de aprobar aún aparece el error "esta versión beta no está aceptando más pruebas":

1. **Crea una nueva versión beta**:
   - Ve a **TestFlight → Versiones iOS**
   - Crea una nueva versión beta con la build 1.0.0 (102)
   - Asigna el grupo externo a esta nueva versión beta

2. **O espera la nueva build 1.0.1**:
   - Cuando termine el build en Xcode Cloud
   - Súbelo a TestFlight
   - Asigna directamente al grupo externo (debería funcionar sin problemas)

---

**Última actualización:** Diciembre 2025

