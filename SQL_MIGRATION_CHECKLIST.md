# 📋 Checklist de Migraciones SQL para Supabase

Esta guía lista todos los archivos SQL que debes ejecutar en orden para configurar completamente tu base de datos en Supabase (staging o producción).

---

## 🎯 **Orden de Ejecución**

### ⚠️ **IMPORTANTE:**
- Ejecutar en **orden numérico** (los archivos están numerados)
- Hacer **backup antes de ejecutar en producción**
- Ejecutar **primero en staging**, probar, luego en producción
- **NO modificar archivos ya ejecutados** (crear nuevas migraciones si necesitas cambios)

---

## 📦 **Categorías de Archivos SQL**

### **A. Migraciones Core (Obligatorias)**
Archivos en `supabase/migrations/` - ejecutar en orden:

### **B. Migraciones de Features (Obligatorias)**
Archivos en `apps/web/` - ejecutar después de A:

### **C. Datos de Prueba (Solo Staging)**
Archivos para poblar staging con datos de ejemplo:

---

## 🔢 **ORDEN DE EJECUCIÓN PASO A PASO**

### **Paso 1: Verificar Estructura Base de Datos**

⚠️ **NOTA IMPORTANTE:** Estas tablas ya deberían existir en tu Supabase desde el inicio del proyecto. **NO necesitas crear estos archivos**, solo verificar que existen.

#### **1.1 Verificar tablas existentes:**

Ejecuta en SQL Editor para verificar:

```sql
-- Verificar que existen las tablas base
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles_user', 'user_roles', 'roles', 'tags')
ORDER BY table_name;

-- Deberías ver:
-- profiles_user
-- roles
-- tags
-- user_roles
```

#### **1.2 Si NO existen, créalas manualmente:**

**Tabla `profiles_user`:**
```sql
CREATE TABLE IF NOT EXISTS public.profiles_user (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  bio text,
  avatar_url text,
  ritmos integer[],
  ritmos_seleccionados text[], -- Para catálogo moderno
  zonas integer[],
  onboarding_complete boolean DEFAULT false,
  media jsonb DEFAULT '[]'::jsonb,
  redes_sociales jsonb DEFAULT '{}'::jsonb,
  respuestas jsonb DEFAULT '{}'::jsonb,
  rsvp_events jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles_user ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON public.profiles_user FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles_user FOR UPDATE
USING (user_id = auth.uid());
```

**Tabla `roles`:**
```sql
CREATE TABLE IF NOT EXISTS public.roles (
  slug text PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Insertar roles básicos
INSERT INTO public.roles (slug, name, description) VALUES
  ('usuario', 'Usuario', 'Usuario regular de la plataforma'),
  ('organizador', 'Organizador', 'Organizador de eventos sociales'),
  ('maestro', 'Maestro', 'Profesor de baile'),
  ('academia', 'Academia', 'Academia de baile'),
  ('marca', 'Marca', 'Marca de productos de baile'),
  ('superadmin', 'Super Admin', 'Administrador del sistema')
ON CONFLICT (slug) DO NOTHING;
```

**Tabla `user_roles`:**
```sql
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_slug text REFERENCES public.roles(slug) ON DELETE CASCADE,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role_slug)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());
```

**Tabla `tags`:**
```sql
CREATE TABLE IF NOT EXISTS public.tags (
  id integer PRIMARY KEY,
  nombre text NOT NULL,
  tipo text NOT NULL, -- 'ritmo' o 'zona'
  slug text,
  descripcion text,
  created_at timestamptz DEFAULT now()
);

-- Insertar TODOS los ritmos y zonas (IDs correctos de tu proyecto)
INSERT INTO public.tags (id, nombre, tipo, slug) VALUES
  -- RITMOS
  (1, 'Salsa On 1', 'ritmo', 'on1'),
  (2, 'Bachata Moderna', 'ritmo', 'moderna'),
  (3, 'Kizomba', 'ritmo', 'kizomba'),
  (4, 'Merengue', 'ritmo', 'merengue'),
  (5, 'Reggaeton', 'ritmo', 'reggaeton'),
  (11, 'Bachata Tradicional', 'ritmo', 'tradicional'),
  (12, 'Salsa Casino', 'ritmo', 'casino'),
  (13, 'Bachata sensual', 'ritmo', 'sensual'),
  (14, 'Cumbia', 'ritmo', 'cumbia'),
  (15, 'Timba', 'ritmo', 'timba'),
  (16, 'Semba', 'ritmo', 'semba'),
  (17, 'Zouk', 'ritmo', 'zouk'),
  (18, 'Hip hop', 'ritmo', 'hip-hop'),
  (19, 'Break dance', 'ritmo', 'break-dance'),
  (20, 'Twerk', 'ritmo', 'twerk'),
  (21, 'Danzón', 'ritmo', 'danzon'),
  (22, 'Rock and Roll', 'ritmo', 'rock-and-roll'),
  (23, 'Swing', 'ritmo', 'swing'),
  (24, 'Cha-cha-chá', 'ritmo', 'cha-cha-cha'),
  (25, 'Boogie Woogie', 'ritmo', 'boogie-woogie'),
  (26, 'Salsa On 2', 'ritmo', 'on2'),
  -- ZONAS
  (6, 'CDMX Norte', 'zona', 'cdmx-norte'),
  (7, 'CDMX Sur', 'zona', 'cdmx-sur'),
  (8, 'CDMX Centro', 'zona', 'cdmx-centro'),
  (9, 'Guadalajara', 'zona', 'guadalajara'),
  (10, 'Monterrey', 'zona', 'monterrey')
ON CONFLICT (id) DO NOTHING;
```

