# 🚨 GUÍA DE EMERGENCIA: Datos Perdidos

## 📋 **Situación:**
- ✅ Ejecutaste el script SQL actualizado
- ❌ Tu perfil ahora muestra datos vacíos
- ❓ ¿Se perdieron los datos o solo es un problema de cache?

---

## 🔍 **PASO 1: Verificar si los datos existen**

### **Opción A: Supabase Dashboard**
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Click en **"Table Editor"**
4. Busca la tabla **`profiles_user`**
5. Encuentra tu registro por `user_id`
6. **¿Qué ves?**
   - ✅ Datos completos → El problema es en la app (cache/código)
   - ❌ Datos en null → Se perdieron en la BD

### **Opción B: SQL Editor**
```sql
SELECT * FROM profiles_user 
WHERE user_id = '0c20805f-519c-4e8e-9081-341ab64e504d';
```

---

## ✅ **CASO 1: Los datos EXISTEN en la BD**

**Problema:** Cache o código desactualizado

**Solución:**
1. Hard refresh: `Ctrl + Shift + R`
2. Borrar cache del navegador
3. Esperar a que Vercel termine el build
4. Verificar que estás en la última versión del deploy

---

## ❌ **CASO 2: Los datos NO existen (se perdieron)**

### **🔄 Opción 1: Restaurar desde Backup (Recomendado)**

**Si tienes PITR (Point-in-Time Recovery) activado:**
1. Ve a Supabase Dashboard → Database → Backups
2. Click en **"Restore"**
3. Selecciona un timestamp **antes** de ejecutar el script
4. Espera a que complete la restauración
5. Verifica tus datos

**Si NO tienes PITR:**
- Supabase hace backups diarios automáticos
- Puedes restaurar al último backup disponible
- Perderás cambios desde el último backup hasta ahora

---

### **✏️ Opción 2: Restaurar Manualmente**

**Si recuerdas tus datos:**

```sql
UPDATE profiles_user
SET 
  display_name = 'Tu Nombre Real',
  bio = 'Tu bio aquí',
  ritmos = ARRAY[1, 2, 3], -- Reemplaza con tus ritmos
  zonas = ARRAY[4, 5],     -- Reemplaza con tus zonas
  avatar_url = 'https://...',
  redes_sociales = '{
    "instagram": "@tuusuario",
    "facebook": "tu-facebook",
    "whatsapp": "+123456789"
  }'::jsonb
WHERE user_id = '0c20805f-519c-4e8e-9081-341ab64e504d';
```

**Para `media` (fotos/videos):**
- Si las fotos siguen en Supabase Storage, necesitas recrear el array
- Ve a Storage → user-media → tu carpeta
- Anota los paths de las fotos
- Luego:

```sql
UPDATE profiles_user
SET media = '[
  {
    "id": "path/to/photo1.jpg",
    "url": "https://....supabase.co/storage/v1/object/public/user-media/path/to/photo1.jpg",
    "type": "image"
  }
]'::jsonb
WHERE user_id = '0c20805f-519c-4e8e-9081-341ab64e504d';
```

---

### **🔍 Opción 3: Recuperar desde otros usuarios (si eres admin)**

Si otros usuarios NO perdieron datos, puedes inspeccionar la estructura:

```sql
-- Ver cómo están estructurados los datos de otros usuarios
SELECT 
  display_name,
  ritmos,
  zonas,
  media,
  redes_sociales
FROM profiles_user 
WHERE display_name IS NOT NULL
LIMIT 5;
```

Esto te da ejemplos de cómo deberían verse tus datos.

---

## 🛡️ **PREVENCIÓN: Configurar Backups Automáticos**

### **1. Activar PITR (Point-in-Time Recovery)**
```
Dashboard → Database → Backups → Enable PITR
```

**Beneficios:**
- ✅ Restaura a cualquier punto en el tiempo (últimos 7 días)
- ✅ Granularidad de segundos
- ✅ No pierdes datos recientes
- ⚠️ Requiere plan Pro ($25/mes)

---

### **2. Backups Manuales Periódicos**

**Script para backup completo:**
```sql
-- Exportar tus datos
COPY (
  SELECT * FROM profiles_user 
  WHERE user_id = 'TU-USER-ID'
) TO '/tmp/backup_profile.csv' CSV HEADER;
```

O usa el botón **"Export"** en Table Editor.

---

### **3. Verificar Triggers de Protección**

```sql
-- Verificar que el trigger esté activo
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles_user'
  AND trigger_name = 'trg_profiles_user_keep_media';
```

Debería mostrar:
```
trigger_name: trg_profiles_user_keep_media
event_manipulation: UPDATE
action_statement: EXECUTE FUNCTION keep_media_on_null()
```

---

## 🐛 **¿POR QUÉ SE PERDIERON LOS DATOS?**

### **Posibles causas:**

1. **Función RPC mal configurada:**
   - Si la función tenía bugs, pudo sobrescribir con nulls
   - **Fix:** Usar la versión actualizada del script

2. **COALESCE no funcionó:**
   - Si el SELECT devolvió null, COALESCE no ayudó
   - **Fix:** Verificar que los datos existían ANTES de ejecutar el script

3. **Trigger no estaba activo:**
   - El trigger `keep_media_on_null` previene pérdida de media
   - **Fix:** Ejecutar la parte del trigger del script

4. **Cache corruption:**
   - React Query podía tener datos corruptos en cache
   - **Fix:** `invalidateQueries` después de updates

---

## 📝 **Checklist de Recuperación:**

- [ ] Verificar datos en Supabase Table Editor
- [ ] Si existen: Hard refresh (`Ctrl + Shift + R`)
- [ ] Si NO existen: Intentar restaurar desde backup
- [ ] Si no hay backup: Restaurar manualmente
- [ ] Verificar que trigger está activo
- [ ] Verificar que función RPC está correcta
- [ ] Re-ejecutar script actualizado si es necesario
- [ ] Activar PITR para el futuro
- [ ] Hacer backup manual de tus datos

---

## 🆘 **Contacto de Emergencia:**

Si nada funciona:
1. **Supabase Support:** https://supabase.com/dashboard/support
2. **Forum:** https://github.com/supabase/supabase/discussions
3. **Discord:** https://discord.supabase.com

---

## ✅ **Después de Recuperar:**

1. ✅ Verificar que todos los campos están completos
2. ✅ Hacer un backup manual inmediato
3. ✅ Activar PITR si es posible
4. ✅ Documentar qué datos tenías (por si vuelve a pasar)
5. ✅ Probar que la app funciona correctamente

---

## 🎯 **Resumen:**

1. **Verificar:** ¿Los datos existen en Supabase?
2. **Recuperar:** Backup > Manual > Recrear
3. **Prevenir:** PITR + Backups + Triggers
4. **Probar:** Todo funciona correctamente

**¡No entres en pánico! Los datos probablemente están ahí o se pueden recuperar!** 💪

