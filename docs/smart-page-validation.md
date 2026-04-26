# Validación: smart page y “Abrir en la app” (iOS y Android)

## Cobertura automática (CI / local)

En `apps/web`:

```bash
pnpm exec vitest run src/utils/shareUrls.test.ts src/utils/smartPageDeepLink.validation.test.ts
```

- **`shareUrls.test.ts`**: `buildShareUrl` / `buildCanonicalUrl` / `buildDeepLink` para evento, clase y perfiles básicos.
- **`smartPageDeepLink.validation.test.ts`**: `buildDeepLink` → `mapDondeBailarDeepLinkToWebUrl` = `buildCanonicalUrl`; incluye casos **edge** (usuario con `@`, clase con `?i=`, evento sin id → `null`, `isSameWebDestination`, `safeDecodePathSegment`).

## Mapper nativo (`src/utils/mapDondeBailarDeepLinkToWebUrl.ts`)

- Los segmentos de path del scheme se decodifican con `safeDecodePathSegment` antes de montar la canónica.
- **Usuario (`u`)**: tras decodificar, se vuelve a aplicar `encodeURIComponent` en el path, igual que `shareUrls.buildCanonicalUrl` (evita `/u/user%40x.com` literal vs `@`).
- **Clase**: `type` / `id` decodificados; la query se toma de `URL.search` (conserva `?i=`).
- **WebView** (`WebAppScreen`): si el documento ya está en la URL pendiente, `isSameWebDestination` evita un `location.replace` innecesario; un solo `requestAnimationFrame` reintenta el pending (arranque en frío) sin doble inyección en el mismo `onLoadEnd`.

## Matriz (resumen)

| Entidad   | Smart page (`/open/...`) | Canónica (WebView)        | Deep link `dondebailarmx://`   |
|----------|--------------------------|----------------------------|--------------------------------|
| Evento   | `/open/evento/:id`       | `/social/fecha/:id`        | `evento/:id` (`events_date.id`) |
| Clase    | `/open/clase/:type/:id`  | `/clase/:type/:id`         | `clase/:type/:id` (opc. `?i=`)  |
| Academia | `/open/academia/:id`     | `/academia/:id`            | `academia/:id`                  |
| Maestro  | `/open/maestro/:id`      | `/maestro/:id`             | `maestro/:id`                   |
| Organiz. | `/open/organizer/:id`     | `/organizer/:id`          | `organizer/:id`                 |
| Usuario  | `/open/u/:id`            | `/u/:id`                   | `u/:id` (id con `encodeURIComponent` en share) |
| (Marca)  | `/open/marca/:id`        | `/marca/:id`              | `marca/:id` (misma lógica)      |

`type` de clase: solo `teacher` o `academy`.

## Comportamiento nativo (misma lógica iOS y Android)

- **Scheme** Expo: `dondebailarmx` (`app.config.ts`).
- **Android**: `intentFilters` para `auth`, `evento`, `clase`, `academia`, `maestro`, `organizer`, `u`, `marca`, y `https` `dondebailar.com.mx`.
- **iOS**: `CFBundleURLTypes` con scheme `dondebailarmx` (y alternativas de bundle/ Google).
- En la app, `WebView` intercepta `dondebailarmx://` (no carga el scheme en el documento) y deriva la URL HTTPS con `mapDondeBailarDeepLinkToWebUrl`; reintento en el siguiente frame si hace falta (arranque en frío). La navegación sigue basada en `injectJavaScript` + `location.replace` (mantiene el historial coherente para “atrás” frente a una recarga dura con `source.uri`).

## Pruebas manuales rápidas

1. Construir con `xcrun simctl` / dispositivo iOS, o `adb` Android, e instalar la app.
2. Desde **Safari** o **Chrome** móvil, abrir la **smart page** (compartir desde la app o pegar `https://dondebailar.com.mx/open/.../ID`).
3. Pulsar **Abrir en la app**: debe abrirse la app y el WebView la **URL canónica** de la tabla (no `/open/...`).

Comprobar con IDs reales de cada tipo (incl. clase con `?i=` si aplica).

4. (Opcional) Lanzar el deep link directo:

   - **iOS (simulador)**: abrir en terminal  
     `xcrun simctl openurl booted "dondebailarmx://evento/ID"`
   - **Android**:
     `adb shell am start -W -a android.intent.action.VIEW -d "dondebailarmx://academia/ID" com.tuorg.dondebailarmx.app`

Debe mostrarse el detalle correcto, sin pantalla de error de carga del WebView o del límite de ruta (lazy load).

## Servidor (Vercel)

Las rutas `/open/...` en **primera carga** reescriben a `api/open` (HTML + meta); la SPA define las mismas rutas en `AppRouter.tsx`. `api/open.ts` lee `entityType`, `id`, y para **clase** obliga `type` (teacher|academy) y opcional `i` vía `readShareParams` (query de la reescritura de `vercel.json`).

Alineación de paths: `vercel.json` → `/api/open?entityType=…&id=…` (clase: `&type=…&i=…`); comprobar que coincide con `AppRouter` (`/open/evento/:id`, `/open/clase/:type/:id`, etc.).
