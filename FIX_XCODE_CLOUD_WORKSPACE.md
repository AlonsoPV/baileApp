# 🔧 Fix: Workspace baileApp.xcworkspace does not exist

## 📋 Problema

Xcode Cloud está buscando `ios/baileApp.xcworkspace` pero el workspace real se llama `ios/DondeBailarMX.xcworkspace`.

Error:
```
Workspace baileApp.xcworkspace does not exist at ios/baileApp.xcworkspace
```

## ✅ Solución

### Paso 1: Actualizar Configuración de Xcode Cloud (UI)

Necesitas actualizar la configuración del workflow en Xcode Cloud para que apunte al workspace correcto:

1. **Abre Xcode** en tu Mac
2. Ve a **Window > Organizer** (o `Cmd+Shift+O`)
3. Selecciona tu proyecto
4. Haz clic en la pestaña **"Cloud"** o **"CI/CD"**
5. Selecciona tu workflow
6. Busca la sección **"Build Settings"** o **"Configuración de Build"**
7. En **"Workspace"** o **"Xcode Workspace"**, cambia:
   - ❌ `ios/baileApp.xcworkspace`
   - ✅ `ios/DondeBailarMX.xcworkspace`
8. Guarda los cambios

### Paso 1.5 (MUY IMPORTANTE): Asegurar que los scripts sean **ejecutables**

Xcode Cloud suele marcar “script not found” si el archivo existe pero **no tiene permiso de ejecución**.

En tu Mac, desde la raíz del repo:

```bash
cd /Users/user940827/baileApp

# Opción recomendada (chmod)
chmod +x ci_scripts/*.sh .xcodecloud/workflows/*.sh

# Verifica que git detecte el cambio de permisos
git status

# Commit + push
git add ci_scripts .xcodecloud/workflows
git commit -m "Make Xcode Cloud scripts executable"
git push origin main
```

Si por alguna razón `chmod` no se refleja en git, usa:

```bash
git update-index --chmod=+x ci_scripts/ci_post_clone.sh
git update-index --chmod=+x ci_scripts/ci_pre_xcodebuild.sh
git update-index --chmod=+x ci_scripts/ci_post_xcodebuild.sh
git update-index --chmod=+x .xcodecloud/workflows/ci_post_clone.sh
git update-index --chmod=+x .xcodecloud/workflows/ci_pre_xcodebuild.sh
git update-index --chmod=+x .xcodecloud/workflows/ci_post_xcodebuild.sh
```

### Paso 2: Verificar Scripts de CI

Los scripts de CI ya están actualizados para detectar automáticamente el workspace correcto. El script `ci_pre_xcodebuild.sh` ahora:
- Busca `DondeBailarMX.xcworkspace` primero
- Si no lo encuentra, busca `baileApp.xcworkspace` como fallback
- Muestra un error claro si no encuentra ningún workspace

### Paso 3: Verificar Post-Clone Script

El script post-clone está en la ubicación correcta:
- `.xcodecloud/workflows/ci_post_clone.sh` ✅
- Este script delega a `ci_scripts/ci_post_clone.sh` ✅

**Nota:** Si Xcode Cloud sigue buscando el script en `ci_scripts/ci_post_clone.sh` directamente, no pasa nada (ya existe).  
Pero la **Opción 3 (recomendada)** es apuntar el workflow a `.xcodecloud/workflows/*.sh` (wrappers).

### Paso 3.5 (OPCIÓN 3): Apuntar los hooks del workflow a `.xcodecloud/workflows`

En la UI de Xcode Cloud (Workflow):

- **Post-Clone**: `.xcodecloud/workflows/ci_post_clone.sh`
- **Pre-Xcodebuild**: `.xcodecloud/workflows/ci_pre_xcodebuild.sh`
- **Post-Xcodebuild**: `.xcodecloud/workflows/ci_post_xcodebuild.sh`

### Paso 4: Ejecutar Nuevo Build

Después de actualizar la configuración:
1. Guarda los cambios en Xcode Cloud
2. Ejecuta un nuevo build
3. Verifica que el build encuentra el workspace correcto

## 🔍 Verificación

Después de actualizar, deberías ver en los logs:

```
==> Workspace encontrado: ios/DondeBailarMX.xcworkspace
==> Workspace exists: ios/DondeBailarMX.xcworkspace
```

En lugar de:
```
ERROR: ios/baileApp.xcworkspace is missing
```

## 📝 Nota sobre el Nombre del Workspace

El workspace se llama `DondeBailarMX.xcworkspace` porque:
- El nombre viene de `app.config.ts` → `slug: "donde-bailar-mx"`
- Expo genera el workspace con el nombre del proyecto
- El bundle identifier es `com.tuorg.dondebailarmx`

Si prefieres usar `baileApp.xcworkspace`, tendrías que:
1. Cambiar el slug en `app.config.ts`
2. Regenerar el proyecto iOS
3. Actualizar referencias en scripts

**Recomendación:** Es más fácil actualizar la configuración de Xcode Cloud para usar el nombre correcto del workspace.

## 🔗 Referencias

- [Xcode Cloud Configuration](https://developer.apple.com/documentation/xcode/xcode-cloud-workflow-reference)
- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)

