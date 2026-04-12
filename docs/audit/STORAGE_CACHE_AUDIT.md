# Storage Cache Audit

Fecha: 2026-04-10
Repo: `baileapp-mobile`
Scope: `apps/web/src`

## Resumen ejecutivo

El hallazgo de TTL corto quedo dividido en dos grupos:

1. Assets con path nuevo por reemplazo: seguros para `cacheControl: 31536000`.
2. Assets con path fijo y `upsert: true`: solo seguros si todos los renders consumen la URL con `?v=` confiable.

En esta iteracion ya quedaron cubiertos los pendientes de usuario:

- `apps/web/src/screens/app/Profile.tsx`
- `apps/web/src/hooks/useUserMediaSlots.ts`
- `apps/web/src/screens/profile/UserProfileLive.tsx`

Tambien se agrego cobertura para el flujo de onboarding en `apps/web/src/screens/onboarding/ProfileBasics.tsx`, porque usa el mismo path fijo de avatar (`media/avatars/{userId}.{ext}`).

## Hallazgos globales

- No se encontraron usos de `supabase.storage.from(...).update(...)`.
- La construccion de URLs de Storage quedo centralizada en `apps/web/src/utils/supabaseStoragePublicUrl.ts`.
- Para usuario, la fuente canonica de version ahora es `profiles_user.updated_at`.
- Para listas de seguidores/seguidos, se amplio el backend para exponer `updated_at` y usar la misma regla.

## Helper unico

Helpers disponibles:

- `buildSupabaseStoragePublicUrl(path, { bucket, version? })`
- `resolveVersionedSupabaseStoragePublicUrl(maybePath, version, { defaultBucket })`
- `resolveVersionedSupabaseStorageDirectUrl(maybePath, version, { defaultBucket })`

Regla aplicada:

- Avatar, cover y slots del usuario usan `profile.updated_at` como `version`.
- Avatares de followers/following usan `updated_at` del perfil seguido.

## Mapa exhaustivo de avatar / cover / user-media

| Componente / hook | Path consumido | `?v=` | Fuente del version param | Estado |
| --- | --- | --- | --- | --- |
| `apps/web/src/screens/app/Profile.tsx` | `media/avatars/{userId}.png` | Si | `profile.updated_at` | Cubierto |
| `apps/web/src/components/Navbar.tsx` | `profile.avatar_url` | Si | `profile.updated_at` | Cubierto |
| `apps/web/src/components/layout/AppShell.tsx` | `profile.avatar_url` o slot `p1` | Si | `profile.updated_at` | Cubierto |
| `apps/web/src/components/profile/UserProfileHero.tsx` | Avatar recibido por props | Si | `avatarCacheKey` del padre | Cubierto |
| `apps/web/src/screens/profile/UserProfileLive.tsx` | `profile.avatar_url`, slots `avatar/p1`, community avatars | Si | `profile.updated_at` / `person.updated_at` | Cubierto |
| `apps/web/src/screens/profile/UserPublicScreen.tsx` | `profile.avatar_url`, slots `avatar/p1`, community avatars | Si | `profile.updated_at` / `person.updated_at` | Cubierto |
| `apps/web/src/components/profile/PhotoManagementSection.tsx` | slots `user-media/{userId}/{slot}.{ext}` | Si | `imageVersion` del padre | Cubierto |
| `apps/web/src/screens/profile/UserProfileEditor.tsx` | Fallback de `profile.avatar_url` hacia slot `p1` | Si en render final | `profile.updated_at` via `imageVersion` | Cubierto |
| `apps/web/src/screens/onboarding/ProfileBasics.tsx` | `media/avatars/{userId}.{ext}` | Si | `profile.updated_at` | Cubierto |
| `apps/web/src/hooks/useUserMediaSlots.ts` | URLs guardadas en `media[]` | Si en consumidores | `profile.updated_at` refetchado | Cubierto |
| `apps/web/src/screens/profile/UserProfileLive.tsx` cover upload | `media/user-covers/{userId}/cover.{ext}` | No hay render activo directo hoy | N/A | Guardado listo, sin consumidor activo |

## Flujos de upload con path fijo

| Flujo | Archivo | Path | `cacheControl` | Motivo de seguridad |
| --- | --- | --- | --- | --- |
| Avatar perfil | `apps/web/src/screens/app/Profile.tsx` | `media/avatars/{userId}.png` | `31536000` | Todos los renders auditados ya usan `profile.updated_at` |
| Avatar onboarding | `apps/web/src/screens/onboarding/ProfileBasics.tsx` | `media/avatars/{userId}.{ext}` | `31536000` | Mismo path fijo, misma fuente `profile.updated_at` |
| Slots usuario | `apps/web/src/hooks/useUserMediaSlots.ts` | `media/user-media/{userId}/{slot}.{ext}` | `31536000` | `PhotoManagementSection`, hero y pantallas publicas usan version consistente |
| Cover usuario | `apps/web/src/screens/profile/UserProfileLive.tsx` | `media/user-covers/{userId}/cover.{ext}` | `31536000` | El registro de perfil actualiza `updated_at` al reemplazar |
| Uploads legacy dentro de `UserProfileLive` | `apps/web/src/screens/profile/UserProfileLive.tsx` | `media/user-media/{userId}/{slot}.{ext}` | `31536000` | Se alinearon por consistencia con la regla del perfil |

