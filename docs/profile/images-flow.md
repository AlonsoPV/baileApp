# Flujo de imágenes en UserProfileEditor (avatar / portada / galería)

## Ubicación

- **Componente:** `apps/web/src/screens/profile/UserProfileEditor.tsx`
- **Rutas:** `/profile/edit` (AppRouter), `/profile/user/edit` (router)
- **Stack:** Web (React), Supabase Storage (bucket `media`), tabla `profiles_user`, React Query

## Arquitectura del flujo

### Fuentes de imagen

| Origen | Dónde se guarda | Cómo se muestra en el editor |
|--------|------------------|------------------------------|
| **Avatar (onboarding / App Profile)** | `profiles_user.avatar_url` (URL pública) | Fallback en galería: si no hay slot `p1`, se usa `avatar_url` como p1 |
| **Galería (fotos p1–p10, videos v1–v3)** | `profiles_user.media` (array de `{ slot, kind, url, title }`) | Cada slot se pinta desde `media[]`; `url` es la **URL pública** de Storage |

En DB **no** se guarda base64; solo **URL pública** o path que se resuelve a URL.

### Secuencia de llamadas

#### 1) UPLOAD (nuevo o reemplazo)

1. Usuario elige archivo en `<input type="file">` en `PhotoManagementSection` / `VideoManagementSection`.
2. `UserProfileEditor.uploadFile(file, slot, kind)`:
   - Valida video (máx. 25 s) si `kind === 'video'`.
   - `setUploading({ [slot]: true })`.
   - `uploadToSlot.mutateAsync({ file, slot, kind })`.
3. **useUserMediaSlots.uploadToSlot** (hook):
   - Path en Storage: `user-media/{userId}/{slot}.{ext}` en bucket `media`.
   - `supabase.storage.from("media").upload(path, file, { upsert: true })`.
   - `getPublicUrl(path)` → URL pública.
   - Construye `MediaItem`: `{ slot, kind, url: publicUrl, title }`.
   - `upsertMediaSlot(list, item)` → reemplaza por `slot` en el array.
   - `merge_profiles_user` (RPC) con `{ media: next }`.
   - `onSuccess`: invalida `["profile","media-slots", userId]` y `["profile","me", userId]`, refetch.
4. Editor: `setUploading({ [slot]: false })`, toast éxito/error.

**Replace:** mismo flujo; mismo path `user-media/{id}/{slot}.ext` con `upsert: true`, así que el archivo anterior se sobrescribe.

#### 2) DELETE (eliminar de galería)

1. Usuario pulsa "Eliminar" en un slot.
2. `UserProfileEditor.removeFile(slot)` → `removeFromSlot.mutateAsync(slot)`.
3. **useUserMediaSlots.removeFromSlot**:
   - **Antes (fix):** solo se actualizaba la DB (se quitaba el item del array); el archivo seguía en Storage.
   - **Después (fix):** se obtiene el item del slot, se extrae el path desde la URL pública con `extractStoragePathFromPublicUrl`, se llama a `storage.from("media").remove([path])` (log si falla, no bloquear); luego se actualiza la DB con `removeMediaSlot` + `merge_profiles_user`.
   - `onSuccess`: invalidación y refetch igual que en upload.
4. Toast éxito/error.

#### 3) REPLACE

Es un **upload** al mismo slot: mismo path, `upsert: true`, por tanto el archivo viejo se sobrescribe. No hace falta borrado explícito del archivo anterior.

### Qué se guarda en DB

- **profiles_user.avatar_url:** URL pública completa (p. ej. `https://xxx.supabase.co/storage/v1/object/public/media/avatars/{uuid}.jpg`). Solo se escribe desde onboarding o desde la pantalla App Profile; el editor de perfil no escribe este campo al subir a p1.
- **profiles_user.media:** array de objetos `{ slot, kind, url, title }`. `url` es siempre la **URL pública** de Supabase Storage (no path relativo ni signed URL).

### Caché

- **React Query:** `["profile","media-slots", userId]` para el array de media; `["profile","me", userId]` para el perfil completo.
- Tras upload/delete/replace se invalida ambas queries y se hace refetch para que la UI no dependa de estado local “fantasma”.

### Estrategia de paths en Storage

