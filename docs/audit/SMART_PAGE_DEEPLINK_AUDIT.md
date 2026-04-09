# Smart Page Deep Link Audit

## Resumen
- La smart page actual existe en `apps/web/src/screens/open/OpenEntityScreen.tsx`.
- Los builders base viven en `apps/web/src/utils/shareUrls.ts`.
- El linking nativo ya estaba configurado en `app.config.ts` y `src/screens/WebAppScreen.tsx`.
- La causa principal del share preview roto era estructural: `og:*` y `twitter:*` se inyectaban solo en cliente mediante `SeoHead.tsx`.
- Se detecto una inconsistencia adicional en Android: el fallback de Google Play apuntaba a un package id distinto al configurado en la app.

## Matriz De Flujo Actual

| Ruta compartida | Componente / handler | Deep link generado | Canonical generado | Share URL | Problema detectado | Causa probable |
|---|---|---|---|---|---|---|
| `/open/evento/:id` | `apps/web/src/screens/open/OpenEntityScreen.tsx` y ahora `apps/web/api/open.ts` | `dondebailarmx://evento/:id` | `https://dondebailar.com.mx/social/fecha/:id` | `https://dondebailar.com.mx/open/evento/:id` | El CTA podia fallar en in-app browsers y el unfurl mostraba logo generico | Se disparaba solo con `window.location.href`, y OG dependia de React `useEffect` |
| `/open/clase/:type/:id?i=` | `apps/web/src/screens/open/OpenEntityScreen.tsx` y ahora `apps/web/api/open.ts` | `dondebailarmx://clase/:type/:id?i=` | `https://dondebailar.com.mx/clase/:type/:id?i=` | `https://dondebailar.com.mx/open/clase/:type/:id?i=` | Riesgo de aceptar `type` invalido y de perder consistencia entre share/canonical/deeplink | Validacion debil de `type` y metadata solo en cliente |
| `/open/academia/:id` | `apps/web/src/screens/open/OpenEntityScreen.tsx` y ahora `apps/web/api/open.ts` | `dondebailarmx://academia/:id` | `https://dondebailar.com.mx/academia/:id` | `https://dondebailar.com.mx/open/academia/:id` | Preview dependiente del logo si no habia OG server-side | Smart page servida como SPA |
| `/open/maestro/:id` | `apps/web/src/screens/open/OpenEntityScreen.tsx` y ahora `apps/web/api/open.ts` | `dondebailarmx://maestro/:id` | `https://dondebailar.com.mx/maestro/:id` | `https://dondebailar.com.mx/open/maestro/:id` | Mismo riesgo de preview y handoff | OG client-only y CTA web sin endurecer |
| `/open/organizer/:id` | `apps/web/src/screens/open/OpenEntityScreen.tsx` y ahora `apps/web/api/open.ts` | `dondebailarmx://organizer/:id` | `https://dondebailar.com.mx/organizer/:id` | `https://dondebailar.com.mx/open/organizer/:id` | Mismo riesgo de preview y handoff | OG client-only y mapping nativo demasiado permisivo |
| `/open/u/:id` | `apps/web/src/screens/open/OpenEntityScreen.tsx` y ahora `apps/web/api/open.ts` | `dondebailarmx://u/:id` | `https://dondebailar.com.mx/u/:id` | `https://dondebailar.com.mx/open/u/:id` | Preview dependiente del logo si no habia imagen real | Smart page SPA y fallback social generico |
| `/open/marca/:id` | `apps/web/src/screens/open/OpenEntityScreen.tsx` y ahora `apps/web/api/open.ts` | `dondebailarmx://marca/:id` | `https://dondebailar.com.mx/marca/:id` | `https://dondebailar.com.mx/open/marca/:id` | Mismo riesgo de preview y links de tienda parciales | OG client-only y CTA de descarga incompleto |

## Builders Audit

### `buildShareUrl(...)`
- Archivo: `apps/web/src/utils/shareUrls.ts`
- Estado: correcto en forma base.
- Validacion clave:
  - Evento usa `open/evento/:id` con `events_date.id`.
  - Clase preserva `?i=` cuando existe.
- Correccion aplicada:
  - Base URL unificada a `https://dondebailar.com.mx` por defecto mediante `apps/web/src/lib/siteUrl.ts`.

### `buildCanonicalUrl(...)`
- Archivo: `apps/web/src/utils/shareUrls.ts`
- Estado: correcto en rutas.
- Riesgo detectado:
  - Dependia de una base URL que podia caer a un dominio Vercel temporal si faltaba config.
