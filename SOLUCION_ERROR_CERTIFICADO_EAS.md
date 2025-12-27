# 🔒 Solución: Error de Certificado SSL con EAS CLI

## 📋 Error Encontrado

```
request to https://api.expo.dev/graphql failed, reason: unable to verify the first certificate
Error: GraphQL request failed.
```

Este error ocurre cuando Node.js no puede verificar el certificado SSL de Expo/EAS.

---

## ✅ Soluciones

### Solución 1: Actualizar Certificados del Sistema (Recomendado)

#### En Windows:

1. **Actualizar Windows**:
   - Ve a Configuración → Actualización y seguridad
   - Instala todas las actualizaciones pendientes
   - Esto actualiza los certificados del sistema

2. **Actualizar Node.js**:
   ```powershell
   # Verificar versión actual
   node --version
   
   # Si es antigua, descargar la última versión LTS desde nodejs.org
   ```

3. **Limpiar caché de npm/pnpm**:
   ```powershell
   pnpm store prune
   npm cache clean --force
   ```

### Solución 2: Configurar Variables de Entorno (Temporal)

⚠️ **Solo para desarrollo - NO usar en producción**

```powershell
# Configurar variable de entorno temporalmente
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

# Luego ejecutar el build
pnpm build:prod:android
```

**Nota:** Esto desactiva la verificación de certificados SSL. Úsalo solo si es necesario y recuerda desactivarlo después.

### Solución 3: Usar Proxy o VPN Diferente

Si estás detrás de un proxy corporativo o VPN:

1. **Configurar proxy en npm/pnpm**:
   ```powershell
   npm config set proxy http://proxy-server:port
   npm config set https-proxy http://proxy-server:port
   ```

2. **O desactivar proxy si no es necesario**:
   ```powershell
   npm config delete proxy
   npm config delete https-proxy
   ```

### Solución 4: Reinstalar EAS CLI

```powershell
# Desinstalar
npm uninstall -g eas-cli

# Reinstalar
npm install -g eas-cli@latest

# Verificar instalación
eas --version
```

### Solución 5: Usar NODE_EXTRA_CA_CERTS (Si tienes certificados personalizados)

```powershell
# Si tienes certificados CA personalizados
$env:NODE_EXTRA_CA_CERTS = "C:\ruta\a\tu\certificado.crt"
```

---

## 🔧 Solución Rápida (Temporal)

Si necesitas hacer el build urgentemente y las otras soluciones no funcionan:

```powershell
# 1. Configurar variable de entorno (solo para esta sesión)
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

# 2. Hacer login en EAS
eas login

# 3. Crear el build
pnpm build:prod:android

# 4. Desactivar la variable después
$env:NODE_TLS_REJECT_UNAUTHORIZED = $null
```

---

## 📝 Verificación

Después de aplicar una solución, verifica que funciona:

```powershell
# Probar conexión con EAS
eas whoami

# Si funciona, deberías ver tu información de usuario
```

---

## ⚠️ Notas Importantes

1. **NODE_TLS_REJECT_UNAUTHORIZED=0 es inseguro**: Solo úsalo si es absolutamente necesario y desactívalo después.

2. **Actualizar certificados es la mejor solución**: Asegúrate de tener Windows y Node.js actualizados.

3. **Problemas de red**: Si estás en una red corporativa, puede haber un firewall o proxy bloqueando las conexiones.

---

## 🚀 Próximos Pasos

1. Prueba la Solución 1 primero (actualizar Windows y Node.js)
2. Si no funciona, prueba la Solución 2 (temporalmente)
3. Una vez que el build funcione, revierte cualquier cambio temporal

