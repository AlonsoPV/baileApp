# 📱 Guía: Subir Builds de Xcode Cloud a TestFlight

## 📋 Situación Actual

- Estás usando **Xcode Cloud** para compilar (porque EAS Build alcanzó el límite mensual)
- La versión ya está actualizada a **1.0.1** en `app.config.ts`
- Necesitas subir la build a TestFlight y asignarla al grupo de testers

---

## ✅ Opción 1: Subir Manualmente desde Xcode Cloud (RECOMENDADO)

### Paso 1: Descargar el .ipa desde Xcode Cloud

1. Ve a [App Store Connect](https://appstoreconnect.apple.com/)
2. Ve a **Xcode Cloud** → Tu workflow → Último build completado
3. En la sección **"Artifacts"** o **"Artefactos"**, descarga el archivo `.ipa`
4. Guarda el archivo en tu computadora (ej: `DondeBailarMX.ipa`)

### Paso 2: Subir el .ipa a TestFlight usando EAS Submit

Desde tu terminal (en la raíz del proyecto):

```bash
cd C:\Users\alpev\baileapp-mobile

# Subir el .ipa a TestFlight
eas submit --platform ios --path ruta/al/archivo.ipa
```

**Ejemplo:**
```bash
eas submit --platform ios --path ~/Downloads/DondeBailarMX.ipa
```

O si el archivo está en otra ubicación:
```bash
eas submit --platform ios --path "C:\Users\alpev\Downloads\DondeBailarMX.ipa"
```

### Paso 3: Verificar en App Store Connect

1. Ve a **App Store Connect** → **TestFlight** → **iOS Builds**
2. Espera 5-15 minutos a que Apple procese la build
3. Verifica que la build **1.0.1** aparezca con estado **"Ready to Test"**

### Paso 4: Asignar al Grupo de Testers

1. Selecciona la build **1.0.1**
2. En la sección **"Grupos externos"**, haz clic en **"+"**
3. Selecciona el grupo **"Grupo externo"**
4. Confirma la asignación
5. Los testers ahora deberían poder acceder a la nueva versión

---

## ✅ Opción 2: Subir usando Transporter (Alternativa)

Si prefieres usar la app de Apple:

1. **Descarga Transporter** desde el Mac App Store (solo disponible en macOS)
2. Abre Transporter
3. Arrastra el archivo `.ipa` descargado de Xcode Cloud
4. Haz clic en **"Deliver"** o **"Entregar"**
5. Ingresa tus credenciales de Apple Developer
6. Espera a que se suba (puede tardar varios minutos)

---

## ✅ Opción 3: Configurar Xcode Cloud para Subir Automáticamente

Si quieres automatizar el proceso para futuras builds:

### Paso 1: Configurar Post-Xcodebuild Script

Edita `ci_scripts/ci_post_xcodebuild.sh` para agregar la subida automática:

```bash
#!/bin/bash
set -euo pipefail

echo "==> Xcode Cloud post-xcodebuild diagnostics"

cd "$(dirname "$0")/.."

export LANG="${LANG:-en_US.UTF-8}"
export LC_ALL="${LC_ALL:-en_US.UTF-8}"

echo "==> Repo root: $(pwd)"
echo "==> CI_XCODEBUILD_ACTION: ${CI_XCODEBUILD_ACTION:-<unset>}"
echo "==> CI_ARCHIVE_PATH: ${CI_ARCHIVE_PATH:-<unset>}"
echo "==> CI_RESULT_BUNDLE_PATH: ${CI_RESULT_BUNDLE_PATH:-<unset>}"

# Si el build fue exitoso y generó un .ipa
if [ "${CI_XCODEBUILD_ACTION}" = "archive" ] && [ -n "${CI_ARCHIVE_PATH:-}" ]; then
  echo "==> Build completado exitosamente"
  
  # Exportar el .ipa desde el archive
  # Nota: Esto requiere configuración adicional en Xcode Cloud
  # Por ahora, es mejor descargar manualmente desde Xcode Cloud
fi

echo "==> ios/ listing (top-level)"
ls -la ios || true

echo "==> Done (post-xcodebuild)"
```

**Nota:** La subida automática desde Xcode Cloud requiere configuración adicional y credenciales de Apple. Por ahora, es más fácil usar la Opción 1 (subir manualmente).

---

## 🔧 Troubleshooting

### Problema: "No se encuentra el archivo .ipa"

**Solución:**
1. Verifica que el build en Xcode Cloud haya completado exitosamente
2. Espera unos minutos después de que termine el build (puede tardar en aparecer)
3. Verifica que estés descargando el artefacto correcto (debe ser `.ipa`, no `.xcarchive`)

### Problema: "Error al subir con EAS Submit"

**Solución:**
1. Verifica que estés autenticado: `eas whoami`
2. Si no estás autenticado: `eas login`
3. Verifica que el archivo `.ipa` no esté corrupto (intenta descargarlo de nuevo)
4. Verifica que la versión en el `.ipa` coincida con la versión en App Store Connect

### Problema: "La build no aparece en TestFlight"

**Solución:**
1. Espera 15-30 minutos después de subir (Apple necesita procesar la build)
2. Verifica que la build esté en estado "Processing" o "Ready to Test"
3. Si está en "Invalid Binary", revisa los logs en App Store Connect para ver el error

---

## 📋 Checklist Rápido

- [ ] Build completado en Xcode Cloud
- [ ] Archivo `.ipa` descargado desde Xcode Cloud
- [ ] `.ipa` subido a TestFlight usando `eas submit`
- [ ] Build aparece en App Store Connect → TestFlight → iOS Builds
- [ ] Build en estado "Ready to Test"
- [ ] Build asignada al grupo externo
- [ ] Testers pueden acceder a la nueva versión

---

## 🎯 Pasos Inmediatos para Tu Caso

1. **Espera a que termine el build en Xcode Cloud** (debe estar compilando ahora)
2. **Descarga el `.ipa`** desde Xcode Cloud → Artifacts
3. **Sube el `.ipa`** usando:
   ```bash
   eas submit --platform ios --path "ruta/al/DondeBailarMX.ipa"
   ```
4. **Asigna la build al grupo** en App Store Connect → TestFlight
5. **Listo** - Los testers podrán acceder a la versión 1.0.1

---

**Última actualización:** Diciembre 2025

