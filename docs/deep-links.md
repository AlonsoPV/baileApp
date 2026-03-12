# Deep links y URLs de compartir (Dónde Bailar)

## Scheme único

La app usa un solo scheme custom: **`dondebailarmx`**.

- Auth: `dondebailarmx://auth/callback?code=...`
- Evento (fecha): `dondebailarmx://evento/:id` (id = `events_date.id`)
- Clase: `dondebailarmx://clase/:type/:id` (type = `teacher` | `academy`)
- Perfiles: `dondebailarmx://academia/:id`, `dondebailarmx://maestro/:id`, `dondebailarmx://organizer/:id`, `dondebailarmx://u/:id`, `dondebailarmx://marca/:id`

No se usa el scheme `dondebailar` para evitar duplicidad y problemas de configuración en Expo.

---

## URLs web

### URLs canónicas (detalle final)

- Evento (una fecha): `https://dondebailar.com.mx/social/fecha/:id`
- Clase: `https://dondebailar.com.mx/clase/:type/:id` (opcional `?i=` para índice de cronograma)
- Perfiles: `https://dondebailar.com.mx/academia/:id`, `/maestro/:id`, `/organizer/:id`, `/u/:id`, `/marca/:id`

Estas son las URLs que abren el detalle en la web y las que la app nativa carga en el WebView cuando recibe un deep link.

### URLs de compartir (smart page)

Al compartir desde la app se usa la página intermedia para que el receptor pueda elegir "Abrir en la app" o "Ver en navegador":

- Evento: `https://dondebailar.com.mx/open/evento/:id`
- Clase: `https://dondebailar.com.mx/open/clase/:type/:id` (opcional `?i=`)
- Perfiles: `https://dondebailar.com.mx/open/academia/:id`, `/open/maestro/:id`, `/open/organizer/:id`, `/open/u/:id`, `/open/marca/:id`

En la smart page:
- **Abrir en la app** abre el deep link correspondiente (evento, clase o perfil).
- **Ver en navegador** lleva a la URL canónica.
- **Descargar app** enlaza a App Store y Google Play.

---

## Comportamiento en la app nativa (WebView)

Cuando la app recibe un deep link (arranque en frío o en segundo plano):

1. **`dondebailarmx://evento/123`** → se carga en el WebView la URL canónica `https://dondebailar.com.mx/social/fecha/123`.
2. **`dondebailarmx://clase/teacher/456`** → se carga `https://dondebailar.com.mx/clase/teacher/456`.
3. Perfiles: `dondebailarmx://academia/:id`, `maestro/:id`, `organizer/:id`, `u/:id`, `marca/:id` → se cargan las canónicas `/academia/:id`, `/maestro/:id`, etc.
4. **`dondebailarmx://auth/callback?...`** → se carga `https://dondebailar.com.mx/auth/callback?...`.

La lógica de mapeo está en `src/screens/WebAppScreen.tsx` (`mapIncomingUrlToWebUrl`).

---

## Utilidades web

En `apps/web/src/utils/shareUrls.ts`:

- **buildShareUrl(entityType, id, opts)** – URL de compartir (smart page). Tipos: `evento`, `clase`, `academia`, `maestro`, `organizer`, `user`, `marca`.
- **buildCanonicalUrl(entityType, id, opts)** – URL canónica web.
- **buildDeepLink(entityType, id, opts)** – deep link `dondebailarmx://...`.

---

## Convención evento

- **Siempre** `open/evento/:id` y el deep link `dondebailarmx://evento/:id` usan el **id de la fecha** (`events_date.id`), no el id del parent.
- Si una pantalla solo tiene `parentId`, no se debe compartir con ese id; en una fase posterior se puede resolver la próxima fecha disponible y compartir su `dateId`.

---

## Fase posterior (no bloqueante)

- **Universal Links (iOS)** y **App Links (Android)**: archivos `apple-app-site-association` y `assetlinks.json` en el dominio, y associated domains / intent filters en la app. Los links compartidos siguen siendo `/open/...` para que el usuario vea la smart page y elija app o navegador.
