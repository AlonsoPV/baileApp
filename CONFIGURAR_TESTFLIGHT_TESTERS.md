# 📱 Guía: Configurar TestFlight para Testers Invitados

## 🔍 Problema Actual

Los testers invitados no tienen compilaciones disponibles en TestFlight, mientras que el admin (alpeva96@gmail.com) sí puede acceder.

## ✅ Solución: Pasos para Habilitar Acceso a Testers

### **Paso 1: Verificar el Estado de la Build en App Store Connect**

1. Ve a [App Store Connect](https://appstoreconnect.apple.com/)
2. Selecciona tu app: **DondeBailarMX**
3. Ve a **TestFlight** → **iOS Builds**
4. Busca la build **1.0.0 (102)** del 18 dic. 2025
5. Verifica que el estado sea **"Ready to Test"** o **"Processing"** (si aún se está procesando)

### **Paso 2: Verificar Grupos de Testers**

1. En TestFlight, ve a **Testers** → **Grupos externos**
2. Verifica que existe el grupo **"Grupo externo"** (o el nombre que estés usando)
3. Si no existe, créalo:
   - Haz clic en **"+"** o **"Crear grupo"**
   - Nombre: `Grupo externo` (o el que prefieras)
   - Tipo: **Grupo externo** (para testers externos)

### **Paso 3: Agregar Testers al Grupo**

1. Ve a **Testers** → **Grupos externos** → Selecciona tu grupo
2. Haz clic en **"+"** o **"Añadir testers"**
3. Agrega los 4 testers:
   - `victoracostasam@gmail.com` (Victor Salsero)
   - `harris666@live.com.mx` (Abraham Harris)
   - `camilofy97@hotmail.com` (camilo aguilar)
   - `q.edgarpersan@gmail.com` (Edgar Perez)
4. Confirma la adición

### **Paso 4: Habilitar la Build para el Grupo Externo**

1. Ve a **TestFlight** → **iOS Builds**
2. Selecciona la build **1.0.0 (102)**
3. En la sección **"Grupos externos"** o **"External Testing"**:
   - Haz clic en **"+"** o **"Añadir grupo"**
   - Selecciona el grupo **"Grupo externo"**
   - Confirma la selección
4. Si te pide información adicional:
   - **¿Qué probar?**: Descripción breve de la app
   - **Notas de la versión**: Cambios o mejoras en esta build
   - **Información de contacto**: Tu email (alpeva96@gmail.com)

### **Paso 5: Verificar Configuración de Distribución Externa**

1. Ve a **TestFlight** → **App Information** (o **Información de la app**)
2. Verifica que **"Distribución externa"** esté habilitada
3. Si no está habilitada:
   - Haz clic en **"Habilitar distribución externa"**
   - Completa el formulario de información de exportación (si es necesario)
   - Acepta los términos

### **Paso 6: Enviar Invitaciones (si es necesario)**

1. Ve a **Testers** → Selecciona cada tester
2. Verifica que tengan el estado **"Invited"** o **"Installed"**
3. Si están como **"No hay compilaciones disponibles"**:
   - Verifica que estén en el grupo correcto (Paso 3)
   - Verifica que la build esté asignada al grupo (Paso 4)
   - Espera unos minutos (puede tardar en propagarse)

### **Paso 7: Verificar que los Testers Reciban Acceso**

1. Los testers deberían recibir un email de invitación de Apple
2. O pueden ir directamente a: https://testflight.apple.com/join/NGZXc9J8
3. Deben poder ver la build **1.0.0 (102)** disponible para descargar

---

## 🔧 Troubleshooting

### **Problema: Los testers aún no ven la build**

**Solución:**
1. Verifica que la build esté en estado **"Ready to Test"** (no "Processing" o "Failed")
2. Espera 5-10 minutos después de asignar la build al grupo (puede tardar en propagarse)
3. Verifica que los testers estén en el grupo correcto
4. Verifica que la distribución externa esté habilitada

### **Problema: La build está en "Processing"**

**Solución:**
- Espera a que Apple termine de procesar la build (puede tardar 15-30 minutos)
- Una vez que cambie a "Ready to Test", los testers podrán acceder

### **Problema: Error al agregar testers**

**Solución:**
1. Verifica que los emails sean válidos
2. Verifica que los testers no estén ya en otro grupo
3. Si un tester ya está en el grupo pero no ve la build, quítalo y vuelve a agregarlo

### **Problema: "No se puede habilitar distribución externa"**

**Solución:**
1. Verifica que hayas completado toda la información requerida en App Store Connect
2. Verifica que la app tenga al menos una build procesada
3. Contacta con soporte de Apple si el problema persiste

### **⚠️ Problema: "Esta versión beta no está aceptando más pruebas"**

Este es el problema más común. Ocurre cuando:
- La versión beta 1.0.0 ya está cerrada o tiene límites
- Ya hay testers asignados a esa versión y no permite más
- La versión beta necesita ser reabierta o crear una nueva

**Solución 1: Crear una Nueva Versión Beta (RECOMENDADO)**

1. **Incrementa la versión en `app.config.ts`**:
   ```typescript
   version: "1.0.1",  // Cambiar de 1.0.0 a 1.0.1
   ```

2. **Crea una nueva build**:
   ```bash
   pnpm build:prod:ios
   ```

3. **Sube la nueva build a TestFlight**:
   ```bash
   eas submit --platform ios --profile production
   ```

4. **En App Store Connect**:
   - Ve a **TestFlight** → **iOS Builds**
   - Espera a que la nueva build (1.0.1) esté en estado **"Ready to Test"**
   - Selecciona la nueva build
   - Asigna el grupo externo a esta nueva build
   - Los testers ahora podrán acceder a la nueva versión

**Solución 2: Cerrar y Reabrir la Versión Beta Actual**

1. Ve a **TestFlight** → **Versiones iOS**
2. Selecciona la versión **1.0.0**
3. Busca la opción **"Cerrar versión beta"** o **"Close Beta"**
4. Cierra la versión actual
5. Crea una nueva versión beta con la misma build 1.0.0 (102)
6. Asigna el grupo externo a la nueva versión beta

**Solución 3: Usar Testing Interno (Solo para Equipo)**

Si los testers son parte de tu equipo de desarrollo:
1. Ve a **Testers** → **Testing interno**
2. Agrega los testers como miembros del equipo
3. Asigna la build al testing interno
4. **Nota:** Esto solo funciona si los testers tienen acceso a tu cuenta de desarrollador

---

## 📋 Checklist Rápido

- [ ] Build 1.0.0 (102) está en estado "Ready to Test"
- [ ] Grupo externo creado y configurado
- [ ] Los 4 testers están agregados al grupo
- [ ] La build está asignada al grupo externo
- [ ] Distribución externa está habilitada
- [ ] Los testers pueden acceder a la build (verificar después de 10 minutos)

---

## 🆘 Si Nada Funciona

1. **Crea una nueva build** y súbela a TestFlight:
   ```bash
   pnpm build:prod:ios
   eas submit --platform ios --profile production
   ```

2. **Asigna la nueva build al grupo** siguiendo los pasos anteriores

3. **Verifica los logs en App Store Connect**:
   - Ve a **TestFlight** → **Activity** (Actividad)
   - Revisa si hay errores o advertencias

---

**Última actualización:** Diciembre 2025