- Correccion aplicada:
  - Base URL productiva centralizada.

### `buildDeepLink(...)`
- Archivo: `apps/web/src/utils/shareUrls.ts`
- Estado: correcto en scheme y rutas esperadas.
- Riesgo detectado:
  - El problema no era el builder en si, sino la robustez del disparo y el mapping nativo para paths invalidos.

## Botones Y Enlaces

### Abrir en la app
- Ubicacion original: `apps/web/src/screens/open/OpenEntityScreen.tsx`
- Implementacion original: `window.location.href = deepLink`
- Problema:
  - Sin UX clara si el navegador bloqueaba el handoff.
  - Fallback visible solo despues del timeout.
- Correcciones aplicadas:
  - Smart page server-side en `apps/web/api/open.ts` con CTA directo al deep link y aviso controlado.
  - Smart page React endurecida con fallback mas claro.

### Ver en navegador
- Ubicacion: `apps/web/src/screens/open/OpenEntityScreen.tsx` y `apps/web/api/open.ts`
- Estado: correcto.
- Ajuste aplicado:
  - Se mantiene apuntando a la canonical final del recurso.

### Descargar app
- Ubicacion: `apps/web/src/screens/open/OpenEntityScreen.tsx` y `apps/web/api/open.ts`
- Problema detectado:
  - En web se mostraba App Store siempre y Play Store quedaba relegado al timeout.
  - `PLAY_STORE_URL` apuntaba a `com.dondebailar.app`.
- Correccion aplicada:
  - Se exponen App Store y Google Play siempre.
  - `PLAY_STORE_URL` corregido a `com.tuorg.dondebailarmx.app`.

## Linking Nativo

### Config
- `app.config.ts`
- `scheme`: `dondebailarmx`
- Paths declarados:
  - `evento`
  - `clase`
  - `academia`
  - `maestro`
  - `organizer`
  - `u`
  - `marca`

### Mapping WebView
- Archivo: `src/screens/WebAppScreen.tsx`
- Problema detectado:
  - Si una ruta `clase` venia mal formada podia caer en un mapping generico.
  - El log hablaba de `auth deep link` aunque fuera evento o clase.
- Correccion aplicada:
  - `clase/:type/:id` ahora valida `teacher|academy`.
  - Solo `auth/*` cae en el mapping generico.
  - Eventos y perfiles mal formados ahora no se convierten a rutas incorrectas.

## Metadata Social

### Estado anterior
- `apps/web/src/components/SeoHead.tsx` inyectaba `og:title`, `og:description`, `og:image`, `og:url`, `twitter:*` usando `useEffect`.
- `apps/web/index.html` no traia metadata por entidad.
- `apps/web/vercel.json` enviaba `/open/*` a la SPA.

### Problema real
- WhatsApp, Telegram y otros unfurlers no dependen de hidratar React.
- Por eso veian titulo generico o logo por defecto, incluso cuando la UI cliente luego mostraba la imagen correcta.

### Correccion aplicada
- Nueva salida server-side en `apps/web/api/open.ts`.
- `apps/web/vercel.json` reescribe `/open/*` a esa funcion antes de caer en `index.html`.
- La funcion entrega HTML con:
  - `og:title`
  - `og:description`
  - `og:image`
  - `og:url`
  - `twitter:image`
  - `link rel="canonical"`

## Resolucion De Imagen

### Fuente unica
- Archivo: `apps/web/src/utils/resolveOpenEntityImage.ts`

### Reglas finales
- Evento:
  1. `events_date.flyer_url`
  2. media valida de `events_date`
  3. media valida del parent
  4. fallback contextual
  5. logo solo como ultimo fallback social
- Clase:
  - cover o media real del profile antes de cualquier fallback
- Perfil:
  - cover/avatar/media real antes del logo

### Gap detectado
- Antes la cadena usada en smart page no siempre era consistente con la del detalle publico de evento.
- Se centralizo ademas la presentacion de titulos/subtitulos con `apps/web/src/utils/openEntityMeta.ts`.

## Conclusiones
- El scheme y las rutas nativas ya existian; el bug no era “falta de deep link”.
- El mayor problema funcional era la combinacion de:
  - CTA con handoff fragil en navegador
  - metadata solo en cliente
  - fallback de Play Store incorrecto
- Con las correcciones aplicadas, la smart page queda preparada para:
  - abrir app con deep link valido
  - mostrar fallback usable
  - mantener canonical correcta
  - exponer OG dinamico con imagen real del recurso
