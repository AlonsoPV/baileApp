# 🔐 Variables de Entorno para Xcode Cloud

## Variables Requeridas

Configura estas variables de entorno en Xcode Cloud para que la app funcione correctamente:

### 1. EXPO_PUBLIC_SUPABASE_URL
```
https://xjagwppplovcqmztcymd.supabase.co
```

### 2. EXPO_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqYWd3cHBwbG92Y3FtenRjeW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MzU3MzMsImV4cCI6MjA3NjUxMTczM30.zPvdVaknTp5yAT7mwdUWHxa8EkhLBxK4S0SAsQegtYY
```

## 📋 Cómo Configurarlas en Xcode Cloud

### Pasos:

1. **Ir a Xcode Cloud Dashboard**
   - Abre https://developer.apple.com/xcode-cloud/
   - Selecciona tu proyecto

2. **Navegar a Environment Variables**
   - Ve a tu workflow/product
   - Busca la sección "Environment Variables" o "Variables de Entorno"

3. **Agregar las Variables**
   - Haz clic en "Add Environment Variable" o "+"
   - Agrega cada variable con su valor:

   **Variable 1:**
   - **Name:** `EXPO_PUBLIC_SUPABASE_URL`
   - **Value:** `https://xjagwppplovcqmztcymd.supabase.co`

   **Variable 2:**
   - **Name:** `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqYWd3cHBwbG92Y3FtenRjeW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MzU3MzMsImV4cCI6MjA3NjUxMTczM30.zPvdVaknTp5yAT7mwdUWHxa8EkhLBxK4S0SAsQegtYY`

4. **Guardar y Verificar**
   - Guarda los cambios
   - Verifica que ambas variables estén listadas

## ✅ Verificación

Después de configurar las variables, el script `ci_post_clone.sh` las detectará automáticamente y las usará durante el build.

Si las variables no están configuradas, verás warnings en los logs:
```
⚠️  WARNING: EXPO_PUBLIC_SUPABASE_URL not set. Configure it in Xcode Cloud environment variables.
⚠️  WARNING: EXPO_PUBLIC_SUPABASE_ANON_KEY not set. Configure it in Xcode Cloud environment variables.
```

## 🔒 Seguridad

- ✅ Estas son las **anon keys** (públicas) - es seguro incluirlas en builds
- ✅ Están protegidas por Row Level Security (RLS) en Supabase
- ✅ No son secretos sensibles, pero no deben estar en código fuente
- ✅ Xcode Cloud las inyecta solo durante el build

## 📝 Notas Importantes

1. **Formato:** No agregues comillas alrededor de los valores
2. **Espacios:** Asegúrate de no tener espacios extra al inicio o final
3. **Case Sensitive:** Los nombres de las variables son case-sensitive
4. **Disponibilidad:** Las variables estarán disponibles durante:
   - `ci_post_clone.sh` (para `app.config.ts`)
   - Build de Xcode
   - Runtime de la app (vía `Constants.expoConfig?.extra`)

## 🧪 Probar Localmente

Para probar localmente antes de hacer push:

```bash
export EXPO_PUBLIC_SUPABASE_URL="https://xjagwppplovcqmztcymd.supabase.co"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqYWd3cHBwbG92Y3FtenRjeW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MzU3MzMsImV4cCI6MjA3NjUxMTczM30.zPvdVaknTp5yAT7mwdUWHxa8EkhLBxK4S0SAsQegtYY"
npx expo config --type public
```

Deberías ver las variables en el output de `expo config`.

