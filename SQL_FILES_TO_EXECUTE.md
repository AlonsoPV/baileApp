# 📋 Lista DEFINITIVA de Archivos SQL a Ejecutar

Esta es la lista de archivos SQL que **realmente existen** en tu proyecto y debes ejecutar en orden.

---

## ✅ **ARCHIVOS QUE SÍ EXISTEN** (Ejecutar en este orden)

### **📦 Paso 1: Perfiles**

#### **1.1 Organizador**
- ✅ `SCRIPT_ADD_RITMOS_SELECCIONADOS_TO_ORGANIZER.sql`

#### **1.2 Maestro**
- ✅ `PROFILES_TEACHER_SETUP.sql`
- ✅ `SCRIPT_ADD_RITMOS_SELECCIONADOS_TO_TEACHER.sql`

#### **1.3 Academia**
- ✅ `CREATE_ACADEMY_MODULE.sql`
- ✅ `SCRIPT_ADD_RITMOS_SELECCIONADOS_TO_ACADEMY.sql`

#### **1.4 Marca**
- ✅ `CREATE_BRAND_MODULE.sql`
- ✅ `COMPLETE_BRAND_SETUP.sql`
- ✅ `ADD_ALL_MISSING_BRAND_COLUMNS.sql`
- ✅ `ADD_BRAND_INDEXES.sql` (opcional - para optimización)

---

### **📅 Paso 2: Eventos**

- ✅ `SCRIPT_ADD_RITMOS_SELECCIONADOS_TO_EVENTS_PARENT.sql`
- ✅ `SCRIPT_ADD_UBICACIONES_TO_EVENTS_PARENT.sql`
- ✅ `ADD_FLYER_COLUMN.sql`
- ⚠️ `CREATE_EVENT_FLYERS_BUCKET.sql` (OPCIONAL - actualizado para usar solo bucket 'media')
- ✅ `FIX_EVENTS_PARENT_REMOVE_APPROVAL.sql` (corregido - ejecutar si es necesario)
- ⚠️ `FIX_EVENTS_DATE_NOMBRE.sql` (solo si tienes ese problema específico)

---

### **🔐 Paso 3: Autenticación**

- ✅ `ENABLE_MAGIC_LINK.sql`
- ✅ `SCRIPT_21_ADD_PIN_HASH.sql`

---

### **🎯 Paso 4: Features Avanzadas**

#### **4.1 Challenges**
- ✅ `CHALLENGES_SETUP.sql`

#### **4.2 Trending** (desde `supabase/migrations/`)
- ✅ `supabase/migrations/2025xxxx_trending.sql`
- ✅ `supabase/migrations/2025xxxx_trending_cover.sql`
- ✅ `supabase/migrations/2025xxxx_trending_lists.sql`

#### **4.3 RSVP** (desde `supabase/migrations/`)
- ✅ `supabase/migrations/2025xxxx_rsvp.sql`

#### **4.4 Interesados en Eventos**
- ✅ `SCRIPT_EVENTOS_INTERESADOS.sql`

---

### **👁️ Paso 5: Vistas Públicas**

- ✅ `CREATE_LIVE_VIEWS.sql`

---

### **🧪 Paso 6: Datos de Prueba (Solo Staging)**

- ✅ `supabase/seed_staging.sql` (usuarios base)
- ✅ `supabase/fix_usuario_role.sql` (asignar rol 'usuario')
- ✅ `supabase/seed_complete_classes_and_events.sql` (clases y eventos completos)
- ✅ `supabase/setup_storage_policies.sql` (políticas de storage para bucket 'media')

---

## ❌ **ARCHIVOS QUE NO NECESITAS EJECUTAR**

Estos son archivos de debug, verificación o fixes que solo se usan si tienes problemas específicos:

- ❌ `DEBUG_*.sql` - Solo para debugging
- ❌ `TEST_*.sql` - Solo para testing
- ❌ `VERIFY_*.sql` - Solo para verificación
- ❌ `FIX_*.sql` - Solo si tienes ese problema específico
- ❌ `CHECK_*.sql` - Solo para verificación
- ❌ `RESET_PASSWORD*.sql` - Solo para resetear contraseñas
- ❌ `CREAR_USUARIO_NUEVO.sql` - Solo para crear usuarios manualmente
- ❌ `DISABLE_PASSWORD_AUTH.sql` - Opcional (desactiva contraseñas)

---

