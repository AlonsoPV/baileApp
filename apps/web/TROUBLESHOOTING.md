# 🔧 Troubleshooting - BaileApp

## 🐛 Errores Comunes y Soluciones

---

## 📸 **Error al subir fotos/videos**

### **Síntoma:**
```
Error al subir archivo
Error: Bucket not found
Error: new row violates row-level security policy
```

### **Causa:**
El bucket `user-media` no existe o las políticas RLS no están configuradas.

---

### **✅ SOLUCIÓN PASO A PASO:**

#### **1. Verificar si el bucket existe:**

En **Supabase Dashboard → Storage → Buckets**

- ¿Ves un bucket llamado `user-media`?
- ¿Está marcado como público?

Si NO existe, continúa con el paso 2.

#### **2. Crear el bucket `user-media`:**

**Opción A: Desde UI**
```
1. Supabase Dashboard → Storage
2. Clic en "New bucket"
3. Name: user-media
4. Public bucket: ✅ (activado)
5. Clic "Create bucket"
```

**Opción B: Desde SQL**
```sql
-- Ejecutar en Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-media', 'user-media', true)
ON CONFLICT (id) DO NOTHING;
```

#### **3. Configurar políticas RLS:**

Ejecuta el script completo en **Supabase SQL Editor**:

```sql
-- COPIAR Y EJECUTAR: apps/web/DATABASE_STORAGE.sql
-- O ejecutar estas políticas manualmente:

-- Eliminar políticas viejas (si existen)
DROP POLICY IF EXISTS "Users can upload own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;

-- Crear nuevas políticas
-- 1) Upload (solo a su propia carpeta)
CREATE POLICY "Users can upload own media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2) Update
CREATE POLICY "Users can update own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3) Delete
CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4) Public read
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-media');
```

#### **4. Verificar políticas:**

```sql
-- Ver políticas del bucket
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%media%'
ORDER BY policyname;
```

Deberías ver 4 políticas.

#### **5. Agregar columna `media` a `profiles_user`:**

```sql
-- Agregar columna si no existe
ALTER TABLE profiles_user 
ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_profiles_user_media 
ON profiles_user USING GIN (media);
```

#### **6. Verificar en la app:**

```javascript
// Abre la consola del navegador (F12)
// Deberías ver logs como:
[Storage] Uploading file: { userId: '...', fileName: 'photo.jpg', ... }
[Storage] Upload successful: { path: '...' }
[useUserMedia] Media added successfully
```

---

## 🔐 **Error: "RLS policy violation"**

### **Causa:**
Las políticas RLS del bucket están mal configuradas o conflictivas.

### **Solución:**

1. **Eliminar TODAS las políticas del bucket:**

```sql
-- Ver todas las políticas
SELECT policyname FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Eliminar una por una
DROP POLICY IF EXISTS "nombre_de_la_politica" ON storage.objects;
```

2. **Recrear solo las 4 políticas necesarias** (del paso 3 anterior)

3. **Verificar que solo haya 4 políticas para user-media**

---

## 📊 **Error: "Cannot coerce to single JSON object"**

### **Causa:**
La consulta a `profiles_user` no encuentra el registro o retorna múltiples.

### **Solución:**

```sql
-- Verificar que tu perfil existe
SELECT user_id, display_name, media 
FROM profiles_user 
WHERE user_id = auth.uid();
```

Si no existe, crea uno desde el onboarding.

---

## 🖼️ **Las imágenes no se muestran**

### **Causa:**
El bucket no es público o las URLs son incorrectas.

### **Solución:**

1. **Verificar que el bucket sea público:**

```sql
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'user-media';
```

`public` debe ser `true`.

2. **Si es `false`, actualizarlo:**

```sql
UPDATE storage.buckets 
SET public = true 
WHERE id = 'user-media';
```

3. **Verificar URL pública:**

```javascript
// En consola del navegador
console.log(publicUrl('test-path'));
// Debería retornar: https://[proyecto].supabase.co/storage/v1/object/public/user-media/test-path
```

---

