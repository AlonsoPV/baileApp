# 🚀 MIGRACIÓN DE STAGING A PRODUCCIÓN

## 📋 ORDEN DE EJECUCIÓN DE SCRIPTS SQL

Ejecuta estos scripts **EN ORDEN** en tu base de datos de producción para homologarla con staging.

---

## ✅ PASO 1: PERFILES DE USUARIO (profiles_user)

### 1.1 Verificar estructura actual
```sql
SELECT column_name, data_type, udt_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles_user'
ORDER BY ordinal_position;
```

### 1.2 Actualizar datos de usuario
Ya ejecutaste el merge de tus dos usuarios. ✅

---

## ✅ PASO 2: ROLES Y SEGURIDAD

### 2.1 Corregir recursión en user_roles
**Archivo:** `FIX_USER_ROLES_RECURSION.sql`
- Crea función `is_superadmin()` con SECURITY DEFINER
- Corrige políticas RLS de `user_roles`, `challenges`, `challenge_submissions`, `challenge_votes`

### 2.2 Asignar rol superadmin
```sql
-- Verificar tu user_id actual
SELECT id, email FROM auth.users WHERE email = 'tu_email@ejemplo.com';

-- Asignar superadmin (usa tu user_id correcto)
INSERT INTO public.user_roles (user_id, role_name)
VALUES ('39555d3a-68fa-4bbe-b35e-c12756477285', 'superadmin')
ON CONFLICT (user_id, role_name) DO NOTHING;
```

---

## ✅ PASO 3: ACADEMIAS (profiles_academy)

### 3.1 Agregar columnas faltantes
**Archivo:** `FIX_ACADEMY_COLUMNS.sql`
- Agrega: `costos`, `cronograma`, `ritmos_seleccionados`
- Elimina: `estilos`, `respuestas`, `faq` (si existen como columnas separadas)

### 3.2 Actualizar vista pública
**Archivo:** `FIX_ACADEMY_PUBLIC_VIEW.sql`
- Recrea `v_academies_public` con todas las columnas correctas

---

## ✅ PASO 4: MAESTROS (profiles_teacher)

### 4.1 Agregar updated_at y ajustar user_id
```sql
-- Agregar updated_at si no existe
ALTER TABLE public.profiles_teacher
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Hacer user_id NULLABLE (si no lo es)
ALTER TABLE public.profiles_teacher
ALTER COLUMN user_id DROP NOT NULL;

-- Hacer nombre_publico NOT NULL (si no lo es)
ALTER TABLE public.profiles_teacher
ALTER COLUMN nombre_publico SET NOT NULL;
```

### 4.2 Recrear vista pública
**Archivo:** Crea uno nuevo basado en el que te di para `v_teachers_public`
```sql
DROP VIEW IF EXISTS public.v_teachers_public;

CREATE VIEW public.v_teachers_public AS
SELECT
    id, user_id, nombre_publico, bio, media, avatar_url, portada_url,
    ritmos, ritmos_seleccionados, zonas, redes_sociales, ubicaciones,
    cronograma, costos, faq, estado_aprobacion, created_at, updated_at
FROM public.profiles_teacher
WHERE estado_aprobacion = 'aprobado';
```

---

## ✅ PASO 5: ORGANIZADORES (profiles_organizer)

### 5.1 Ajustar columnas
```sql
-- Agregar columnas faltantes
ALTER TABLE public.profiles_organizer
ADD COLUMN IF NOT EXISTS faq jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles_organizer
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.profiles_organizer
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Eliminar columna respuestas (si existe)
-- IMPORTANTE: Primero eliminar la vista que depende de ella
DROP VIEW IF EXISTS public.v_organizers_public;

ALTER TABLE public.profiles_organizer
DROP COLUMN IF EXISTS respuestas;
```

### 5.2 Crear vista pública
**Archivo:** `CREATE_V_ORGANIZERS_PUBLIC_STAGING.sql` (ya lo tienes)
```sql
CREATE VIEW public.v_organizers_public AS
SELECT
    id, user_id, nombre_publico, bio, media, ritmos, ritmos_seleccionados,
    zonas, redes_sociales, faq, estado_aprobacion, created_at, updated_at
FROM public.profiles_organizer
WHERE estado_aprobacion = 'aprobado';
```

---

## ✅ PASO 6: MARCAS (profiles_brand)

### 6.1 Hacer columnas NULLABLE
**Archivo:** `HOMOLOGAR_PROFILES_BRAND_PROD.sql`
- Cambia `size_guide`, `fit_tips`, `policies`, `conversion` a NULLABLE

