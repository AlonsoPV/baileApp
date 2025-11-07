# ✅ CHECKLIST FINAL DE MIGRACIÓN STAGING → PRODUCCIÓN

## 🔐 1. SEGURIDAD Y ROLES

### Verificar:
```sql
-- ✅ Tu usuario tiene rol superadmin
SELECT * FROM public.user_roles 
WHERE user_id = '0c20805f-519c-4e8e-9081-341ab64e504d';
-- Debe mostrar: role_slug = 'superadmin'

-- ✅ Funciones helper existen
SELECT proname FROM pg_proc 
WHERE proname IN ('is_superadmin', 'user_role_in')
ORDER BY proname;
-- Debe mostrar: is_superadmin, user_role_in

-- ✅ Políticas RLS de user_roles
SELECT policyname FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;
-- Debe tener al menos 4 políticas
```

---

## 👥 2. PERFILES PÚBLICOS

### Verificar vistas públicas existen:
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE '%public%'
ORDER BY table_name;
```

**Debe mostrar:**
- ✅ `v_academies_public`
- ✅ `v_brands_public`
- ✅ `v_organizers_public`
- ✅ `v_teachers_public`
- ✅ `v_user_public`

### Verificar estructura de cada perfil:
```sql
-- Academias
SELECT COUNT(*) FROM public.profiles_academy;
SELECT COUNT(*) FROM public.v_academies_public;

-- Maestros
SELECT COUNT(*) FROM public.profiles_teacher;
SELECT COUNT(*) FROM public.v_teachers_public;

-- Organizadores
SELECT COUNT(*) FROM public.profiles_organizer;
SELECT COUNT(*) FROM public.v_organizers_public;

-- Marcas
SELECT COUNT(*) FROM public.profiles_brand;
SELECT COUNT(*) FROM public.v_brands_public;

-- Usuarios
SELECT COUNT(*) FROM public.profiles_user;
SELECT COUNT(*) FROM public.v_user_public;
```

---

## 📅 3. EVENTOS

### Verificar tablas y vistas:
```sql
-- ✅ events_date tiene tipos correctos
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'events_date'
  AND column_name IN ('zona', 'estilos', 'zonas', 'ritmos_seleccionados');
-- zona: int4, estilos: _int4, zonas: _int4, ritmos_seleccionados: _text

-- ✅ events_parent tiene tipos correctos
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'events_parent'
  AND column_name = 'estilos';
-- estilos: _int4

-- ✅ Vistas de eventos existen
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE '%event%'
ORDER BY table_name;
-- Debe incluir: v_events_dates_public, events_live
```

---

## 🏆 4. CHALLENGES

### Verificar sistema completo:
```sql
-- ✅ Tabla challenges existe con columnas correctas
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'challenges'
  AND column_name IN ('cover_image_url', 'owner_video_url', 'requirements');
-- Debe mostrar las 3 columnas

-- ✅ Tablas relacionadas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'challenge%'
ORDER BY table_name;
-- Debe mostrar: challenges, challenge_submissions, challenge_votes

-- ✅ RPCs de challenges existen
SELECT proname 
FROM pg_proc 
WHERE proname LIKE 'challenge_%'
ORDER BY proname;
-- Debe incluir: challenge_create, challenge_publish, etc.

-- ✅ Políticas RLS
SELECT tablename, COUNT(*) as policies
FROM pg_policies
WHERE tablename LIKE 'challenge%'
GROUP BY tablename
ORDER BY tablename;
```

---

## 🔥 5. TRENDING

### Verificar sistema completo:
```sql
-- ✅ Tablas de trending existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'trending%'
ORDER BY table_name;
-- Debe mostrar: trendings, trending_candidates, trending_ritmos, trending_votes

-- ✅ RPCs de trending existen
SELECT proname 
FROM pg_proc 
WHERE proname LIKE 'rpc_trending_%'
ORDER BY proname;
-- Debe mostrar: rpc_trending_add_candidate, rpc_trending_add_ritmo, 
-- rpc_trending_close, rpc_trending_create, rpc_trending_leaderboard, 
-- rpc_trending_publish, rpc_trending_vote

