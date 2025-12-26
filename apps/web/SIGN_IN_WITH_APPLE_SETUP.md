# Sign in with Apple (Supabase Auth) — Setup rápido

Este proyecto ya muestra el botón **“Continuar con Apple”** y ejecuta `supabase.auth.signInWithOAuth({ provider: 'apple' })`.

Para que funcione en producción y pase App Review (Guideline 4.8), hay que configurar **Apple Developer** + **Supabase Auth**.

## 1) Apple Developer

### A. Crea un *Service ID* (recommended para web / OAuth)
- Apple Developer → **Identifiers** → **Service IDs** → **+**
- Name: `Donde Bailar MX Web`
- Identifier: ej. `com.tuorg.dondebailarmx.web` (puede ser otro, pero consistente)

### B. Habilita “Sign in with Apple” en el Service ID
- En el Service ID → **Sign in with Apple** → **Configure**
- **Primary App ID**: tu App ID iOS principal
- **Web Domain**: `dondebailar.com.mx`
- **Return URL**: el callback de Supabase para Apple (ver sección 2)

> Importante: el *Return URL* debe coincidir **exactamente**.

## 2) Supabase Dashboard

### A. Habilita proveedor Apple
- Supabase → **Authentication** → **Providers** → **Apple** → Enable
- Pega:
  - **Service ID**
  - **Team ID**
  - **Key ID**
  - **Secret Key (JWT / client secret)**

#### ¿Por qué Supabase dice “Secret key should be a JWT”?
Porque en **web OAuth**, Apple exige un **client secret** en formato **JWT (ES256)** que expira (máximo) cada 6 meses.
El archivo `.p8` es la *llave privada* para **firmar** ese JWT, pero **no se pega** directo en Supabase cuando el campo espera un JWT.

#### Generar el Secret Key (JWT) (recomendado)
En este repo tienes un script:
- `scripts/generate_apple_client_secret.mjs`

Ejemplo (Windows PowerShell):

```bash
node scripts/generate_apple_client_secret.mjs
```

Antes exporta estas variables (valores ejemplo):
- `APPLE_TEAM_ID` = tu Team ID (Apple Developer)
- `APPLE_KEY_ID` = el Key ID de tu Key (.p8)
- `APPLE_CLIENT_ID` = tu Service ID (ej. `com.tuorg.dondebailarmx.web`)
- `APPLE_P8_PATH` = ruta al archivo `.p8` descargado

El script imprime un JWT. Ese string es lo que debes pegar en Supabase en **Secret Key (JWT)**.

> Nota: Apple indica que este JWT debe renovarse cada ~6 meses.

### B. URLs permitidas
Supabase → **Authentication** → **URL Configuration**
- **Site URL**: `https://dondebailar.com.mx`
- **Redirect URLs**: agrega al menos:
  - `https://dondebailar.com.mx/auth/callback`
  - (opcional dev) `http://localhost:5173/auth/callback` (o el puerto que uses)

### C. Return URL (para Apple Developer)
En el provider de Apple, Supabase te muestra el **redirect URL/callback** que debes registrar en Apple.
Usualmente es del estilo:
- `https://<PROJECT_REF>.supabase.co/auth/v1/callback`

Para este proyecto (Project Ref `xjagwppplovcqmztcymd`), el Return URL exacto es:
- `https://xjagwppplovcqmztcymd.supabase.co/auth/v1/callback`

Ese es el que debes poner en Apple como **Return URL**.

## 2.1) (Opcional) Endpoint de notificaciones Server-to-Server
Apple permite configurar un endpoint para notificaciones (cambios de Hide My Email, borrado de cuenta, etc.).
Si lo implementas en Supabase Edge Functions, el formato sería:
- `https://xjagwppplovcqmztcymd.supabase.co/functions/v1/apple-s2s-notifications`
> Este endpoint es opcional y no es requisito para cumplir Guideline 4.8.

## 3) Verificación

1. En `https://dondebailar.com.mx/auth/login` pulsa **Continuar con Apple**
2. Completa login (Apple puede permitir “Hide My Email”)
3. Debe regresar a `https://dondebailar.com.mx/auth/callback` y entrar a `/explore`

## 4) Nota para App Review (lo que Apple quiere ver)

- La app ofrece **Sign in with Apple** como opción equivalente a Google
- Apple limita data a **nombre + email** (y permite **Hide My Email**)
- No se usa para publicidad sin consentimiento


