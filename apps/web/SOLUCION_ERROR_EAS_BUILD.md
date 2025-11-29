# 🔧 Solución: Error "Invalid slug" y "EAS project not configured"

## ❌ Problema

Al ejecutar `npx eas-cli build --profile production --platform android` desde `apps/web`, obtienes:

```
EAS project not configured.
Invalid slug
Error: GraphQL request failed.
```

## ✅ Solución

### 1. Ejecutar desde la raíz del proyecto

**IMPORTANTE:** El comando debe ejecutarse desde la **raíz del proyecto** (donde están `app.config.ts` y `eas.json`), NO desde `apps/web`.

```powershell
# Desde la raíz del proyecto
cd C:\Users\alpev\baileapp-mobile

# Luego ejecutar el build
npx eas-cli build --profile production --platform android
```

### 2. Si aparece el prompt sobre "appVersionSource"

EAS CLI te preguntará qué fuente de versión usar:

```
Since EAS CLI version `12.0.0` explicitly specifying app version source is required.
1) local - La versión se lee de los archivos locales y se incrementa automáticamente
2) remote - La versión se almacena en los servidores de EAS
```

**Recomendación:** Selecciona **opción 1 (local)** si quieres que EAS edite automáticamente `app.config.ts` para incrementar la versión.

### 3. Si el proyecto no está inicializado en EAS

Si es la primera vez, EAS preguntará:

```
EAS project not configured.
Would you like to automatically create an EAS project?
```

Selecciona **"yes"** y EAS creará el proyecto usando el slug de `app.config.ts` (`donde-bailar-mx`).

---

## 📋 Pasos Completos

```powershell
# 1. Ir a la raíz del proyecto
cd C:\Users\alpev\baileapp-mobile

# 2. Verificar que estás en el lugar correcto
# Debes ver: app.config.ts, eas.json, package.json

# 3. Ejecutar el build
npx eas-cli build --profile production --platform android

# 4. Seguir las instrucciones interactivas:
#    - Seleccionar fuente de versión (opción 1: local)
#    - Crear proyecto EAS si es necesario (yes)
#    - Seleccionar tipo de build (AAB)
#    - Esperar a que termine (10-20 minutos)
```

---

## 🔍 Verificar Configuración

Asegúrate de que:

1. **`app.config.ts`** tiene el slug correcto:
   ```typescript
   slug: "donde-bailar-mx"
   ```

2. **`eas.json`** existe en la raíz y tiene el perfil de producción:
   ```json
   {
     "build": {
       "production": {
         "autoIncrement": true,
         ...
       }
     }
   }
   ```

3. **`app.config.ts`** tiene el projectId configurado:
   ```typescript
   eas: {
     projectId: "8bdc3562-9d5b-4606-b5f0-f7f1f7f6fa66"
   }
   ```

---

## ⚠️ Notas Importantes

- **NUNCA** ejecutes el comando desde `apps/web`
- **SIEMPRE** ejecuta desde la raíz donde está `app.config.ts`
- El slug `@baileapp/web` del `package.json` de `apps/web` NO es válido para EAS
- EAS usa el slug de `app.config.ts`: `donde-bailar-mx`

---

## 🐛 Si Persiste el Error

1. **Verifica que estás en la raíz:**
   ```powershell
   Get-Location
   # Debe mostrar: C:\Users\alpev\baileapp-mobile
   ```

2. **Verifica que los archivos existen:**
   ```powershell
   Test-Path app.config.ts
   Test-Path eas.json
   # Ambos deben ser True
   ```

3. **Inicializa EAS manualmente si es necesario:**
   ```powershell
   npx eas-cli init
   ```

---

**Última actualización:** Enero 2025

