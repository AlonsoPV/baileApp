# 🔄 Guía: Actualizar Node.js en Windows (Solución Permanente para Certificados SSL)

## 📋 Estado Actual

- **Versión de Node.js instalada**: v20.16.0
- **Ubicación**: `C:\Program Files\nodejs\node.exe`
- **Última versión LTS**: v20.18.0 o superior (verificar en nodejs.org)

---

## ✅ Paso 1: Verificar Versión Actual

```powershell
# Verificar versión actual
node --version
npm --version

# Verificar ubicación
Get-Command node | Select-Object -ExpandProperty Source
```

---

## 🔄 Paso 2: Actualizar Node.js a la Última Versión LTS

### Opción A: Usando el Instalador de Node.js (Recomendado)

1. **Descargar la última versión LTS**:
   - Ve a: **https://nodejs.org/**
   - Descarga la versión **LTS** (Long Term Support)
   - Actualmente: **v20.18.0** o superior

2. **Ejecutar el instalador**:
   - Ejecuta el archivo `.msi` descargado
   - Sigue el asistente de instalación
   - ✅ **Asegúrate de marcar "Automatically install the necessary tools"** si aparece la opción
   - El instalador actualizará automáticamente Node.js y npm

3. **Verificar la instalación**:
   ```powershell
   # Cerrar y abrir una nueva terminal PowerShell
   node --version
   npm --version
   ```

### Opción B: Usando nvm-windows (Gestor de Versiones)

Si prefieres usar un gestor de versiones:

1. **Instalar nvm-windows**:
   - Descarga desde: **https://github.com/coreybutler/nvm-windows/releases**
   - Ejecuta el instalador `nvm-setup.exe`

2. **Instalar la última versión LTS**:
   ```powershell
   # Ver versiones disponibles
   nvm list available
   
   # Instalar la última LTS
   nvm install lts
   
   # Usar la versión instalada
   nvm use lts
   
   # Verificar
   node --version
   ```

---

## 🔒 Paso 3: Actualizar Certificados del Sistema

### Actualizar Windows

1. **Abrir Configuración de Windows**:
   - Presiona `Windows + I`
   - O busca "Configuración" en el menú inicio

2. **Ir a Actualización y Seguridad**:
   - Haz clic en **"Windows Update"**
   - Haz clic en **"Buscar actualizaciones"**
   - Instala todas las actualizaciones pendientes
   - **Reinicia** el equipo si es necesario

3. **Verificar actualizaciones de certificados**:
   - Windows Update incluye actualizaciones de certificados automáticamente
   - No necesitas hacer nada adicional

### Actualizar Certificados Manualmente (Opcional)

Si después de actualizar Windows y Node.js el problema persiste:

1. **Abrir el Administrador de Certificados**:
   ```powershell
   # Abrir el administrador de certificados
   certlm.msc
   ```

2. **Actualizar certificados raíz**:
   - Ve a: **Certificados - Usuario actual** → **Entidades de certificación raíz de confianza** → **Certificados**
   - Si hay certificados expirados o con problemas, Windows los actualizará automáticamente

---

## 🧪 Paso 4: Verificar que Funciona

Después de actualizar, prueba la conexión con EAS:

```powershell
# Probar conexión (sin la variable temporal)
eas whoami

# Si funciona, deberías ver tu usuario sin warnings de certificado
```

Si funciona correctamente, ya no necesitarás usar `NODE_TLS_REJECT_UNAUTHORIZED = "0"`.

---

## 🔧 Paso 5: Limpiar Configuración Temporal

Si habías configurado `strict-ssl = false` en npm, puedes revertirlo:

```powershell
# Ver configuración actual
npm config list

# Si quieres habilitar strict-ssl de nuevo (recomendado)
npm config set strict-ssl true

# Verificar
npm config get strict-ssl
```

**Nota**: Si tienes problemas de red corporativa o proxy, es posible que necesites mantener `strict-ssl = false`. En ese caso, déjalo como está.

---

## 📝 Checklist de Actualización

- [ ] Verificar versión actual de Node.js
- [ ] Descargar última versión LTS desde nodejs.org
- [ ] Instalar Node.js (sobrescribir instalación anterior)
- [ ] Verificar nueva versión instalada
- [ ] Actualizar Windows (Configuración → Windows Update)
- [ ] Reiniciar el equipo si es necesario
- [ ] Probar conexión con EAS (`eas whoami`)
- [ ] Verificar que el build funciona sin variables temporales

---

## ⚠️ Notas Importantes

1. **Backup antes de actualizar**: Si tienes proyectos críticos, asegúrate de tener backups antes de actualizar Node.js

2. **Reinstalar paquetes globales**: Después de actualizar Node.js, es posible que necesites reinstalar paquetes globales:
   ```powershell
   # Reinstalar EAS CLI
   npm install -g eas-cli@latest
   
   # Verificar
   eas --version
   ```

3. **Reinstalar dependencias del proyecto**: Después de actualizar Node.js, es recomendable reinstalar dependencias:
   ```powershell
   # Limpiar y reinstalar
   Remove-Item -Recurse -Force node_modules
   Remove-Item pnpm-lock.yaml
   pnpm install
   ```

4. **Variables de entorno**: Si usaste `NODE_TLS_REJECT_UNAUTHORIZED = "0"`, ya no será necesario después de actualizar

---

## 🚀 Después de Actualizar

Una vez que hayas actualizado Node.js y Windows:

1. **Probar el build sin variables temporales**:
   ```powershell
   # Ya NO necesitas esto:
   # $env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
   
   # Simplemente ejecuta:
   pnpm build:prod:android
   ```

2. **Si el error persiste**: 
   - Verifica que Windows esté completamente actualizado
   - Verifica que Node.js se haya instalado correctamente
   - Revisa si hay un proxy corporativo que esté interfiriendo

---

## 📚 Referencias

- [Node.js Downloads](https://nodejs.org/)
- [Node.js LTS Schedule](https://github.com/nodejs/release#release-schedule)
- [Windows Update](https://support.microsoft.com/es-es/windows/actualizaciones-de-windows-faq-859a8fbd-6b2e-0c0c-5bd2-9d7b-8c8b8c8b8c8b)

---

**Última actualización**: Enero 2025

