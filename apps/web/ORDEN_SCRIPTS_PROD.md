# 🚀 SCRIPTS PARA EJECUTAR EN PRODUCCIÓN

## ⚡ ORDEN DE EJECUCIÓN (COPIAR Y PEGAR)

Ejecuta estos scripts **UNO POR UNO** en el SQL Editor de Supabase Producción:

---

### 1️⃣ SEGURIDAD (PRIMERO - MUY IMPORTANTE)

**Paso 1: Adaptar sistema de roles a producción**
```
ADAPTAR_USER_ROLES_PROD.sql
```
*(Este script crea las funciones helper, políticas RLS, y te asigna superadmin)*

**Verificar que funcionó:**
```sql
-- Deberías ver tu usuario con role_slug = 'superadmin'
SELECT * FROM public.user_roles 
WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285';

-- Debería retornar TRUE
SELECT public.is_superadmin('39555d3a-68fa-4bbe-b35e-c12756477285');
```

---

### 2️⃣ ACADEMIAS
```
FIX_ACADEMY_COLUMNS.sql
FIX_ACADEMY_PUBLIC_VIEW.sql
```

---

### 3️⃣ MAESTROS
```
HOMOLOGAR_PROFILES_TEACHER_PROD.sql
RECREAR_V_TEACHERS_PUBLIC_PROD.sql
```

---

### 4️⃣ ORGANIZADORES
```
HOMOLOGAR_PROFILES_ORGANIZER_PROD.sql
CREATE_V_ORGANIZERS_PUBLIC_STAGING.sql
```

---

### 5️⃣ MARCAS
```
HOMOLOGAR_PROFILES_BRAND_PROD.sql
RECREAR_V_BRANDS_PUBLIC_PROD.sql
```

---

### 6️⃣ EVENTOS
```
HOMOLOGAR_EVENTS_DATE_PROD.sql
HOMOLOGAR_EVENTS_PARENT_PROD.sql
```
*(Estos scripts homologan tipos de datos de events_date y events_parent)*

---

### 7️⃣ CHALLENGES
```
FIX_CHALLENGES_VIDEO_BASE.sql
FIX_CHALLENGES_REQUIREMENTS.sql
FIX_CHALLENGES_RLS.sql
```

---

### 8️⃣ TRENDING (NUEVO SISTEMA)
```
TRENDING_SETUP_COMPLETE_PROD.sql
```
*(Este ya incluye todas las políticas RLS, no necesitas FIX_TRENDING_RLS.sql)*

---

### 9️⃣ SISTEMA RSVP
```
SETUP_RSVP_SYSTEM_PROD.sql
```
*(Sistema completo de RSVP con tabla, triggers, RPCs y contadores sincronizados)*

---

### 🔟 SISTEMA DE CLASES
```
SETUP_CLASSES_SYSTEM_PROD.sql
```
*(Sistema completo de clases para academias y maestros con RLS y vistas públicas)*

---

### 1️⃣1️⃣ STORAGE BUCKETS Y POLÍTICAS

**Paso 1: Crear buckets**
```
CREAR_BUCKETS_PROD.sql
```
*(Crea los buckets `media` y `event-flyers` con la configuración correcta)*

**Paso 2: Configurar políticas de acceso**
```
SETUP_STORAGE_POLICIES_PROD.sql
```
*(Configura políticas RLS para lectura pública y escritura autenticada)*

**Guía completa:** Ver `MIGRACION_STORAGE_BUCKETS.md`

---

### 1️⃣2️⃣ SISTEMA DE ONBOARDING

```
SETUP_ONBOARDING_PROD.sql
```
*(Sistema completo de onboarding con flag de completado, PIN de seguridad, y auto-creación de perfiles)*

---

## ✅ VERIFICACIÓN FINAL

Después de ejecutar todos los scripts, corre esto:

```sql
-- 1. Verificar vistas públicas
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE '%public%'
ORDER BY table_name;

-- 2. Verificar que eres superadmin
SELECT * FROM public.user_roles 
WHERE user_id = '39555d3a-68fa-4bbe-b35e-c12756477285';

-- 3. Verificar tablas de trending
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'trending%'
ORDER BY table_name;

-- 4. Verificar columnas de challenges
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'challenges'
  AND column_name IN ('cover_image_url', 'owner_video_url', 'requirements');

-- 5. Verificar RPCs de trending
SELECT proname 
FROM pg_proc 
WHERE proname LIKE 'rpc_trending%'
ORDER BY proname;
```

---

## 📊 RESULTADO ESPERADO

Deberías ver:
- ✅ 5 vistas públicas: `v_academies_public`, `v_teachers_public`, `v_organizers_public`, `v_brands_public`, `v_user_public`
- ✅ Tu usuario con rol `superadmin`
- ✅ 4 tablas de trending: `trendings`, `trending_ritmos`, `trending_candidates`, `trending_votes`
- ✅ 3 columnas en challenges: `cover_image_url`, `owner_video_url`, `requirements`
- ✅ 6 RPCs de trending: `rpc_trending_create`, `rpc_trending_publish`, `rpc_trending_close`, `rpc_trending_add_ritmo`, `rpc_trending_add_candidate`, `rpc_trending_vote`, `rpc_trending_leaderboard`

---

## ⚠️ IMPORTANTE

- **Haz backup** antes de empezar
- Ejecuta **uno por uno** y verifica cada resultado
- Si algo falla, **detente** y revisa el error
- Los scripts son **idempotentes** (puedes ejecutarlos varias veces)

---

## 🎯 TIEMPO ESTIMADO

- Total: ~10-15 minutos
- Cada script: ~30 segundos - 1 minuto

