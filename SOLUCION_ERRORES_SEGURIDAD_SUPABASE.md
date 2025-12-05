# 🔒 Solución: Errores de Seguridad del Linter de Supabase

## 🚨 Problemas Detectados

El linter de Supabase detectó **3 tipos de errores de seguridad**:

### 1. **auth_users_exposed** (CRÍTICO)
- **Vista afectada:** `v_challenge_submissions_enriched`
- **Problema:** La vista puede estar exponiendo datos de `auth.users` a roles `anon` o `authenticated`
- **Riesgo:** Exposición de información sensible de usuarios autenticados

### 2. **security_definer_view** (ALTO)
- **Vistas afectadas:** 18 vistas públicas
- **Problema:** Las vistas están definidas con `SECURITY DEFINER`, lo que significa que se ejecutan con los permisos del creador en lugar del usuario que consulta
- **Riesgo:** Bypass de políticas RLS, acceso no autorizado a datos

**Vistas afectadas:**
- `v_challenge_leaderboard`
- `v_challenge_submissions_enriched`
- `v_academy_classes_public`
- `v_academies_public`
- `academies_live`
- `profiles_user_light`
- `v_brands_public`
- `events_live`
- `organizers_live`
- `v_events_dates_public`
- `v_events_parent_public`
- `v_teachers_public`
- `v_user_public`
- `v_teacher_classes_public`
- `v_organizers_public`
- `v_user_roles`
- `v_academy_accepted_teachers`
- `v_teacher_academies`

### 3. **rls_disabled_in_public** (ALTO)
- **Tablas afectadas:** 7 tablas
- **Problema:** Las tablas no tienen Row Level Security (RLS) habilitado
- **Riesgo:** Acceso no controlado a datos, posible exposición de información sensible

**Tablas afectadas:**
- `admins` (vista, no necesita RLS pero se verifica)
- `roles`
- `ritmos_catalog`
- `user_profiles`
- `brand_products`
- `event_prices`
- `organizer_locations`

---

## ✅ Soluciones Implementadas

### **Solución 1: Corregir Exposición de auth.users**

**Antes:**
```sql
-- Vista que podría exponer auth.users directamente
CREATE VIEW v_challenge_submissions_enriched AS ...
```

**Después:**
```sql
-- Vista segura que usa profiles_user en lugar de auth.users
CREATE OR REPLACE VIEW public.v_challenge_submissions_enriched AS
SELECT 
    cs.*,
    pu.display_name,  -- Desde profiles_user, no auth.users
    pu.avatar_url,
    COUNT(cv.user_id)::int AS votes
FROM public.challenge_submissions cs
LEFT JOIN public.profiles_user pu ON pu.user_id = cs.user_id
-- ...
```

**Cambios:**
- ✅ Elimina referencias directas a `auth.users`
- ✅ Usa `profiles_user` para datos públicos de usuarios
- ✅ Mantiene la funcionalidad sin exponer datos sensibles

---

### **Solución 2: Eliminar SECURITY DEFINER de Vistas**

**Antes:**
```sql
CREATE VIEW v_academies_public 
WITH (security_definer = true) AS ...
```

**Después:**
```sql
-- Sin SECURITY DEFINER (por defecto es SECURITY INVOKER)
CREATE OR REPLACE VIEW public.v_academies_public AS
SELECT * FROM public.profiles_academy
WHERE estado_aprobacion = 'aprobado';
```

**Cambios:**
- ✅ Todas las vistas recreadas sin `SECURITY DEFINER`
- ✅ Usan `SECURITY INVOKER` por defecto (respeta RLS del usuario que consulta)
- ✅ Permisos explícitos con `GRANT SELECT` a `anon` y `authenticated`

**¿Por qué es importante?**
- `SECURITY DEFINER`: Ejecuta con permisos del creador → bypassa RLS
- `SECURITY INVOKER`: Ejecuta con permisos del usuario → respeta RLS ✅

---

### **Solución 3: Habilitar RLS en Tablas**

#### **3.1 Tablas de Catálogo (roles, ritmos_catalog)**

**Políticas:**
- ✅ **SELECT:** Público (cualquiera puede leer)
- ✅ **INSERT/UPDATE/DELETE:** Solo superadmins

```sql
-- Lectura pública
CREATE POLICY roles_select_public ON public.roles
    FOR SELECT USING (true);

-- Modificación solo superadmins
CREATE POLICY roles_modify_superadmin ON public.roles
    FOR ALL
    USING (public.is_superadmin(auth.uid()))
    WITH CHECK (public.is_superadmin(auth.uid()));
```

#### **3.2 Tablas de Usuario (user_profiles)**

**Políticas:**
- ✅ **SELECT:** Solo el propio usuario
- ✅ **UPDATE/INSERT:** Solo el propio usuario