-- ✅ Políticas RLS
SELECT tablename, COUNT(*) as policies
FROM pg_policies
WHERE tablename LIKE 'trending%'
GROUP BY tablename
ORDER BY tablename;
```

---

## 👍 6. SISTEMA RSVP

### Verificar:
```sql
-- ✅ Tabla event_rsvp existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'event_rsvp'
) as tabla_rsvp_existe;

-- ✅ Columnas de contadores existen
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'events_date' AND column_name = 'rsvp_interesado_count')
    OR (table_name = 'profiles_user' AND column_name = 'rsvp_events'));
-- Debe mostrar: rsvp_interesado_count, rsvp_events

-- ✅ RPCs de RSVP existen
SELECT proname 
FROM pg_proc 
WHERE proname LIKE '%rsvp%'
ORDER BY proname;
-- Debe mostrar: delete_event_rsvp, get_event_rsvp_stats, 
-- get_user_rsvp_status, recalc_event_rsvp_counts, 
-- recalc_user_rsvp_events, upsert_event_rsvp

-- ✅ Trigger existe
SELECT trigger_name 
FROM information_schema.triggers
WHERE trigger_name LIKE '%rsvp%';
-- Debe mostrar: trg_event_rsvp_sync
```

---

## 📚 7. SISTEMA DE CLASES

### Verificar:
```sql
-- ✅ Tablas de clases existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%classes%'
ORDER BY table_name;
-- Debe mostrar: academy_classes, teacher_classes

-- ✅ Vistas públicas de clases
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE '%classes%'
ORDER BY table_name;
-- Debe mostrar: v_academy_classes_public, v_teacher_classes_public

-- ✅ Políticas RLS
SELECT tablename, COUNT(*) as policies
FROM pg_policies
WHERE tablename LIKE '%classes%'
GROUP BY tablename
ORDER BY tablename;
-- Cada tabla debe tener 4 políticas (select, insert, update, delete)
```

---

## 🎯 8. SISTEMA DE ONBOARDING

### Verificar:
```sql
-- ✅ Columnas de onboarding existen
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles_user'
  AND column_name IN ('onboarding_completed', 'pin_hash', 'pin_verified_at');
-- Debe mostrar: onboarding_completed, pin_hash, pin_verified_at

-- ✅ Funciones de onboarding existen
SELECT proname 
FROM pg_proc 
WHERE proname IN ('complete_user_onboarding', 'verify_user_pin', 'update_user_pin', 'handle_new_user')
ORDER BY proname;
-- Debe mostrar las 4 funciones

-- ✅ Trigger de auto-creación existe
SELECT trigger_name 
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
-- Debe mostrar: on_auth_user_created

-- ✅ Estadísticas de onboarding
SELECT 
    onboarding_completed,
    COUNT(*) as total_usuarios
FROM public.profiles_user
GROUP BY onboarding_completed;
```

---

## 🗂️ 9. STORAGE BUCKETS

### Verificar:
```sql
-- ✅ Buckets existen
SELECT id, name, public, file_size_limit / 1048576 as size_mb
FROM storage.buckets
ORDER BY name;
-- Debe mostrar: media (50MB), event-flyers (10MB) - opcional

-- ✅ Políticas de storage
SELECT 
    COUNT(*) as total_policies,
    COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
    COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
    COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
    COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_policies
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects';
-- Debe tener al menos 4 políticas por bucket
```

---

## 🔍 9. INTEGRIDAD DE DATOS

### Verificar tipos de datos:
```sql
-- ✅ Arrays de ritmos son text[] (no int[])
SELECT 
    table_name,
    column_name,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'ritmos_seleccionados'
ORDER BY table_name;
-- Todos deben ser: _text

-- ✅ Arrays de zonas son int4[] (no int8[])
SELECT 
    table_name,
    column_name,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'zonas'
ORDER BY table_name;
-- Todos deben ser: _int4

-- ✅ Arrays de estilos son int4[] (no int8[])
SELECT 
    table_name,
    column_name,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'estilos'