## Validacion de `imageVersion`

`useUserMediaSlots` no llevaba un timestamp manual propio. La version correcta ya estaba disponible en el perfil:

- La mutacion guarda `media` via `merge_profiles_user`.
- El RPC `merge_profiles_user` actualiza `updated_at = now()`.
- Se reforzo el flujo para refetchear `["profile","me", userId]` tras upload/remove, no solo invalidarlo.
- `UserProfileEditor` pasa `imageVersion={profile?.updated_at}` a `PhotoManagementSection`.

Resultado:

- Reemplazar un slot actualiza `profiles_user.updated_at`.
- Los renders que consumen ese slot vuelven a calcular la URL con un `?v=` distinto.

## Cambios de backend

Para followers/following se necesitaba la misma fuente de version:

- `supabase/11_follow_lists.sql`
- `supabase/migrations/20260410_follow_lists_include_profile_updated_at.sql`

Ahora `get_following_profiles(...)` y `get_follower_profiles(...)` devuelven:

- `user_id`
- `display_name`
- `avatar_url`
- `updated_at`

## Otros flujos auditados

| Flujo | Archivo(s) | Bucket/path | `?v=` confiable | `cacheControl` | Estado |
| --- | --- | --- | --- | --- | --- |
| Flyer de `events_date` | `apps/web/src/lib/uploadEventFlyer.ts` | `media/event-flyers/.../{dateId}_flyer.ext` | Si, con `updated_at` | `31536000` | Seguro |
| Media de evento padre | `apps/web/src/hooks/useEventParentMedia.ts` | `media/event-media/.../{timestamp}-{uuid}` | Si, path unico | `31536000` | Seguro |
| Media de fecha de evento | `apps/web/src/hooks/useEventDateMedia.ts` | `org-media/event-dates/.../{timestamp}-{uuid}` | Si, path unico | `31536000` | Seguro |
| Media organizer | `apps/web/src/hooks/useOrganizerMedia.ts` | `media/organizer-media/.../{timestamp}-{uuid}` | Si, path unico | `31536000` | Seguro |
| Media teacher | `apps/web/src/hooks/useTeacherMedia.ts` | `media/teacher/.../{timestamp}-{uuid}` | Si, path unico | `31536000` | Seguro |
| Media academy | `apps/web/src/hooks/useAcademyMedia.ts` | `media/academy/.../{timestamp}-{uuid}` | Si, path unico | `31536000` | Seguro |
| Media competition groups | `apps/web/src/hooks/useCompetitionGroupMedia.ts` | `media/competition-groups/.../{timestamp}-{uuid}` | Si, path unico | `31536000` | Seguro |
| User media random | `apps/web/src/lib/storage.ts` | `user-media/{userId}/{timestamp}-{uuid}` | Si, path unico | `31536000` | Seguro |
| Challenge cover/video/submission | `apps/web/src/screens/challenges/ChallengeNew.tsx`, `apps/web/src/screens/challenges/ChallengeDetail.tsx` | `media/challenges/.../{timestamp}` | Si, path unico | `31536000` | Seguro |
| Brand catalog y logo | `apps/web/src/screens/profile/BrandProfileEditor.tsx` | `media/brand/.../{timestamp}` y `{brandId}/logo-{timestamp}` | Si, path unico o `updated_at` | `31536000` | Seguro |
| Trending cover | `apps/web/src/pages/trending/TrendingAdmin.tsx` | `media/trending-covers/{timestamp}-{random}` | Si, path unico | `31536000` | Seguro |

## Estado final de la auditoria

- Todos los renders auditados de avatar usan helper central con `?v=` basado en `updated_at`.
- Los renders de slots usan la misma fuente `profile.updated_at`.
- Los uploads pendientes con path fijo ya usan `cacheControl: 31536000`.
- La invalidacion de `imageVersion` para slots quedo reforzada.

## Validacion pendiente fuera del repo

No se ejecuto DevTools ni Lighthouse desde esta iteracion. Queda pendiente verificar manualmente:

1. URL del asset con `?v=`.
2. Cambio de `?v=` despues de reemplazar avatar / slot / cover.
3. Header `Cache-Control: max-age=31536000`.
4. Re-run de Lighthouse sin hallazgo de TTL corto.
