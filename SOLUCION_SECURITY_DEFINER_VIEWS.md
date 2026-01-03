# 🔒 Solución: Errores de Security Definer Views

## 🚨 Problema

El linter de Supabase detectó **18 vistas** con la propiedad `SECURITY DEFINER`, lo cual es un problema de seguridad porque:

- **SECURITY DEFINER**: Las vistas se ejecutan con los permisos del creador → **bypasea RLS** ❌
- **SECURITY INVOKER** (por defecto): Las vistas se ejecutan con los permisos del usuario → **respeta RLS** ✅

### Vistas Afectadas

1. `v_teachers_public`
2. `v_user_roles`
3. `organizers_live`
4. `v_teacher_classes_public`
5. `events_live`
6. `v_user_public`
7. `profiles_user_light`
8. `academies_live`
9. `v_academies_public`
10. `v_brands_public`
11. `v_teacher_academies`
12. `v_challenge_submissions_enriched`
13. `v_organizers_public`
14. `v_events_parent_public`
15. `v_academy_accepted_teachers`
16. `v_events_dates_public`
17. `v_challenge_leaderboard`
18. `v_academy_classes_public`

---

## ✅ Solución

### Opción 1: Aplicar Migración (Recomendado)

Ejecuta la migración que recrea todas las vistas sin `SECURITY DEFINER`:

```bash
# Si usas Supabase CLI
supabase db push

# O ejecuta directamente en Supabase SQL Editor
# Archivo: supabase/migrations/20250115_force_remove_security_definer_views.sql
```

### Opción 2: Ejecutar Manualmente en SQL Editor

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia y pega el contenido de `supabase/migrations/20250115_force_remove_security_definer_views.sql`
3. Ejecuta el script

---

## 🔍 Verificación

Después de aplicar la migración, verifica que las vistas no tienen `SECURITY DEFINER`:

```sql
-- Verificar en los metadatos de PostgreSQL
SELECT 
    v.viewname,
    CASE 
        WHEN c.reloptions IS NULL THEN '✅ Sin security_definer (INVOKER por defecto)'
        WHEN array_to_string(c.reloptions, ', ') LIKE '%security_definer%' THEN '❌ TIENE security_definer'
        ELSE '✅ Sin security_definer'
    END AS security_status
FROM pg_views v
LEFT JOIN pg_class c ON c.relname = v.viewname 
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
WHERE v.schemaname = 'public'
  AND v.viewname IN (
    'events_live',
    'v_academies_public',
    'organizers_live',
    'v_challenge_submissions_enriched',
    'v_user_public',
    'v_events_dates_public',
    'v_organizers_public',
    'v_challenge_leaderboard',
    'v_user_roles',
    'v_teacher_classes_public',
    'v_academy_classes_public',
    'profiles_user_light',
    'v_events_parent_public',
    'v_academy_accepted_teachers',
    'v_brands_public',
    'academies_live',
    'v_teacher_academies',
    'v_teachers_public'
  )
ORDER BY v.viewname;
```

**Resultado esperado**: Todas las vistas deben mostrar `✅ Sin security_definer (INVOKER por defecto)`

---

## 📝 Notas Importantes

### ¿Por qué es necesario recrear las vistas?

PostgreSQL **no permite** usar `ALTER VIEW` para cambiar `SECURITY DEFINER`. La única forma de eliminarlo es:

1. **DROP VIEW** (con CASCADE para eliminar dependencias)
2. **CREATE VIEW** (sin especificar `SECURITY DEFINER`)

### ¿Qué pasa con las dependencias?

El script usa `DROP VIEW ... CASCADE` para eliminar automáticamente:
- Vistas que dependen de estas vistas
- Permisos (GRANT) que se recrean después

### ¿Afecta el funcionamiento de la app?

**No**, porque:
- Las vistas se recrean con la misma estructura
- Los permisos se otorgan nuevamente (`GRANT SELECT`)
- Solo cambia el comportamiento de seguridad (ahora respeta RLS)

---

## 🐛 Si el Problema Persiste

Si después de aplicar la migración el linter sigue reportando errores:

1. **Verifica que la migración se aplicó correctamente:**
   ```sql
   SELECT * FROM supabase_migrations.schema_migrations 
   WHERE name LIKE '%security_definer%' 
   ORDER BY version DESC;
   ```

2. **Verifica que las vistas existen:**
   ```sql
   SELECT viewname FROM pg_views 
   WHERE schemaname = 'public' 
   AND viewname IN ('v_teachers_public', 'v_user_roles', ...);
   ```

3. **Fuerza la recreación manual de una vista específica:**
   ```sql
   -- Ejemplo para v_teachers_public
   DROP VIEW IF EXISTS public.v_teachers_public CASCADE;
   CREATE VIEW public.v_teachers_public AS
   SELECT *
   FROM public.profiles_teacher
   WHERE estado_aprobacion = 'aprobado';
   
   GRANT SELECT ON public.v_teachers_public TO anon, authenticated;
   ```

4. **Contacta a Supabase Support** si el problema persiste después de verificar todo lo anterior.

---

## 📚 Referencias

- [Supabase Database Linter - Security Definer View](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
- [PostgreSQL CREATE VIEW](https://www.postgresql.org/docs/current/sql-createview.html)
- [PostgreSQL Security Definer Functions](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)

