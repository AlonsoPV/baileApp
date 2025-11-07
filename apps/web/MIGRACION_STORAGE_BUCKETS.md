# 🗂️ MIGRACIÓN DE STORAGE BUCKETS DE STAGING A PRODUCCIÓN

## 📋 MÉTODOS PARA MIGRAR BUCKETS

### MÉTODO 1: Manual desde Dashboard (Recomendado para pocos buckets)

#### 1️⃣ Identificar buckets en Staging
Ve a: **Staging Supabase Dashboard** → **Storage** → Ver todos los buckets

#### 2️⃣ Crear buckets en Producción
Para cada bucket en staging:

1. Ve a: **Producción Supabase Dashboard** → **Storage** → **New bucket**
2. Configura:
   - **Name**: Mismo nombre que en staging (ej: `media`, `avatars`, etc.)
   - **Public bucket**: ✅ Si el bucket es público, ❌ si es privado
   - **File size limit**: Mismo límite que staging (ej: 50MB)
   - **Allowed MIME types**: Mismos tipos que staging (ej: `image/*`, `video/*`)

#### 3️⃣ Configurar políticas de acceso
Para cada bucket, copia las políticas de staging a producción.

---

### MÉTODO 2: Via SQL (Para políticas de Storage)

Las políticas de storage se pueden migrar con SQL:

```sql
-- ============================================================================
-- VER POLÍTICAS DE STORAGE EN STAGING
-- ============================================================================

-- Ver todos los buckets
SELECT * FROM storage.buckets ORDER BY name;

-- Ver políticas de un bucket específico
SELECT 
    name,
    definition,
    check_definition
FROM storage.policies
WHERE bucket_id = 'NOMBRE_DEL_BUCKET'
ORDER BY name;
```

---

## 📦 BUCKETS COMUNES EN TU PROYECTO

Basándome en tu proyecto, probablemente tienes estos buckets:

### 1. **`media`** (Bucket principal)
- **Público**: ✅ Sí
- **Uso**: Avatares, fotos de perfil, media general
- **Rutas**: 
  - `academy/{academy_id}/...`
  - `teacher/{teacher_id}/...`
  - `brand/{brand_id}/...`
  - `challenges/{challenge_id}/...`
  - `trending-covers/...`

### 2. **`event-flyers`** (Opcional)
- **Público**: ✅ Sí
- **Uso**: Flyers de eventos

---

## 🔧 SCRIPT PARA VERIFICAR BUCKETS

Ejecuta esto en **STAGING** para ver tu configuración actual:

```sql
-- Ver todos los buckets y su configuración
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
ORDER BY name;

-- Ver políticas de cada bucket
SELECT 
    b.name as bucket_name,
    p.name as policy_name,
    p.definition,
    p.check_definition
FROM storage.policies p
JOIN storage.buckets b ON b.id = p.bucket_id
ORDER BY b.name, p.name;
```

---

## 🎯 PASOS PARA MIGRACIÓN COMPLETA

### PASO 1: Crear buckets en producción

**Opción A: Desde Dashboard (Recomendado)**
1. Ve a Producción → Storage → New bucket
2. Crea cada bucket con la misma configuración que staging

**Opción B: Via SQL (Avanzado)**
```sql
-- Ejecutar en PRODUCCIÓN
-- Reemplaza los valores según tu configuración de staging

-- Bucket principal 'media'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    true,
    52428800, -- 50MB en bytes
    ARRAY['image/*', 'video/*']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket 'event-flyers' (si lo usas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'event-flyers',
    'event-flyers',
    true,
    10485760, -- 10MB en bytes
    ARRAY['image/*']
)
ON CONFLICT (id) DO NOTHING;
```

### PASO 2: Configurar políticas de Storage

Las políticas más comunes para tu proyecto:

```sql
-- ============================================================================
-- POLÍTICAS PARA BUCKET 'media'
-- ============================================================================

-- Política: Lectura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- Política: Usuarios autenticados pueden subir
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Política: Usuarios pueden actualizar sus propios archivos
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política: Usuarios pueden eliminar sus propios archivos
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- POLÍTICAS PARA BUCKET 'event-flyers' (si existe)
-- ============================================================================

-- Política: Lectura pública
CREATE POLICY "Public read access for flyers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-flyers');

-- Política: Usuarios autenticados pueden subir
CREATE POLICY "Authenticated users can upload flyers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-flyers');
```

### PASO 3: Verificar en producción

```sql
-- Ver buckets creados
SELECT * FROM storage.buckets ORDER BY name;

-- Ver políticas aplicadas
SELECT 
    b.name as bucket_name,
    p.name as policy_name,
    p.definition
FROM storage.policies p
JOIN storage.buckets b ON b.id = p.bucket_id
ORDER BY b.name, p.name;
```

---

## ⚠️ IMPORTANTE

1. **NO migres los archivos**: Los archivos (contenido) de staging NO deben copiarse a producción. Producción tendrá sus propios archivos subidos por usuarios reales.

2. **Verifica URLs**: Después de crear los buckets, verifica que las URLs de storage funcionen:
   ```
   https://[tu-proyecto-prod].supabase.co/storage/v1/object/public/media/...
   ```

3. **Prueba subida**: Después de configurar, prueba subir un archivo desde tu frontend en producción para verificar que las políticas funcionan.

---

## 🔍 TROUBLESHOOTING

### Problema: "Bucket not found"
**Solución**: Verifica que el bucket existe en producción:
```sql
SELECT * FROM storage.buckets WHERE name = 'NOMBRE_DEL_BUCKET';
```

### Problema: "new row violates row-level security policy"
**Solución**: Verifica que las políticas de INSERT están configuradas:
```sql
SELECT * FROM storage.policies 
WHERE bucket_id = 'NOMBRE_DEL_BUCKET' 
  AND definition LIKE '%INSERT%';
```

### Problema: Archivos no se ven (403 Forbidden)
**Solución**: 
1. Verifica que el bucket es público: `public = true`
2. Verifica que existe política de SELECT para `public`

---

## 📝 CHECKLIST FINAL

- [ ] Identificar todos los buckets en staging
- [ ] Crear buckets en producción con misma configuración
- [ ] Aplicar políticas de storage en producción
- [ ] Verificar que los buckets existen
- [ ] Verificar que las políticas están activas
- [ ] Probar subida de archivo desde frontend
- [ ] Probar lectura de archivo público
- [ ] Verificar URLs de storage funcionan

---

## 🎯 RESUMEN EJECUTIVO

**Para migrar rápido:**

1. **Dashboard** → Storage → Copia manualmente cada bucket
2. **SQL Editor** → Ejecuta las políticas de storage
3. **Verifica** → Prueba subir/leer archivos
4. **Listo!** ✅

¿Necesitas ayuda con algún bucket específico?

