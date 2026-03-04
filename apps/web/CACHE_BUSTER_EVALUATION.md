# Evaluación: fix de caché de imágenes (Supabase)

## Objetivo
- Evitar re-descargas por querystrings variables (`?_t=timestamp`).
- Cache-bust estable con `v=` basado en `updated_at` / `created_at` / `id`.
- `cacheControl` largo (1 año) en uploads de Supabase Storage.
- No usar `Date.now()` / `performance.now()` / `Math.random()` en URLs de imágenes.

## Impacto y no afectación

### A) Helper único
- **Archivo:** `apps/web/src/utils/cacheBuster.ts`
- **Impacto:** Bajo. Nueva utilidad; no cambia comportamiento hasta que se use.
- **Nota:** `utils/storageUrl.ts` ya tiene `getDisplayImageUrl(url, version)` con `v=`. Se unifica criterio con `withStableCacheBust` (mismo parámetro `v=`); se puede migrar usos de `getDisplayImageUrl` a `withStableCacheBust` si se desea un solo punto de uso.

### B) Reemplazo de `_t=` por `v=` estable

| Archivo | Uso actual | Clave estable ya usada | Acción |
|---------|------------|------------------------|--------|
| EventCard.tsx | `_t=${flyerCacheKey}` | updated_at \|\| created_at \|\| events_parent.* \|\| id | Cambiar a `withStableCacheBust(url, flyerCacheKey)` y param `v=` |
| EventDatePublicScreen.tsx | `_t=${key}` para flyer | flyerCacheKey estable | Idem |
| EventHero.tsx | `_t=${flyerCacheKey}` | Recibe flyerCacheKey por props | Idem |
| AcademyCard.tsx | `_t=${key}` | updated_at \|\| created_at \|\| id | Idem |
| TeacherCard.tsx | `_t=${key}` | idem | Idem |
| OrganizerCard.tsx | `_t=${key}` | idem | Idem |
| ClassCard.tsx | `_t=${key}` | idem | Idem |
| DancerCard.tsx | `_t=${key}` | idem | Idem |
| BrandCard.tsx | `_t=${key}` | idem | Idem |
| DateFlyerUploader.tsx | **`_t=${Date.now()}`** | Ninguna (preview) | Recibir `version?: string \| number \| null` (ej. date.updated_at) y usar `withStableCacheBust`; si no hay version, no añadir query (evitar Date.now()). |
| Profile.tsx (avatar) | **`?t=${Date.now()}`** al guardar URL | profile.updated_at tras refetch | No guardar el query en BD; en la UI usar `withStableCacheBust(avatarUrl, profile?.updated_at)` donde se muestre el avatar. En el guardado, guardar solo la URL base (sin `?t=`) y dejar que el cache-bust sea solo en render. |

**Riesgo:** Bajo. Las claves estables ya existen en cards/screens; solo se cambia el nombre del query de `_t` a `v` y se centraliza en el helper. Comportamiento funcional igual; mejora caché.

### C) cacheControl en uploads

| Archivo | Valor actual | Cambio |
|---------|--------------|--------|
| useEventDateMedia.ts | "3600" | "31536000" |
| useEventParentMedia.ts | "3600" | "31536000" |
| useOrganizerMedia.ts | "3600" | "31536000" |
| useAcademyMedia.ts | "3600" | "31536000" |
| useTeacherMedia.ts | "3600" | "31536000" |
| useCompetitionGroupMedia.ts | "3600" | "31536000" |
| lib/storage.ts (user-media) | "3600" | "31536000" |
| BrandProfileEditor.tsx | "3600" | "31536000" |
| ChallengeDetail.tsx | "3600" | "31536000" |
| ChallengeNew.tsx | "3600" | "31536000" |

**Impacto:** Positivo. Caché largo; el navegador no revalida mientras la URL sea la misma. Al subir una nueva imagen, el path o el `v=` cambian, por lo que se descarga la nueva versión. No afecta al funcionamiento actual.

### D) No tocar (Date.now / performance.now / Math.random)

- **IDs de filas / keys de React / requestId:** EventParentEditScreen, OrganizerEventDateEditScreen, EventDateEditScreen, EventEditor, ScheduleEditor, OrganizerProfileEditor, etc. — uso legítimo para IDs únicos, no para URLs. **No cambiar.**
- **Paths de upload con Date.now() + uuid:** useEventDateMedia, useOrganizerMedia, useAcademyMedia, useTeacherMedia, useEventParentMedia, lib/storage, BrandProfileEditor, ChallengeDetail, etc. — el path único ya versiona el archivo; cambiar a otro esquema (ej. solo uuid) es opcional y no requerido para el fix de caché. **Opcional:** mantener como está o usar solo uuid/crypto.randomUUID() para el nombre de archivo.
- **performance.now():** useRSVP, useMyRSVPs, useExploreQuery, useEventParent, useEventDateSuspense, useRenderLogger — métricas/debug. **No cambiar.**
- **Date.now() para throttling / debounce:** magicLinkAuth, scrollLockWatchdog, HorizontalSlider, EventDatesSheet — no relacionado con URLs. **No cambiar.**

### Resumen
- **Funcionamiento actual:** No se rompe. Misma lógica de “cuándo refrescar” (updated_at/created_at/id); solo se unifica el param `v=` y se elimina el uso de timestamps en URLs de imágenes.
- **DateFlyerUploader:** Requiere que el padre pase `version` (ej. `date?.updated_at`) cuando esté editando una fecha; si no hay version, se muestra la URL sin query (estable).
- **Profile.tsx:** Guardar en BD solo la URL base del avatar; en componentes que muestran el avatar, usar `withStableCacheBust(avatarUrl, profile?.updated_at)`.
