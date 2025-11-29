# 🔧 Solución: Error "Build failed - Bundle JavaScript build phase"

## ❌ Problema

El build de EAS falla con el error:
```
✖ Build failed
🤖 Android build failed:
Unknown error. See logs of the Bundle JavaScript build phase for more information.
```

## 🔍 Diagnóstico

### 1. Ver los Logs Detallados

El build te dio un enlace a los logs:
```
See logs: https://expo.dev/accounts/alpeva96/projects/donde-bailar-mx/builds/5f2bf65c-4337-48ad-8d0e-5204b126cd75
```

**Accede a ese enlace** y revisa la sección "Bundle JavaScript" para ver el error específico.

### 2. Problemas Comunes

#### A) Variables de Entorno Faltantes

El build puede fallar si faltan variables de entorno. Verifica que estén configuradas en EAS:

```bash
# Ver variables de entorno configuradas
npx eas-cli env:list --profile production

# Agregar variables de entorno si faltan
npx eas-cli env:create --profile production --name EXPO_PUBLIC_SUPABASE_URL --value "tu-url"
npx eas-cli env:create --profile production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "tu-key"
```

#### B) Dependencias Faltantes

Verifica que todas las dependencias estén instaladas:

```bash
# Desde la raíz del proyecto
pnpm install
```

#### C) Errores de Sintaxis en el Código

Verifica que no haya errores de TypeScript/JavaScript:

```bash
# Verificar errores de TypeScript
npx tsc --noEmit
```

#### D) Problemas con Monorepo

Si el proyecto es un monorepo, EAS puede tener problemas encontrando el código. Verifica que:

1. El `app.config.ts` esté en la raíz
2. El `index.js` esté en la raíz
3. El `App.tsx` esté en la raíz o en `src/`

#### E) Archivos Faltantes

Verifica que los archivos necesarios existan:
- `index.js` ✅ (existe)
- `App.tsx` ✅ (existe)
- `babel.config.js` ✅ (existe)
- `app.config.ts` ✅ (existe)

---

## ✅ Soluciones

### Solución 1: Configurar Variables de Entorno en EAS

```bash
# Configurar variables de entorno para producción
npx eas-cli env:create --profile production --name EXPO_PUBLIC_SUPABASE_URL --value "https://tu-proyecto.supabase.co"
npx eas-cli env:create --profile production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "tu-anon-key" --type secret
```

### Solución 2: Crear archivo `.easignore`

Crea un archivo `.easignore` en la raíz para excluir archivos innecesarios:

```
node_modules/
apps/web/
dist/
.git/
*.md
*.sql
supabase/
```

### Solución 3: Verificar que el Entry Point sea Correcto

Asegúrate de que `package.json` tenga el entry point correcto:

```json
{
  "main": "index.js"
}
```

### Solución 4: Limpiar y Reinstalar Dependencias

```bash
# Limpiar
rm -rf node_modules
rm pnpm-lock.yaml

# Reinstalar
pnpm install
```

### Solución 5: Verificar Babel Config

Asegúrate de que `babel.config.js` esté correcto:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo']
  };
};
```

---

## 📋 Pasos para Diagnosticar

1. **Revisa los logs del build:**
   - Ve a: https://expo.dev/accounts/alpeva96/projects/donde-bailar-mx/builds/5f2bf65c-4337-48ad-8d0e-5204b126cd75
   - Busca la sección "Bundle JavaScript"
   - Copia el error específico

2. **Verifica variables de entorno:**
   ```bash
   npx eas-cli env:list --profile production
   ```

3. **Prueba el build localmente primero:**
   ```bash
   npx expo export --platform android
   ```

4. **Verifica errores de TypeScript:**
   ```bash
   npx tsc --noEmit
   ```

---

## 🔗 Enlaces Útiles

- [Logs del Build](https://expo.dev/accounts/alpeva96/projects/donde-bailar-mx/builds/5f2bf65c-4337-48ad-8d0e-5204b126cd75)
- [Documentación de EAS Build](https://docs.expo.dev/build/introduction/)
- [Solución de Problemas de EAS](https://docs.expo.dev/build/troubleshooting/)

---

**Última actualización:** Enero 2025