ORDER BY table_name;
-- Todos deben ser: _int4
```

---

## 🌐 10. VARIABLES DE ENTORNO (VERCEL)

### Verificar en Vercel Dashboard:

**Production Environment:**
- ✅ `VITE_SUPABASE_URL` → URL de producción
- ✅ `VITE_SUPABASE_ANON_KEY` → Anon key de producción
- ✅ Otras variables específicas de tu app

**Staging Environment:**
- ✅ `VITE_SUPABASE_URL` → URL de staging
- ✅ `VITE_SUPABASE_ANON_KEY` → Anon key de staging

---

## 🧪 11. PRUEBAS FUNCIONALES

### Desde el Frontend de Producción:

- [ ] **Login/Registro:** Magic link funciona
- [ ] **Perfiles:** Crear/editar perfil de usuario
- [ ] **Subir imágenes:** Avatar, fotos de perfil
- [ ] **Eventos:** Ver eventos públicos
- [ ] **RSVP:** Marcar interés en un evento
- [ ] **Challenges:** Ver challenges, votar
- [ ] **Trending:** Ver trending, votar
- [ ] **Clases:** Ver clases de academias/maestros
- [ ] **Navegación:** Todas las rutas funcionan

---

## 📊 12. RESUMEN EJECUTIVO

### Script de verificación rápida:
```sql
-- Ejecuta esto para un resumen completo
SELECT 
    'Roles' as sistema,
    (SELECT COUNT(*) FROM public.user_roles WHERE role_slug = 'superadmin') as count
UNION ALL
SELECT 'Vistas Públicas', COUNT(*) FROM information_schema.views 
WHERE table_schema = 'public' AND table_name LIKE '%public%'
UNION ALL
SELECT 'Challenges Tables', COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'challenge%'
UNION ALL
SELECT 'Trending Tables', COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'trending%'
UNION ALL
SELECT 'RSVP System', COUNT(*) FROM pg_proc WHERE proname LIKE '%rsvp%'
UNION ALL
SELECT 'Classes Tables', COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%classes%'
UNION ALL
SELECT 'Storage Buckets', COUNT(*) FROM storage.buckets
UNION ALL
SELECT 'Storage Policies', COUNT(*) FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
```

**Resultados esperados:**
- Roles: 1 (tu superadmin)
- Vistas Públicas: 5 (academies, brands, organizers, teachers, user)
- Challenges Tables: 3 (challenges, submissions, votes)
- Trending Tables: 4 (trendings, candidates, ritmos, votes)
- RSVP System: 6+ (funciones y triggers)
- Classes Tables: 2 (academy_classes, teacher_classes)
- Storage Buckets: 1-2 (media, event-flyers)
- Storage Policies: 4-8 (dependiendo de buckets)

---

## 🚨 TROUBLESHOOTING COMÚN

### Problema: "Bucket not found"
**Solución:** Ejecuta `CREAR_BUCKETS_PROD.sql`

### Problema: "RLS policy violation"
**Solución:** Verifica que las políticas RLS estén creadas para esa tabla

### Problema: "Function does not exist"
**Solución:** Ejecuta el script de setup correspondiente (RSVP, Challenges, Trending)

### Problema: "Column does not exist"
**Solución:** Verifica que ejecutaste los scripts de homologación de tipos

### Problema: Imágenes no cargan
**Solución:** 
1. Verifica que el bucket sea público
2. Verifica políticas de SELECT en storage.objects
3. Verifica URL: `https://[proyecto].supabase.co/storage/v1/object/public/media/...`

---

## ✅ CHECKLIST FINAL

- [ ] Todos los scripts SQL ejecutados sin errores
- [ ] Verificación SQL completa ejecutada
- [ ] Variables de entorno en Vercel configuradas
- [ ] Buckets de storage creados y configurados
- [ ] Deploy de frontend a producción
- [ ] Pruebas funcionales básicas pasadas
- [ ] Documentación actualizada
- [ ] Backup de producción realizado

---

## 🎉 ¡MIGRACIÓN COMPLETA!

Si todos los checks están ✅, tu migración de staging a producción está completa y funcionando correctamente.

**Próximos pasos:**
1. Monitorear logs de errores en producción
2. Revisar métricas de uso
3. Hacer backup regular de la base de datos
4. Documentar cualquier cambio futuro

