# Mapping maestro de entidades (share, open, deep links)

Referencia única de todas las entidades que tienen URL de compartir, página `/open/...` y deep link. Base URL web: `https://dondebailar.com.mx` (o `SEO_BASE_URL`).

---

## Resumen por entidad

| Entidad   | ShareEntityType | ID significa              | Parámetros opc.     | Ruta open (share)     | Ruta canónica (web)     | Deep link                |
|-----------|-----------------|---------------------------|---------------------|------------------------|--------------------------|---------------------------|
| Evento    | `evento`        | `events_date.id`          | —                   | `/open/evento/:id`     | `/social/fecha/:id`      | `dondebailarmx://evento/:id` |
| Clase     | `clase`         | id maestro o academia     | `type`, `index`     | `/open/clase/:type/:id`| `/clase/:type/:id`       | `dondebailarmx://clase/:type/:id` |
| Academia  | `academia`      | id academia (numérico)    | —                   | `/open/academia/:id`   | `/academia/:id`          | `dondebailarmx://academia/:id` |
| Maestro   | `maestro`       | id maestro (numérico)    | —                   | `/open/maestro/:id`    | `/maestro/:id`           | `dondebailarmx://maestro/:id` |
| Organizador | `organizer`   | id organizador (numérico)| —                   | `/open/organizer/:id`  | `/organizer/:id`         | `dondebailarmx://organizer/:id` |
| Usuario   | `user`          | `user_id` (UUID)          | —                   | `/open/u/:id`          | `/u/:id`                 | `dondebailarmx://u/:id`   |
| Marca     | `marca`         | id marca (numérico)       | —                   | `/open/marca/:id`      | `/marca/:id`             | `dondebailarmx://marca/:id` |

---

## Detalle por entidad

### Evento

- **ID:** Siempre `events_date.id` (fecha concreta). No usar `event_parent.id`.
- **Opciones:** Ninguna.
- **Pantallas que comparten:** EventDatePublicScreen, DateLiveScreen (y otros que usen `buildShareUrl('evento', dateId)`).
- **Open screen:** OpenEntityScreen (eventType=`evento`). Datos: `useEventDate(id)`, `useEventParent(parent_id)`.

### Clase

- **ID:** Id del perfil (maestro o academia) que tiene el cronograma.
- **Opciones:** `type`: `"teacher"` | `"academy"`; `index`: número de entrada en cronograma (query `?i=`).
- **Pantallas que comparten:** ClassPublicScreen, ClasesLiveTabs (varios usos con type + id, opcional index).
- **Open screen:** OpenEntityScreen (eventType=`clase`). Datos: `useTeacherPublic` o `useAcademyPublic` según type.

### Academia

- **ID:** Numérico, tabla/vista de academia.
- **Opciones:** Ninguna.
- **Pantallas que comparten:** AcademyPublicScreen, AcademyProfileLive.
- **Open screen:** OpenEntityScreen (eventType=`academia`). Datos: `useAcademyPublic(id)`.

### Maestro

- **ID:** Numérico, perfil maestro.
- **Opciones:** Ninguna.
- **Pantallas que comparten:** TeacherPublicLive.
- **Open screen:** OpenEntityScreen (eventType=`maestro`). Datos: `useTeacherPublic(id)`.

### Organizador

- **ID:** Numérico, `profiles_organizer.id`. En rutas públicas la app acepta también slug o user_id; al compartir se usa siempre el id numérico.
- **Opciones:** Ninguna.
- **Pantallas que comparten:** OrganizerPublicScreen, OrganizerProfileLive.
- **Open screen:** OpenEntityScreen (eventType=`organizer`). Datos: `useOrganizerPublic(id)`.

### Usuario (perfil bailarín)

- **ID:** UUID, `auth.users.id` / `user_id` en vistas de perfil.
- **Opciones:** Ninguna.
- **Pantallas que comparten:** UserPublicScreen, UserProfileLive.
- **Open screen:** OpenEntityScreen (eventType=`user`). Datos: query a `v_user_public` por `user_id`.

### Marca

- **ID:** Numérico, perfil de marca.
- **Opciones:** Ninguna.
- **Pantallas que comparten:** BrandProfileLive.
- **Open screen:** OpenEntityScreen (eventType=`marca`). Datos: `useBrandPublic(id)`.

---

## Rutas web (AppRouter)

Rutas de la smart page (fuera de AppShell):

- `/open/evento/:id`
- `/open/clase/:type/:id`
- `/open/academia/:id`
- `/open/maestro/:id`
- `/open/organizer/:id`
- `/open/u/:id`
- `/open/marca/:id`

Rutas canónicas (dentro de AppShell, detalle):

- `/social/fecha/:id` (evento)
- `/clase/:type/:id` (clase)
- `/academia/:academyId`
- `/maestro/:teacherId`
- `/organizer/:id`, `/organizador/:organizerId`
- `/u/:userId`
- `/marca/:brandId`

---

## Código de referencia

- **Tipos y builders:** `apps/web/src/utils/shareUrls.ts`  
  `ShareEntityType`, `buildShareUrl()`, `buildCanonicalUrl()`, `buildDeepLink()`.
- **Smart page:** `apps/web/src/screens/open/OpenEntityScreen.tsx`.
- **Rutas:** `apps/web/src/AppRouter.tsx`.
- **Mapeo deep link → URL web (app nativa):** `src/screens/WebAppScreen.tsx` → `mapIncomingUrlToWebUrl`.
- **Intent filters Android:** `app.config.ts` → `android.intentFilters`.

---

## Convenciones

1. **Evento:** Compartir siempre con `events_date.id`; no con parent.
2. **Scheme:** Solo `dondebailarmx`; no usar `dondebailar`.
3. **Compartir:** Siempre usar `buildShareUrl(...)` para que el enlace sea la smart page `/open/...`.
4. **App nativa:** Deep link abre la app y el WebView carga la URL canónica (no la `/open/...`).
