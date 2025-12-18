# 🔧 Configurar Variables de Entorno en Xcode Cloud

## 📋 Problema

Si ves este error durante el build:
```
Error: [app.config] Missing required env var: EXPO_PUBLIC_SUPABASE_URL. Set it in Xcode Cloud environment variables or EAS.
```

Significa que las variables de entorno necesarias no están configuradas en Xcode Cloud.

## ✅ Solución: Configurar Variables en Xcode Cloud

### Paso 1: Acceder a la Configuración de Xcode Cloud

1. Abre **Xcode** en tu Mac
2. Ve a **Window > Organizer** (o presiona `Cmd+Shift+O`)
3. Selecciona tu proyecto en la lista
4. Haz clic en la pestaña **"Cloud"** o **"CI/CD"**
5. Selecciona tu workflow de Xcode Cloud

### Paso 2: Agregar Variables de Entorno

1. En la configuración del workflow, busca la sección **"Environment Variables"** o **"Variables de Entorno"**
2. Haz clic en **"+"** para agregar una nueva variable
3. Agrega las siguientes variables:

#### Variables Requeridas:

| Nombre | Valor | Tipo | Descripción |
|--------|-------|------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://tu-proyecto.supabase.co` | Text | URL de tu proyecto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `tu-anon-key-aqui` | Secret | Clave anónima de Supabase (marcar como secreto) |

### Paso 3: Configurar como Secret (Opcional pero Recomendado)

Para `EXPO_PUBLIC_SUPABASE_ANON_KEY`:
- Marca la casilla **"Secret"** o **"Sensitive"** para que no se muestre en los logs
- Esto es importante para seguridad

### Paso 4: Verificar la Configuración

Después de agregar las variables:

1. **Guarda** la configuración
2. **Ejecuta un nuevo build** para verificar que las variables estén disponibles
3. Revisa los logs del build para confirmar que no hay errores relacionados con variables faltantes

## 🔍 Verificar Variables en el Script de CI

El script `ci_scripts/ci_post_clone.sh` ahora exporta automáticamente las variables de entorno antes de ejecutar `expo prebuild`. 

Si las variables no están configuradas, verás warnings en los logs:
```
⚠️  WARNING: EXPO_PUBLIC_SUPABASE_URL not set. Configure it in Xcode Cloud environment variables.
⚠️  WARNING: EXPO_PUBLIC_SUPABASE_ANON_KEY not set. Configure it in Xcode Cloud environment variables.
```

## 📝 Alternativa: Usar EAS Build

Si prefieres usar EAS Build en lugar de Xcode Cloud, puedes configurar las variables así:

```bash
# Ver variables actuales
npx eas-cli env:list --profile production

# Agregar variables
npx eas-cli env:create --profile production --name EXPO_PUBLIC_SUPABASE_URL --value "https://tu-proyecto.supabase.co"
npx eas-cli env:create --profile production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "tu-anon-key" --type secret
```

## 🛠️ Solución Temporal (Solo para Desarrollo)

Si necesitas hacer un build local sin configurar las variables en Xcode Cloud:

1. Crea un archivo `.env.local` en la raíz del proyecto:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

2. **⚠️ IMPORTANTE:** Agrega `.env.local` a `.gitignore` para no commitear secretos:
```bash
echo ".env.local" >> .gitignore
```

3. Las variables se cargarán automáticamente durante el build local

## 🔐 Seguridad

- **NUNCA** commitees archivos `.env.local` o `.env` con valores reales
- **SIEMPRE** marca las claves como "Secret" en Xcode Cloud
- **VERIFICA** que `.gitignore` incluya archivos de entorno

## 📚 Referencias

- [Xcode Cloud Environment Variables](https://developer.apple.com/documentation/xcode/managing-environment-variables-in-xcode-cloud)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [EAS Build Environment Variables](https://docs.expo.dev/build-reference/variables/)

## ✅ Checklist

- [ ] Variables `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` configuradas en Xcode Cloud
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` marcada como "Secret"
- [ ] Build ejecutado exitosamente sin errores de variables faltantes
- [ ] `.env.local` agregado a `.gitignore` (si se usa para desarrollo local)