**Trigger `set_updated_at` (función global):**
```sql
-- Función para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a profiles_user
DROP TRIGGER IF EXISTS set_updated_at_profiles_user ON public.profiles_user;
CREATE TRIGGER set_updated_at_profiles_user
BEFORE UPDATE ON public.profiles_user
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

---

### **Paso 2: Módulos de Perfiles**

#### **2.1 Perfil de Organizador**

⚠️ **VERIFICAR PRIMERO:** La tabla `profiles_organizer` ya debería existir.

**Verificación:**
```sql
-- Verificar que existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles_organizer' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Si NO existe, crearla:**
```sql
-- Crear tabla profiles_organizer
CREATE TABLE IF NOT EXISTS public.profiles_organizer (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_publico text,
  bio text,
  estado_aprobacion text DEFAULT 'pendiente',
  ritmos integer[],
  zonas integer[],
  media jsonb DEFAULT '[]'::jsonb,
  respuestas jsonb DEFAULT '{}'::jsonb,
  redes_sociales jsonb DEFAULT '{}'::jsonb,
  faq jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.profiles_organizer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organizer profile"
ON public.profiles_organizer FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own organizer profile"
ON public.profiles_organizer FOR UPDATE
USING (user_id = auth.uid());

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_updated_at_organizer ON public.profiles_organizer;
CREATE TRIGGER set_updated_at_organizer
BEFORE UPDATE ON public.profiles_organizer
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

**Luego ejecutar (OBLIGATORIO):**
- ✅ `apps/web/SCRIPT_ADD_RITMOS_SELECCIONADOS_TO_ORGANIZER.sql`

#### **2.2 Perfil de Maestro**
- ✅ `PROFILES_TEACHER_SETUP.sql`
- ✅ `SCRIPT_ADD_RITMOS_SELECCIONADOS_TO_TEACHER.sql`

#### **2.3 Perfil de Academia**
En orden:
1. ✅ `CREATE_ACADEMY_MODULE.sql`
2. ✅ `VERIFY_ACADEMY_TABLE.sql` (verificación)
3. ✅ `FIX_ACADEMY_COLUMNS.sql` (si hay errores)
4. ✅ `SCRIPT_ADD_RITMOS_SELECCIONADOS_TO_ACADEMY.sql`

#### **2.4 Perfil de Marca**
En orden:
1. ✅ `CREATE_BRAND_MODULE.sql`
2. ✅ `COMPLETE_BRAND_SETUP.sql`
3. ✅ `ADD_ALL_MISSING_BRAND_COLUMNS.sql`
4. ✅ `VERIFY_BRAND_SETUP.sql` (verificación)
5. ✅ `ADD_BRAND_INDEXES.sql` (optimización)

---

### **Paso 3: Módulo de Eventos**

#### **3.1 Tablas de Eventos**
```sql
-- CREATE_EVENTS_MODULE.sql (si existe)
-- O crear manualmente:
```

```sql
-- events_parent (sociales)
CREATE TABLE IF NOT EXISTS public.events_parent (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nombre text NOT NULL,
  descripcion text,
  organizer_id uuid REFERENCES auth.users(id),
  estilos integer[],
  zonas integer[],
  media jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- events_date (fechas específicas)
CREATE TABLE IF NOT EXISTS public.events_date (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  parent_id bigint REFERENCES public.events_parent(id) ON DELETE CASCADE,
  nombre text,
  fecha date,
  hora_inicio time,
  hora_fin time,
  lugar text,
  direccion text,
  ciudad text,
  zona integer,
  estilos integer[],
  flyer_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### **3.2 Columnas Adicionales**
En orden:
1. ✅ `SCRIPT_ADD_RITMOS_SELECCIONADOS_TO_EVENTS_PARENT.sql`
2. ✅ `SCRIPT_ADD_UBICACIONES_TO_EVENTS_PARENT.sql`
3. ✅ `ADD_FLYER_COLUMN.sql`

#### **3.3 Storage para Flyers**
- ✅ `CREATE_EVENT_FLYERS_BUCKET.sql`

#### **3.4 Fixes (si es necesario)**
- ✅ `FIX_EVENTS_PARENT_REMOVE_APPROVAL.sql`
- ✅ `FIX_EVENTS_DATE_NOMBRE.sql`
- ✅ `FIX_EVENTS_DATE_SIMPLE.sql`

---

### **Paso 4: Sistema de Autenticación**

#### **4.1 Magic Link y PIN**
En orden:
1. ✅ `ENABLE_MAGIC_LINK.sql`
2. ✅ `DISABLE_PASSWORD_AUTH.sql` (opcional)
3. ✅ `SCRIPT_21_ADD_PIN_HASH.sql`

---

### **Paso 5: Features Avanzadas**

#### **5.1 Sistema de Challenges**
- ✅ `CHALLENGES_SETUP.sql`

Contenido completo:
- `challenges` (tabla)
- `challenge_submissions` (tabla)
- `challenge_votes` (tabla)
- RLS policies
- RPCs: `challenge_create`, `challenge_publish`, `challenge_submit`, etc.
- Triggers
- Views: `v_challenge_leaderboard`

#### **5.2 Sistema de Trending**
En orden (desde `supabase/migrations/`):
1. ✅ `2025xxxx_trending.sql` (base)
2. ✅ `2025xxxx_trending_cover.sql` (agregar cover_url)
3. ✅ `2025xxxx_trending_lists.sql` (agregar list_name)

Contenido completo:
- `trendings` (tabla)
- `trending_ritmos` (tabla)
- `trending_candidates` (tabla)
- `trending_votes` (tabla)
- RLS policies
- RPCs: `rpc_trending_create`, `rpc_trending_vote`, `rpc_trending_leaderboard`, etc.
- Triggers: `trg_validate_vote`

#### **5.3 Sistema de RSVP**
- ✅ `supabase/migrations/2025xxxx_rsvp.sql`

Contenido completo:
- `event_rsvp` (tabla)
- RLS policies
- RPCs: `get_user_rsvp_status`, `get_event_rsvp_stats`, `upsert_event_rsvp`, `delete_event_rsvp`
- Triggers: `trg_event_rsvp_count_update`, `trg_profiles_user_rsvp_events_update`

#### **5.4 Sistema de Interesados (Eventos)**
- ✅ `SCRIPT_EVENTOS_INTERESADOS.sql`

---

### **Paso 6: Vistas Live (Públicas)**
- ✅ `CREATE_LIVE_VIEWS.sql`

Crea vistas públicas para:
- `v_organizers_public`
- `v_academies_public`
- `v_teachers_public`
- `v_brand_public`
- `v_user_public`

---

### **Paso 7: Datos de Prueba (Solo Staging)**

⚠️ **SOLO EJECUTAR EN STAGING, NUNCA EN PRODUCCIÓN**

- ✅ `supabase/seed_staging.sql`

Crea:
- 4 usuarios de prueba (admin, organizador, academia, usuario)
- Roles asignados
- 1 evento de ejemplo
- Credenciales:
  - `admin@staging.baileapp.com` / `Admin123!`
  - `organizador@staging.baileapp.com` / `Orga123!`
  - `academia@staging.baileapp.com` / `Acad123!`
  - `usuario@staging.baileapp.com` / `User123!`

---

## ✅ **Checklist Final de Verificación**

Después de ejecutar todas las migraciones, verifica:

### **Tablas Principales:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deberías ver:
- [ ] `challenges`
- [ ] `challenge_submissions`
- [ ] `challenge_votes`
- [ ] `event_rsvp`
- [ ] `events_date`
- [ ] `events_parent`
- [ ] `profiles_academy`
- [ ] `profiles_brand`
- [ ] `profiles_organizer`
- [ ] `profiles_teacher`
- [ ] `profiles_user`
- [ ] `roles`
- [ ] `tags`
- [ ] `trendings`
- [ ] `trending_candidates`
- [ ] `trending_ritmos`
- [ ] `trending_votes`
- [ ] `user_roles`

### **Vistas Públicas:**
```sql
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deberías ver:
- [ ] `v_academies_public`
- [ ] `v_brand_public`
- [ ] `v_challenge_leaderboard`
- [ ] `v_organizers_public`
- [ ] `v_teachers_public`
- [ ] `v_user_public`
- [ ] `v_user_roles`

### **Funciones (RPCs):**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

Deberías ver al menos:
- [ ] `challenge_create`
- [ ] `challenge_publish`
- [ ] `challenge_submit`
- [ ] `delete_event_rsvp`
- [ ] `get_event_rsvp_stats`
- [ ] `get_user_rsvp_status`
- [ ] `rpc_trending_add_candidate`
- [ ] `rpc_trending_add_ritmo`
- [ ] `rpc_trending_create`
- [ ] `rpc_trending_leaderboard`
- [ ] `rpc_trending_vote`
- [ ] `set_updated_at`
- [ ] `upsert_event_rsvp`

### **Storage Buckets:**
En Supabase Dashboard > Storage:
- [ ] `media` (público) - **ÚNICO BUCKET NECESARIO**

**Estructura de paths dentro de `media`:**
```
media/
├── avatars/           # Fotos de perfil
├── covers/            # Portadas de perfiles
├── brand-media/       # Catálogo de marcas
├── event-flyers/      # Flyers de eventos
├── challenge-covers/  # Portadas de challenges
├── challenge-videos/  # Videos de challenges
├── trending-covers/   # Portadas de trending
├── user-media/        # Fotos/videos de usuarios
└── class-media/       # Media de clases
```

**Políticas RLS necesarias:**
```sql
-- Permitir lectura pública de todo el bucket media
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Permitir upload a usuarios autenticados
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
);

-- Permitir update/delete solo del propio contenido
CREATE POLICY "Users can update own media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### **RLS Habilitado:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

Todas las tablas públicas deberían tener RLS habilitado.

---

## 🚀 **Método de Ejecución**

### **Opción A: Supabase CLI (Recomendado)**
```bash
# Conectar a tu proyecto
supabase link --project-ref your-project-id

# Aplicar todas las migraciones
supabase db push
```

### **Opción B: SQL Editor (Manual)**
1. Ve a Supabase Dashboard
2. Click en **SQL Editor** (</>)
3. Copia y pega cada archivo en orden
4. Click **Run** (▶️)
5. Verifica que no haya errores

---

## 🔄 **Orden Recomendado Resumido**

```
1. Estructura Base (users, roles, tags)
2. Perfiles (organizer, teacher, academy, brand)
3. Eventos (events_parent, events_date, flyers)
4. Autenticación (magic link, PIN)
5. Features (challenges, trending, RSVP)
6. Vistas Públicas (live views)
7. Datos de Prueba (solo staging)
```

---

## 📞 **¿Qué hacer si hay errores?**

### **Error: "relation already exists"**
```sql
-- La tabla ya existe, puedes omitir ese archivo
-- O usar: CREATE TABLE IF NOT EXISTS ...
```

### **Error: "column already exists"**
```sql
-- La columna ya existe, puedes omitir ese archivo
-- O usar: ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...
```

### **Error: "function does not exist"**
```sql
-- Falta una función requerida (ej: set_updated_at)
-- Ejecuta primero el archivo que crea esa función
```

### **Error: "RLS policy already exists"**
```sql
-- La política ya existe
-- Ejecuta: DROP POLICY IF EXISTS nombre_policy;
-- Luego vuelve a crear la política
```

---

## 💾 **Backup Antes de Migrar (Producción)**

```bash
# SIEMPRE hacer backup antes de migrar producción
supabase db dump -f backup-$(date +%Y%m%d-%H%M%S).sql

# O desde Supabase Dashboard:
# Settings > Database > Backups > Create Backup
```

---

## 📊 **Resumen de Archivos por Prioridad**

### **🔴 CRÍTICOS (Obligatorios):**
1. `CHALLENGES_SETUP.sql`
2. `2025xxxx_trending.sql`
3. `2025xxxx_rsvp.sql`
4. `PROFILES_TEACHER_SETUP.sql`
5. `CREATE_BRAND_MODULE.sql`
6. `CREATE_ACADEMY_MODULE.sql`
7. `CREATE_LIVE_VIEWS.sql`

### **🟡 IMPORTANTES (Recomendados):**
1. `SCRIPT_ADD_RITMOS_SELECCIONADOS_TO_*.sql` (todos)
2. `ENABLE_MAGIC_LINK.sql`
3. `SCRIPT_21_ADD_PIN_HASH.sql`
4. `CREATE_EVENT_FLYERS_BUCKET.sql`

### **🟢 OPCIONALES (Mejoras):**
1. `ADD_BRAND_INDEXES.sql`
2. `VERIFY_*.sql` (archivos de verificación)
3. `FIX_*.sql` (solo si tienes esos problemas específicos)

### **🔵 SOLO STAGING:**
1. `seed_staging.sql`

---

**Última actualización:** 2025-01-XX  
**Total de archivos SQL:** 52  
**Migraciones críticas:** 10  
**Tiempo estimado de ejecución:** 15-20 minutos

