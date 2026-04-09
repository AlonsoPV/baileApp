# Supabase Storage: imágenes y caché (Explore)

## Transformaciones (WebP / srcset)

El front usa `VITE_SUPABASE_IMAGE_TRANSFORMS=true` para generar URLs bajo `/storage/v1/render/image/public/...` con `width`, `quality`, `format=webp` y `resize` (`cover` o `contain` según el preset). Sin este flag, las cards siguen funcionando con la URL pública directa (`/object/public/...`).

Activar en el entorno de build (p. ej. `.env` / CI) y confirmar que el proyecto de Supabase tiene **Image Transformations** habilitadas.

## Cache-Control e inmutabilidad

Para aprovechar `?v=` estable (`withStableCacheBust`), conviene que los objetos públicos sirvan con cabeceras largas, por ejemplo:

`Cache-Control: public, max-age=31536000, immutable`

La configuración exacta depende de Supabase Storage, CDN delante del bucket o reglas de proxy; no está versionada en este repo. Tras cambiar una imagen, el front debe seguir busteando con un `v` distinto (p. ej. `updated_at`).