## 📝 **CHECKLIST DE EJECUCIÓN**

Marca cada archivo después de ejecutarlo:

### **Perfiles:**
- [ ] `SCRIPT_ADD_RITMOS_SELECCIONADOS_TO_ORGANIZER.sql`
- [ ] `PROFILES_TEACHER_SETUP.sql`
- [ ] `SCRIPT_ADD_RITMOS_SELECCIONADOS_TO_TEACHER.sql`
- [ ] `CREATE_ACADEMY_MODULE.sql`
- [ ] `SCRIPT_ADD_RITMOS_SELECCIONADOS_TO_ACADEMY.sql`
- [ ] `CREATE_BRAND_MODULE.sql`
- [ ] `COMPLETE_BRAND_SETUP.sql`
- [ ] `ADD_ALL_MISSING_BRAND_COLUMNS.sql`

### **Eventos:**
- [ ] `SCRIPT_ADD_RITMOS_SELECCIONADOS_TO_EVENTS_PARENT.sql`
- [ ] `SCRIPT_ADD_UBICACIONES_TO_EVENTS_PARENT.sql`
- [ ] `ADD_FLYER_COLUMN.sql`
- [ ] `CREATE_EVENT_FLYERS_BUCKET.sql`

### **Autenticación:**
- [ ] `ENABLE_MAGIC_LINK.sql`
- [ ] `SCRIPT_21_ADD_PIN_HASH.sql`

### **Features:**
- [ ] `CHALLENGES_SETUP.sql`
- [ ] `supabase/migrations/2025xxxx_trending.sql`
- [ ] `supabase/migrations/2025xxxx_trending_cover.sql`
- [ ] `supabase/migrations/2025xxxx_trending_lists.sql`
- [ ] `supabase/migrations/2025xxxx_rsvp.sql`
- [ ] `SCRIPT_EVENTOS_INTERESADOS.sql`

### **Vistas:**
- [ ] `CREATE_LIVE_VIEWS.sql`

### **Staging (solo para ambiente de pruebas):**
- [ ] `supabase/seed_staging.sql`

---

## 🚀 **Método de Ejecución**

### **Opción A: Supabase CLI (Migraciones en `supabase/migrations/`)**

```bash
# Conectar a tu proyecto
supabase link --project-ref your-project-id

# Aplicar migraciones automáticamente
supabase db push
```

Esto ejecutará:
- `2025xxxx_trending.sql`
- `2025xxxx_trending_cover.sql`
- `2025xxxx_trending_lists.sql`
- `2025xxxx_rsvp.sql`

### **Opción B: SQL Editor Manual (Archivos en `apps/web/`)**

1. Ve a **Supabase Dashboard**
2. Click en **SQL Editor** (</>)
3. Por cada archivo:
   - Abre el archivo
   - Copia todo el contenido
   - Pega en SQL Editor
   - Click **Run** (▶️)
   - Verifica que no haya errores
   - Marca el checkbox ✅

---

## ⏱️ **Tiempo Estimado**

- **Total:** ~15-20 minutos
- **Por archivo:** 30-60 segundos
- **Features complejas (Challenges, Trending):** 2-3 minutos cada uno

---

## 🔄 **Orden Recomendado de Ejecución**

```
1️⃣  Perfiles (8 archivos) → 5 min
2️⃣  Eventos (4 archivos) → 3 min
3️⃣  Autenticación (2 archivos) → 1 min
4️⃣  Features (6 archivos) → 8 min
5️⃣  Vistas (1 archivo) → 1 min
6️⃣  Seed staging (1 archivo) → 1 min
────────────────────────────────
    Total: ~19 minutos
```

---

## 📞 **Si encuentras errores:**

### **Error: "table already exists"**
✅ **Solución:** Omitir ese archivo, la tabla ya existe.

### **Error: "column already exists"**
✅ **Solución:** Omitir ese archivo, la columna ya existe.

### **Error: "function does not exist"**
❌ **Problema:** Falta ejecutar un archivo previo.
✅ **Solución:** Verifica que ejecutaste todos los archivos en orden.

### **Error: "relation does not exist"**
❌ **Problema:** Falta crear una tabla base.
✅ **Solución:** Ve a `SQL_MIGRATION_CHECKLIST.md` paso 1 y crea las tablas base.

---

**Total de archivos obligatorios:** 22  
**Total de archivos opcionales:** 25  
**Última actualización:** 2025-01-XX