### 6.2 Recrear vista pública
**Archivo:** `RECREAR_V_BRANDS_PUBLIC_PROD.sql`
- Agrega `user_id`, `estado_aprobacion`, `updated_at` a la vista

---

## ✅ PASO 7: EVENTOS (events_date)

### 7.1 Agregar columnas faltantes
**Archivo:** `FIX_EVENTS_DATE_COLUMNS.sql`
- Agrega: `cronograma`, `costos`, `ubicaciones`

---

## ✅ PASO 8: CHALLENGES

### 8.1 Renombrar columna y agregar owner_video_url
**Archivo:** `FIX_CHALLENGES_VIDEO_BASE.sql`
- Renombra `cover_url` → `cover_image_url`
- Agrega `owner_video_url`
- Actualiza RPC `challenge_create`

### 8.2 Agregar campo requirements
**Archivo:** `FIX_CHALLENGES_REQUIREMENTS.sql`
- Agrega columna `requirements` (jsonb)
- Actualiza RPC `challenge_create` para aceptar `p_requirements`

### 8.3 Corregir políticas RLS
**Archivo:** `FIX_CHALLENGES_RLS.sql`
- Asegura que usuarios puedan crear challenges
- Políticas para owner y superadmin

---

## ✅ PASO 9: TRENDING

### 9.1 Crear tablas y sistema completo
**Archivo:** Necesitas crear el setup completo de Trending en producción.

Busca en staging el script que crea:
- Tabla `trendings`
- Tabla `trending_ritmos`
- Tabla `trending_candidates`
- Tabla `trending_votes`
- RPCs: `rpc_trending_create`, `rpc_trending_publish`, `rpc_trending_add_ritmo`, `rpc_trending_add_candidate`, `rpc_trending_vote`, `rpc_trending_leaderboard`

### 9.2 Corregir políticas RLS
**Archivo:** `FIX_TRENDING_RLS.sql`
- Políticas INSERT/UPDATE/DELETE para superadmin
- Políticas para votos de usuarios autenticados

---

## 📊 VERIFICACIÓN FINAL

Después de ejecutar todos los scripts, verifica:

```sql
-- 1. Verificar vistas públicas existen
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE '%public%';

-- 2. Verificar que tienes rol superadmin
SELECT * FROM public.user_roles 
WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285';

-- 3. Verificar tablas de trending existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'trending%';

-- 4. Verificar columnas de challenges
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'challenges'
  AND column_name IN ('cover_image_url', 'owner_video_url', 'requirements');
```

---

## 🎯 RESUMEN DE ARCHIVOS A EJECUTAR

### Orden recomendado:
1. ✅ `FIX_USER_ROLES_RECURSION.sql` (seguridad primero)
2. ✅ Asignar rol superadmin (SQL manual - ver abajo)
3. ✅ `FIX_ACADEMY_COLUMNS.sql`
4. ✅ `FIX_ACADEMY_PUBLIC_VIEW.sql`
5. ✅ `HOMOLOGAR_PROFILES_TEACHER_PROD.sql`
6. ✅ `RECREAR_V_TEACHERS_PUBLIC_PROD.sql`
7. ✅ `HOMOLOGAR_PROFILES_ORGANIZER_PROD.sql`
8. ✅ `CREATE_V_ORGANIZERS_PUBLIC_STAGING.sql`
9. ✅ `HOMOLOGAR_PROFILES_BRAND_PROD.sql`
10. ✅ `RECREAR_V_BRANDS_PUBLIC_PROD.sql`
11. ✅ `FIX_EVENTS_DATE_COLUMNS.sql`
12. ✅ `FIX_CHALLENGES_VIDEO_BASE.sql`
13. ✅ `FIX_CHALLENGES_REQUIREMENTS.sql`
14. ✅ `FIX_CHALLENGES_RLS.sql`
15. ✅ `TRENDING_SETUP_COMPLETE_PROD.sql`
16. ✅ `FIX_TRENDING_RLS.sql` (ya incluido en el setup completo)

---

## ⚠️ IMPORTANTE

- **Haz backup** de producción antes de empezar
- Ejecuta los scripts **uno por uno**
- Verifica cada resultado antes de continuar
- Si algo falla, revisa el error antes de seguir

---

## 📝 NOTAS

- Los scripts están diseñados para ser **idempotentes** (puedes ejecutarlos múltiples veces)
- Usan `IF EXISTS`, `IF NOT EXISTS`, `ON CONFLICT` para evitar errores
- Preservan los datos existentes en producción

