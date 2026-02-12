# Fix: Variables de entorno en TestFlight y Producción

## Síntomas

- **TestFlight**: "No hay conexión o el servidor no responde" (NETWORK_ERROR)
- **Producción**: "Faltan variables de entorno EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY"

Ambos suelen deberse a que las variables **no se inyectan correctamente** en el build.

---

## Solución: Configurar las variables según cómo construyes

### Si usas EAS Build (Expo Application Services)

1. Ve a [expo.dev](https://expo.dev) → tu proyecto → **Environment variables**
2. Añade para el environment **production** (o el que uses para iOS):
   - `SUPABASE_URL` = `https://xjagwppplovcqmztcymd.supabase.co`
   - `SUPABASE_ANON_KEY` = tu anon key (Supabase → Settings → API → anon public)
3. O en `eas.json` (si prefieres en el repo; **no commitees la key real** si es público):
   ```json
   "production": {
     "ios": {
       "env": {
         "SUPABASE_URL": "https://xjagwppplovcqmztcymd.supabase.co",
         "SUPABASE_ANON_KEY": "TU_ANON_KEY_AQUI"
       }
     }
   }
   ```
4. Sustituye `SET_IN_EAS_DASHBOARD_OR_REPLACE` en `eas.json` por la key real **o** bórrala y usa solo EAS Dashboard.

### Si usas Xcode Cloud

1. En Xcode → **Window** → **Organizer** → **Cloud** → tu workflow
2. En **Environment variables** del workflow, añade:
   - `SUPABASE_URL` = `https://xjagwppplovcqmztcymd.supabase.co`
   - `SUPABASE_ANON_KEY` = tu anon key
   - (Opcional) `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` con los mismos valores

3. `ci_post_clone.sh` crea `.env` desde esas variables antes de que Metro corra, y `app.config.ts` las inyecta en `extra`.

---

## Comprobar que funciona

Antes de login, en los logs deberías ver:

```
SUPABASE_URL: https://xjagwppplovcqmztcymd.supabase.co
ANON length: 200
```

(El length de la anon key suele ser > 100.)

Si ves `undefined` o `length: 0` → las variables **no se inyectaron** en el build. Revisa que:

- EAS: las variables estén en el environment correcto (production, preview, etc.)
- Xcode Cloud: las variables estén definidas en el workflow
- El build sea **nuevo** (después de cambiar las variables)

---

## Resumen

| Dónde construyes | Dónde configurar |
|------------------|------------------|
| EAS | Dashboard → Environment variables o `eas.json` → build.production.ios.env |
| Xcode Cloud | Workflow → Environment variables |

Variables a usar: **SUPABASE_URL** y **SUPABASE_ANON_KEY** (o EXPO_PUBLIC_* como alternativa).