```sql
CREATE POLICY user_profiles_select_own ON public.user_profiles
    FOR SELECT USING (user_id = auth.uid());
```

#### **3.3 Tablas Relacionadas (brand_products, event_prices, organizer_locations)**

**Políticas:**
- ✅ **SELECT:** Público si el recurso padre está aprobado
- ✅ **UPDATE/INSERT/DELETE:** Solo el dueño del recurso padre

```sql
-- Ejemplo: brand_products
CREATE POLICY brand_products_select_public ON public.brand_products
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles_brand pb
            WHERE pb.id = brand_products.brand_id 
            AND pb.estado_aprobacion = 'aprobado'
        )
    );
```

---

## 📋 Cómo Aplicar las Correcciones

### **Paso 1: Ejecutar el Script SQL**

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo `FIX_SUPABASE_SECURITY_LINTER_ERRORS.sql`
3. Copia y pega todo el contenido
4. Haz clic en **Run** (o presiona `Ctrl+Enter`)

### **Paso 2: Verificar Correcciones**

El script incluye queries de verificación al final. Deberías ver:

✅ **Vistas sin SECURITY DEFINER:**
```sql
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('v_academies_public', ...);
```

✅ **Tablas con RLS habilitado:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('roles', 'ritmos_catalog', ...);
```

✅ **Políticas RLS creadas:**
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

### **Paso 3: Verificar en el Linter**

1. Ve a **Supabase Dashboard** → **Database** → **Linter**
2. Ejecuta el linter nuevamente
3. Los errores deberían desaparecer

---

## 🔍 Verificación Post-Corrección

### **Checklist de Verificación:**

- [ ] ✅ Vista `v_challenge_submissions_enriched` no expone `auth.users`
- [ ] ✅ Todas las vistas públicas sin `SECURITY DEFINER`
- [ ] ✅ Tabla `roles` con RLS habilitado
- [ ] ✅ Tabla `ritmos_catalog` con RLS habilitado
- [ ] ✅ Tabla `user_profiles` con RLS habilitado (si existe)
- [ ] ✅ Tabla `brand_products` con RLS habilitado (si existe)
- [ ] ✅ Tabla `event_prices` con RLS habilitado (si existe)
- [ ] ✅ Tabla `organizer_locations` con RLS habilitado
- [ ] ✅ Políticas RLS creadas para todas las tablas
- [ ] ✅ Linter de Supabase sin errores

---

## ⚠️ Notas Importantes

### **1. Vistas Públicas vs Privadas**

- **Vistas públicas** (`v_academies_public`, `v_teachers_public`, etc.):
  - Accesibles por `anon` y `authenticated`
  - Solo muestran contenido aprobado
  - Respetan RLS de las tablas base

- **Vistas privadas** (`v_user_roles`, `v_academy_accepted_teachers`):
  - Solo accesibles por `authenticated`
  - Requieren autenticación

### **2. Tablas que Pueden No Existir**

El script verifica la existencia de tablas antes de aplicar cambios:
- `user_profiles` (puede no existir si usas `profiles_user`)
- `brand_products` (puede estar en JSONB dentro de `profiles_brand`)

Si alguna tabla no existe, el script la omite sin error.

### **3. Impacto en la Aplicación**

**✅ Sin impacto negativo:**
- Las vistas públicas siguen funcionando igual
- Los usuarios pueden seguir consultando datos públicos
- Las políticas RLS solo añaden protección, no restringen acceso legítimo

**⚠️ Verificar:**
- Si hay queries directas a `auth.users` en el código, actualizarlas
- Si hay dependencias de `SECURITY DEFINER` en funciones, revisarlas

---

## 🐛 Troubleshooting

### **Error: "relation does not exist"**

**Causa:** La tabla/vista no existe en tu base de datos.

**Solución:** El script usa `IF EXISTS` y `DO $$ BEGIN ... END $$` para verificar existencia. Si falla, verifica que la tabla existe:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'nombre_tabla';
```

### **Error: "permission denied"**

**Causa:** No tienes permisos para crear/modificar vistas o políticas.

**Solución:** Asegúrate de estar usando el rol correcto (generalmente `postgres` o un superusuario).

### **Vistas siguen mostrando errores en el linter**

**Causa:** Puede haber caché o el linter necesita tiempo para actualizar.

**Solución:**
1. Espera 1-2 minutos
2. Refresca el dashboard
3. Ejecuta el linter nuevamente
4. Verifica que las vistas no tienen `SECURITY DEFINER`:

```sql
SELECT viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND definition LIKE '%SECURITY DEFINER%';
```

---

## 📚 Referencias

- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
- [Security Definer Views](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
- [Exposed Auth Users](https://supabase.com/docs/guides/database/database-linter?lint=0002_auth_users_exposed)

---

**Última actualización:** Enero 2025  
**Script:** `FIX_SUPABASE_SECURITY_LINTER_ERRORS.sql`