## 🎥 **Los videos no se reproducen**

### **Causa:**
Formato no soportado por el navegador.

### **Solución:**

1. **Formatos recomendados:**
   - ✅ MP4 (H.264)
   - ✅ WebM
   - ⚠️ MOV (puede no funcionar en todos los navegadores)

2. **Agregar atributos al video tag:**

```typescript
<video 
  src={url} 
  controls 
  preload="metadata"
  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
>
  Tu navegador no soporta video HTML5
</video>
```

---

## 🚫 **Error: "Bucket not found"**

### **Solución Rápida:**

```sql
-- Crear bucket manualmente
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-media', 'user-media', true);

-- Verificar
SELECT * FROM storage.buckets WHERE id = 'user-media';
```

---

## 📝 **Checklist de Verificación:**

```
Antes de reportar un error, verifica:

✅ Bucket "user-media" existe
✅ Bucket "user-media" es público (public = true)
✅ 4 políticas RLS están creadas
✅ Columna "media" existe en profiles_user
✅ Usuario está autenticado (auth.uid() retorna valor)
✅ Consola del navegador no muestra errores
✅ Script DATABASE_STORAGE.sql se ejecutó completo
```

---

## 🔍 **Debugging:**

### **Ver logs en consola:**

```javascript
// Abrir DevTools (F12) → Console
// Buscar logs con [Storage] y [useUserMedia]

[Storage] Uploading file: {...}
[Storage] Upload successful: {...}
[useUserMedia] File uploaded, updating profile...
[useUserMedia] Media added successfully
```

### **Si aparece error:**

```javascript
[Storage] Upload error: { message: "..." }
```

Copia el mensaje completo y busca en esta guía.

---

## 🛠️ **Script de Verificación Completo:**

```sql
-- COPIAR Y EJECUTAR EN SUPABASE SQL EDITOR

-- 1. Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'user-media';

-- 2. Verificar políticas
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%media%';

-- 3. Verificar columna
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'profiles_user' 
  AND column_name = 'media';

-- 4. Ver mi perfil
SELECT user_id, display_name, media 
FROM profiles_user 
WHERE user_id = auth.uid();
```

**Resultados esperados:**
- Bucket: 1 fila con `public = true`
- Políticas: 4 filas
- Columna: 1 fila con `data_type = jsonb`
- Perfil: 1 fila con tu usuario

---

## 🎯 **Solución Definitiva:**

Si nada funciona, ejecuta este script completo:

```sql
-- RESET COMPLETO DEL SISTEMA DE MEDIA

-- 1. Eliminar bucket viejo (si existe)
DELETE FROM storage.buckets WHERE id = 'user-media';

-- 2. Crear bucket nuevo
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-media', 'user-media', true);

-- 3. Eliminar todas las políticas de media
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND policyname LIKE '%media%'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON storage.objects';
  END LOOP;
END $$;

-- 4. Crear las 4 políticas
-- (copiar del paso 3 anterior)

-- 5. Agregar columna media
ALTER TABLE profiles_user 
ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;

-- 6. Verificar
SELECT 'Bucket:', * FROM storage.buckets WHERE id = 'user-media'
UNION ALL
SELECT 'Policies:', policyname::text, NULL, NULL, NULL, NULL 
FROM pg_policies 
WHERE schemaname = 'storage' AND policyname LIKE '%media%';
```

---

## 📞 **Ayuda Adicional:**

### **Revisar logs de Supabase:**
```
Supabase Dashboard → Logs → API Logs
```

Busca errores relacionados con:
- `storage.objects`
- `user-media`
- `RLS`

### **Probar manualmente:**

```sql
-- Test de upload (simula el proceso)
-- 1. Ver mi user_id
SELECT auth.uid();

-- 2. Probar política de upload
SELECT 
  bucket_id = 'user-media'
  AND (storage.foldername('USER_ID_AQUI/test.jpg'))[1] = auth.uid()::text;
```

---

**¿Necesitas más ayuda?** Comparte el error exacto de la consola y te ayudo específicamente. 🚀
