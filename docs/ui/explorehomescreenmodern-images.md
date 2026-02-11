# Diagnóstico: Imágenes de fondo en cards de ExploreHomeScreenModern

## Resumen

Este documento describe la **causa raíz** de las imágenes que no se muestran en las cards de la pantalla de inicio (ExploreHomeScreenModern), las **evidencias** y los **cambios aplicados** para corregirlo y evitar mensajes genéricos.

## Stack real

- **Pantalla**: `apps/web/src/screens/explore/ExploreHomeScreenModern.tsx`
- **Render**: Web (React/Vite). Las cards se renderizan en la app web que puede cargarse dentro de un WebView en RN; no se usan componentes React Native (`ImageBackground`/`FastImage`) aquí.
- **Componentes de card**: EventCard, ClassCard, AcademyCard, TeacherCard, OrganizerCard, BrandCard, DancerCard en `apps/web/src/components/explore/cards/`.

## Cómo se pinta la imagen de fondo

En todas las cards:

1. Se obtiene una URL de imagen a partir del `item` (prioridad por tipo: flyer/cover/avatar/portada/media, según el card).
2. La URL se normaliza con `normalizeAndOptimizeUrl()` en `apps/web/src/utils/imageOptimization.ts` (y en DancerCard además se usa `toSupabasePublicUrl` para rutas tipo `bucket/path`).
3. Se usa un **`<img>`** con `src={url}` y, vía CSS, una variable `--img` para el fondo difuminado (`.media::before` / `.explore-card-media::before`).
4. Estilos: el contenedor tiene `aspect-ratio`, `overflow: hidden`, `border-radius`; la imagen tiene `object-fit: cover`, `position: absolute`, `inset: 0`.

## Causas raíz identificadas

| Causa | Descripción | Solución aplicada |
|-------|-------------|--------------------|
| **URL vacía** | `flyer_url` / `ownerCoverUrl` / `portada_url` / etc. null, undefined o "" para ese item. | Placeholder consistente (gradiente + ícono) y log `[ExploreCard] … reason=URL vacía`. |
| **URL relativa sin base** | URL tipo `bucket/path` o relativa sin `VITE_SUPABASE_URL` (o sin origen). | `ensureAbsoluteImageUrl()` retorna `null`; `normalizeAndOptimizeUrl()` retorna `undefined`; no se pinta imagen; placeholder + log "URL relativa sin base". |
| **HTTP bloqueado** | URL `http://` en página servida por HTTPS. | `ensureAbsoluteImageUrl()` retorna `null` en ese caso; placeholder; log "HTTP bloqueado en página HTTPS". |
| **404 / fallo de carga** | La URL es válida pero el recurso no existe o falla la red. | Handlers `onError` en `<img>`: log `[CardImageError] type=… id=… uri=… error=…` y estado `imageError` → se muestra el mismo placeholder (data-reason="Image load failed"). |
| **CORS/CSP** | Si el storage o CDN no permite el origen de la app. | Mismo `onError`; mensaje en consola con la URI que falló para poder comprobar headers en ese dominio. |

No se detectó como causa: "Style height=0 / overlay" (el contenedor tiene `aspect-ratio` y la imagen rellena el área correctamente).

## Evidencias y logs

- **En desarrollo** (solo si `import.meta.env.DEV`):
  - Por cada card se hace un log:  
    `[ExploreCard] type=<evento|clase|academia|maestro|organizador|marca|dancer> id=… imageUrl=… valid=true|false [reason=…]`
- **Siempre** (dev y prod) cuando una imagen falla al cargar:
  - `[CardImageError] type=… id=… uri=… error=…`
- Placeholder visible:
  - Atributo `data-reason` en el div del placeholder: `"URL vacía"` | `"Image load failed"` para inspección en DevTools.

## Tabla de campos por tipo de card

| Card | Campos usados (prioridad) | Campo principal |
|------|---------------------------|-----------------|
| EventCard | flyer_url, media slot p1, avatar, avatar_url, portada_url, media[0] | flyer_url |
| ClassCard | ownerCoverUrl | ownerCoverUrl |
| AcademyCard | media p1/cover, avatar_url, portada_url, media[0] | getMediaBySlot('p1') / cover |
| TeacherCard | media p1, avatar_url, banner_url, portada_url, media by slot cover/avatar, media[0] | banner_url / avatar |
| OrganizerCard | media p1, avatar, avatar_url, portada_url, cover, media[0] | slot p1 / avatar_url |
| BrandCard | portada_url, media[0], avatar_url | portada_url |
| DancerCard | banner_url, portada_url, avatar_url, media by slot, media[0] | banner_url / portada_url |

Si en Supabase/API el campo se llama distinto (ej. `cover` vs `portada_url`), la card no tendrá URL y se mostrará el placeholder con "URL vacía".

## Cambios realizados (PR)

1. **`apps/web/src/utils/imageOptimization.ts`**
   - `ensureAbsoluteImageUrl(url)`: convierte relativas a absolutas con base Supabase; retorna `null` si no hay base o si es `http` en página HTTPS.
   - `logCardImage(type, id, imageUrl, valid, reason?)`: log de diagnóstico solo en DEV.
   - `normalizeAndOptimizeUrl()`: usa `ensureAbsoluteImageUrl()` para http/absolute y para relativas; retorna `undefined` cuando la URL no es válida (relativa sin base, HTTP bloqueado).

2. **Placeholder unificado**
   - Estilo `.explore-card-media-placeholder` en `_sharedExploreCardStyles.ts` (gradiente + ícono).
   - EventCard/ClassCard: clases `.media-placeholder` y `.class-card-media-placeholder` con el mismo aspecto.
   - Todas las cards muestran este placeholder cuando no hay URL o cuando `onError` dispara (`imageError`).

3. **Handlers en cada card**
   - `onLoad`: `logCardImage(…, 'load')` y `setImageError(false)`.
   - `onError`: `console.warn('[CardImageError] ...')` con type, id, uri, error; `setImageError(true)`.

4. **Mensajes concretos (no genéricos)**
   - Placeholder `data-reason`: "URL vacía" | "Image load failed".
   - Consola: "URL relativa sin base", "HTTP bloqueado en página HTTPS", "[CardImageError] type=… uri=… error=…".

## Validación

- **iOS / Android**: Revisar 20+ cards seguidas (eventos, clases, academias, maestros, organizadores, marcas, dancers): las que tengan imagen deben mostrarla; las que no (o que fallen al cargar) deben mostrar el placeholder con el mismo estilo.
- **DevTools**: En cards sin imagen, comprobar `data-reason` y logs `[ExploreCard]` / `[CardImageError]` para confirmar la causa.

## Reproducibilidad (checklist)

- [ ] iOS simulador: varias cards con y sin imagen.
- [ ] Android emulador: idem.
- [ ] Dispositivos reales iOS/Android si es posible.
- [ ] Producción vs dev: comprobar que `VITE_SUPABASE_URL` esté definida en el build de producción para que las URLs relativas se resuelvan.
- [ ] Abrir en navegador la URL que falla: status 200 y `content-type` correcto; si 404, corregir datos o storage.
