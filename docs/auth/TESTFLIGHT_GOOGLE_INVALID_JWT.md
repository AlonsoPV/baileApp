# TestFlight: "invalid_jwt" al iniciar sesión con Google

Si en TestFlight ves un error tipo **"Google Sign-In no está configurado"** o **"Supabase rechazó el token"** con `code: invalid_jwt` y `status: 400`, Supabase está rechazando el JWT de Google porque la **audiencia** del token no coincide con la configurada.

## Causa

- Supabase solo acepta el id_token de Google si el **aud** (audience) del token es el **Web Client ID**.
- La app debe pedir el token con **GIDServerClientID** = Web Client ID para que Google ponga ese valor en `aud`.
- Si en **Supabase Dashboard** el Provider de Google tiene otro Client ID (o ninguno), o si la app se construyó **sin** GIDServerClientID, obtendrás `invalid_jwt`.

## Qué revisar (en este orden)

### 1. Supabase Dashboard

1. Entra en [Supabase](https://supabase.com/dashboard) → tu proyecto → **Authentication** → **Providers** → **Google**.
2. Asegúrate de que **Client ID** sea exactamente el **Web** OAuth 2.0 Client ID de Google Cloud (formato `XXXXX-xxxx.apps.googleusercontent.com`), **no** el del cliente tipo "iOS".
3. **Client Secret**: el del mismo cliente **Web** en Google Cloud Console.
4. Guarda los cambios.

Ejemplo de valores que usa este proyecto (sustituye por los de tu proyecto si son distintos):

- **Web Client ID**: `168113490186-26aectjk20ju91tao4phqb2fta2mrk5u.apps.googleusercontent.com`
- **iOS Client ID**: `168113490186-cv9q1lfu1gfucfa01vvdr6vbfghj23lf.apps.googleusercontent.com` (este **no** va en Supabase; solo en la app como GIDClientID).

### 2. App (Info.plist en el build que subiste a TestFlight)

El IPA que está en TestFlight debe tener en el **Info.plist** del target:

- **GIDClientID** = iOS Client ID (para que Google muestre la pantalla de login).
- **GIDServerClientID** = **el mismo** Web Client ID que pusiste en Supabase (para que el id_token tenga `aud` = Web Client ID).

Si construiste con Xcode (Archive):

- El script de build inyecta GIDServerClientID desde `.env` / `config/local.env` o desde el **Info.plist fuente** (`ios/DondeBailarMX/Info.plist`). Comprueba que ese plist tenga `GIDServerClientID` con el Web Client ID.

Si construiste con EAS o Xcode Cloud:

- Define la variable de entorno **EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID** con el Web Client ID para que el script la inyecte en el plist en el build.

### 3. Google Cloud Console

- En [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials:
  - Debe existir un cliente **Web application** (ese Client ID es el que va en Supabase y en GIDServerClientID).
  - Debe existir un cliente **iOS** con el mismo Bundle ID que la app (ese Client ID es GIDClientID).
- No intercambies los dos: iOS Client ID solo en la app; Web Client ID en la app (GIDServerClientID) **y** en Supabase.

## Después de cambiar algo

- **Solo Supabase**: no hace falta nuevo build; prueba de nuevo en TestFlight.
- **Solo la app (plist / env)**: hay que generar un nuevo IPA y subirlo de nuevo a TestFlight.

## Resumen

| Dónde | Qué debe estar |
|------|--------------------------------|
| Supabase → Auth → Google | Client ID = **Web** Client ID |
| Info.plist (app) | GIDServerClientID = **mismo** Web Client ID |
| Info.plist (app) | GIDClientID = **iOS** Client ID |

Si ambos (Supabase y GIDServerClientID) usan el mismo Web Client ID, el `invalid_jwt` debería desaparecer.
