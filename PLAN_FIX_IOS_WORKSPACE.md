# 🔧 Plan para Arreglar Error de Workspace iOS

## 📋 Resumen del Problema

EAS Build está buscando `ios/baileApp.xcworkspace` que no existe. Para proyectos Expo managed workflow, los archivos nativos se generan automáticamente durante el build.

## ✅ Lo que ya está correcto

- ✅ `.gitignore` excluye `/ios` y `/android`
- ✅ `app.config.ts` está configurado correctamente
- ✅ `eas.json` no tiene configuraciones que fuercen bare workflow
- ✅ `pnpm-lock.yaml` tiene `eas-cli: ^16.28.0`

## 🔍 Pasos que ejecutaré desde Mac

### 1. Ejecutar script de diagnóstico

```bash
chmod +x fix-ios-workspace-error.sh
./fix-ios-workspace-error.sh
```

### 2. Verificar estructura del proyecto

```bash
# Verificar si existe carpeta ios/ localmente
ls -la | grep ios

# Si existe, verificar contenido
if [ -d "ios" ]; then
    ls -la ios/
    find ios -name "*.xcworkspace" 2>/dev/null
fi
```

### 3. Verificar configuración de EAS

```bash
# Verificar proyecto EAS
npx eas-cli project:info

# Verificar builds recientes
npx eas-cli build:list --platform ios --limit 3
```

### 4. Sincronizar lockfile (si es necesario)

```bash
# Verificar si lockfile está sincronizado
pnpm install --frozen-lockfile

# Si falla, regenerar
pnpm install --no-frozen-lockfile
```

### 5. Asegurar que no hay carpeta ios/ en el repo

```bash
# Verificar estado de git
git status

# Si hay cambios en ios/, eliminarlos del índice
git rm -r --cached ios/ 2>/dev/null || true

# Asegurar que .gitignore está correcto
grep -q "^/ios$" .gitignore || echo "/ios" >> .gitignore
grep -q "^/android$" .gitignore || echo "/android" >> .gitignore
```

### 6. Verificar configuración del proyecto en EAS Dashboard

**IMPORTANTE:** Esto requiere acceso manual al dashboard:
- URL: https://expo.dev/accounts/[tu-cuenta]/projects/8bdc3562-9d5b-4606-b5f0-f7f1f7f6fa66/settings
- Verificar que no haya configuración que fuerce "bare workflow"
- Asegurar que el proyecto esté configurado como "managed workflow"

## 🔧 Soluciones posibles

### Solución 1: Si existe carpeta ios/ localmente

```bash
# Eliminar carpeta ios/ local (NO hacer commit)
rm -rf ios

# Regenerar lockfile
pnpm install

# Hacer commit de cambios
git add .gitignore pnpm-lock.yaml
git commit -m "fix: ensure iOS folder is ignored for managed workflow"
git push origin main
```

### Solución 2: Si el problema persiste después de eliminar ios/

El problema puede estar en la configuración del proyecto en EAS Dashboard. En este caso:

1. **Verificar en EAS Dashboard:**
   - Ve a: https://expo.dev/accounts/[tu-cuenta]/projects/[tu-proyecto]/settings
   - Busca configuración de "Build Type" o "Workflow Type"
   - Asegura que esté en "Managed Workflow" (no "Bare Workflow")

2. **Forzar regeneración en el próximo build:**
   - EAS Build debería detectar automáticamente que no hay carpeta `ios/`
   - Y generar los archivos nativos automáticamente

### Solución 3: Si hay referencias ocultas al workspace

```bash
# Buscar referencias a baileApp.xcworkspace
grep -r "baileApp.xcworkspace" . --exclude-dir=node_modules --exclude-dir=.git

# Buscar referencias a workspace en general
grep -r "xcworkspace" . --exclude-dir=node_modules --exclude-dir=.git
```

## 📝 Comandos rápidos para ejecutar

```bash
# 1. Diagnóstico completo
./fix-ios-workspace-error.sh

# 2. Verificar estructura
ls -la | grep -E "(ios|android)"

# 3. Verificar lockfile
grep -A 2 "eas-cli:" pnpm-lock.yaml

# 4. Sincronizar dependencias
pnpm install

# 5. Verificar proyecto EAS
npx eas-cli project:info
```

## ✅ Checklist final

- [ ] Script de diagnóstico ejecutado
- [ ] Carpeta `ios/` NO existe en el repo (o está en .gitignore)
- [ ] `pnpm-lock.yaml` está sincronizado con `package.json`
- [ ] `.gitignore` excluye `/ios` y `/android`
- [ ] Proyecto EAS está configurado como "managed workflow"
- [ ] Cambios commiteados y pusheados

## 🚀 Después de arreglar

Una vez que se hayan aplicado los cambios:

1. **Hacer commit y push:**
   ```bash
   git add .
   git commit -m "fix: resolve iOS workspace error for EAS Build"
   git push origin main
   ```

2. **Probar build:**
   ```bash
   npx eas-cli build --profile production --platform ios
   ```

3. **Verificar que el build funciona:**
   - EAS Build debería generar los archivos nativos automáticamente
   - No debería buscar `ios/baileApp.xcworkspace`
   - El build debería completarse exitosamente
