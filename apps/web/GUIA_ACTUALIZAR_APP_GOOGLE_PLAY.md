# 🔄 Guía: Cómo Subir Actualizaciones a Google Play Console

Esta guía te explica cómo actualizar tu app en Google Play Console después de hacer cambios.

---

## 📋 TIPOS DE ACTUALIZACIONES

### 1. **Actualizaciones OTA (Over The Air)** - Cambios en JavaScript/React
- ✅ **Rápido** (segundos/minutos)
- ✅ **Sin rebuild** necesario
- ✅ **Sin nueva versión** en Play Store
- ⚠️ **Solo para cambios en código JavaScript/React**
- ⚠️ **NO funciona para cambios nativos**

### 2. **Nuevo Build (AAB)** - Cambios nativos o nueva versión
- ⏱️ **Más lento** (10-20 minutos)
- 🔨 **Requiere rebuild** completo
- 📱 **Nueva versión** en Play Store
- ✅ **Para cambios nativos, dependencias, o cuando quieres nueva versión**

---

## 🚀 OPCIÓN 1: Actualización OTA (Recomendado para cambios rápidos)

### ¿Cuándo usar OTA?
- Cambios en componentes React
- Cambios en lógica de negocio
- Correcciones de bugs en JavaScript
- Nuevas pantallas o funcionalidades en React
- Cambios en estilos CSS

### Pasos:

#### 1. Asegúrate de estar en la raíz del proyecto
```powershell
cd C:\Users\alpev\baileapp-mobile
```

#### 2. Publica la actualización OTA
```powershell
npx eas-cli update --branch main --message "Descripción de los cambios"
```

O usando el script de `package.json`:
```powershell
pnpm update
```

#### 3. Verifica que se publicó
```powershell
npx eas-cli update:list
```

### ⚠️ IMPORTANTE sobre OTA:
- Los usuarios deben tener la app instalada desde Play Store
- La actualización se descarga automáticamente la próxima vez que abran la app
- No necesitas subir nada nuevo a Google Play Console
- Funciona solo para cambios en JavaScript/React

---

## 📦 OPCIÓN 2: Nuevo Build (AAB) - Para cambios importantes

### ¿Cuándo usar nuevo build?
- Cambios en dependencias nativas
- Cambios en `app.config.ts` (versión, nombre, etc.)
- Cambios en código nativo (Android/iOS)
- Nueva funcionalidad que requiere permisos nuevos
- Cuando quieres incrementar la versión en Play Store

### Pasos:

#### 1. Actualiza la versión en `app.config.ts` (opcional)
```typescript
version: "1.0.1",  // Incrementa la versión
```

#### 2. Genera el nuevo AAB
```powershell
# Desde la raíz del proyecto
cd C:\Users\alpev\baileapp-mobile

# Generar nuevo AAB
npx eas-cli build --profile production --platform android
```

O usando el script:
```powershell
pnpm build:prod:android
```

#### 3. Descarga el AAB cuando termine
- EAS te dará un enlace para descargar
- O descárgalo desde: https://expo.dev/accounts/alpeva96/projects/donde-bailar-mx/builds

#### 4. Sube el nuevo AAB a Google Play Console
1. Ve a Google Play Console
2. Selecciona tu app
3. Ve a **"Producción"** → **"Crear nueva versión"**
4. Sube el nuevo archivo `.aab`
5. Actualiza las **"Notas de la versión"** con los cambios
6. Revisa y publica

---

## 📝 ACTUALIZAR NOTAS DE VERSIÓN

Cada vez que subas un nuevo AAB, actualiza las notas de versión:

### Ejemplo para versión 1.0.1:
```
🔧 Actualización 1.0.1

Mejoras y correcciones:

• Corrección de bugs en el sistema de notificaciones
• Mejoras en el rendimiento de la app
• Optimización de la carga de imágenes
• Nuevas funcionalidades en perfiles de marca
```

### Ejemplo para versión 1.0.2:
```
✨ Actualización 1.0.2

Nuevas características:

• Integración de WhatsApp para productos
• Mejoras en el sistema de búsqueda
• Nuevos filtros de eventos
• Correcciones menores
```

---

## 🔄 FLUJO RECOMENDADO

### Para cambios pequeños (UI, bugs, mejoras):
```powershell
# 1. Haz tus cambios en el código
# 2. Publica actualización OTA
npx eas-cli update --branch main --message "Corrección de bug en notificaciones"

# 3. Listo - Los usuarios recibirán la actualización automáticamente
```

### Para cambios importantes (nueva versión):
```powershell
# 1. Actualiza versión en app.config.ts
# 2. Genera nuevo AAB
npx eas-cli build --profile production --platform android

# 3. Descarga el AAB
# 4. Sube a Google Play Console
# 5. Actualiza notas de versión
# 6. Publica
```

---

## 📊 RESUMEN RÁPIDO

| Tipo de Cambio | Método | Tiempo | Requiere Play Console |
|----------------|--------|--------|---------------------|
| **JavaScript/React** | OTA Update | ⚡ Segundos | ❌ No |
| **Código nativo** | Nuevo AAB | ⏱️ 10-20 min | ✅ Sí |
| **Dependencias** | Nuevo AAB | ⏱️ 10-20 min | ✅ Sí |
| **Configuración** | Nuevo AAB | ⏱️ 10-20 min | ✅ Sí |
| **Nueva versión** | Nuevo AAB | ⏱️ 10-20 min | ✅ Sí |

---

## 🎯 RECOMENDACIÓN

**Para la mayoría de actualizaciones:**
1. Usa **OTA Updates** para cambios rápidos
2. Solo genera **nuevo AAB** cuando:
   - Cambias la versión
   - Agregas dependencias nativas
   - Cambias configuración de la app
   - Quieres que aparezca como "nueva versión" en Play Store

---

## 📚 COMANDOS ÚTILES

```powershell
# Ver actualizaciones OTA publicadas
npx eas-cli update:list

# Ver builds realizados
npx eas-cli build:list

# Ver detalles de un build específico
npx eas-cli build:view [BUILD_ID]

# Ver variables de entorno configuradas
npx eas-cli env:list --profile production
```

---

**Última actualización:** Enero 2025