- **Galería (media slots):** `user-media/{userId}/{slot}.{ext}` (ej. `user-media/abc-123/p1.jpg`).
  - Misma key por slot → **replace** = sobrescritura; no queda archivo huérfano.
  - Cache-busting: se puede añadir `?v={updated_at}` al mostrar la imagen para evitar CDN viejo (helper `getDisplayImageUrl`).
- **Avatar (onboarding/Profile):** `avatars/{userId}.{ext}` en bucket `media`.

## Archivos involucrados

| Archivo | Rol |
|---------|-----|
| `apps/web/src/screens/profile/UserProfileEditor.tsx` | UI del editor, `uploadFile`/`removeFile`, estado `uploading`/`removing`, toasts |
| `apps/web/src/hooks/useUserMediaSlots.ts` | Upload/delete en Storage, actualización de `media` vía `merge_profiles_user`, invalidación de caché |
| `apps/web/src/utils/mediaSlots.ts` | `getMediaBySlot`, `upsertMediaSlot`, `removeMediaSlot`, tipo `MediaItem` |
| `apps/web/src/components/profile/PhotoManagementSection.tsx` | Grid de fotos, input file, botones subir/eliminar, muestra `mediaItem.url` |
| `apps/web/src/components/profile/VideoManagementSection.tsx` | Igual para videos |
| `apps/web/src/lib/supabase.ts` | Cliente Supabase (Storage + RPC) |
| `apps/web/src/utils/storageUrl.ts` | `extractStoragePathFromPublicUrl`, `getDisplayImageUrl` (cache-busting) |

## Causas raíz típicas (y fixes)

| Problema | Causa | Solución |
|----------|--------|----------|
| Eliminar no borra archivo en Storage | Solo se actualizaba DB | Llamar `storage.from("media").remove([path])` en `removeFromSlot`; path desde `extractStoragePathFromPublicUrl(url)` |
| Imagen vieja tras replace | Caché del navegador/CDN | `getDisplayImageUrl(url, profile?.updated_at)` al mostrar |
| Doble subida por doble click | Sin lock | Botón/input deshabilitados con `uploading[slot]` / `removing[slot]` |
| Eliminar no actualiza UI | Caché no invalidada | Ya se invalida en `onSuccess` de las mutations; confirmar refetch |
| URL rota tras migración | Path o bucket distinto | Usar siempre `extractStoragePathFromPublicUrl` con el bucket correcto; no asumir formato de URL |

## Permisos y plataforma

- **Web:** no hay picker nativo iOS/Android; se usa `<input type="file" accept="image/*">`. No hay conversión `content://` ↔ `file://`.
- **Storage:** políticas en `supabase/setup_storage_policies.sql` (bucket `media`: lectura pública, escritura/borrado para autenticados según políticas).

## Checklist de pruebas manuales

### A) Upload (nuevo)
1. Usuario SIN imagen en un slot → subir imagen → debe verse en la UI de inmediato.
2. Recargar pantalla/app → debe persistir (DB correcto).
3. Verificar en Supabase Storage que el archivo existe en `media/user-media/{userId}/{slot}.ext`.

### B) Delete (eliminar)
1. Usuario con imagen en un slot → Eliminar → la UI debe volver al placeholder.
2. Comprobar en DB: el array `media` ya no contiene ese slot.
3. Comprobar en Storage: el archivo se borró (o ver log `[ProfileImage][DELETE][storage-ok]`).
4. Reabrir perfil → no debe “revivir” por caché.

### C) Replace (sustituir)
1. Usuario con imagen → subir otra en el mismo slot → debe reemplazarse en la UI.
2. DB debe apuntar a la nueva URL (mismo path, archivo sobrescrito).
3. No debe haber “flash” de imagen vieja (cache-busting con `imageVersion`).

### D) Edge cases
- Cancelar picker → no debe cambiar nada.
- Imagen muy grande → comprimir o mensaje claro (validación existente).
- Formato no permitido → mensaje claro.
- Doble click en Subir/Eliminar → botones deshabilitados durante la operación (uploading/removing).

## Instrumentación (logs en dev)

En desarrollo se emiten logs `[ProfileImage][UPLOAD|REPLACE|DELETE][...]` con:
- `userId`, `slot`, `storagePath`, `fileSize`, `mimeType` (upload)
- `path`, `code`, `message` en errores
- `storage-ok` / `db-ok` en éxito

No se loguean tokens ni signed URLs completas.
