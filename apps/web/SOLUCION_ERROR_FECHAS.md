# 🔧 Solución: Error al Agregar/Actualizar Fechas de Eventos

## ❌ **Problema Identificado**

Error al intentar crear o actualizar una fecha de evento. Posibles síntomas:

- Error 400 (Bad Request) al guardar fecha
- Error en consola sobre políticas RLS
- Error sobre estructura de datos incorrecta
- La fecha no se guarda en la base de datos

## ✅ **Soluciones Implementadas**

### **1. Hook `useUpdateDate` Corregido**

**Antes (incorrecto):**
```typescript
mutationFn: async ({ id, patch }: { id: number; patch: Partial<EventDate> }) => {
  // ...
}

// Uso:
update.mutateAsync({
  id: Number(id),
  patch: { fecha: '2025-01-22', lugar: 'Teatro' }
});
```

**Ahora (correcto):**
```typescript
mutationFn: async (payload: { id: number } & Partial<EventDate>) => {
  const { id, ...patch } = payload;
  // ...
}

// Uso:
update.mutateAsync({
  id: Number(id),
  fecha: '2025-01-22',
  lugar: 'Teatro'
});
```

### **2. Logging Mejorado**

Ahora ambos hooks (`useCreateDate` y `useUpdateDate`) tienen logging para diagnosticar:

```typescript
console.log('[useCreateDate] Creating date:', payload);
console.log('[useUpdateDate] Updating date:', { id, patch });
```

### **3. Invalidación de Cache**

Después de actualizar, se invalidan todas las queries relacionadas:

```typescript
onSuccess: (data) => {
  qc.invalidateQueries({ queryKey: ["dates"] });
  qc.invalidateQueries({ queryKey: ["dates", data.parent_id] });
  qc.invalidateQueries({ queryKey: ["date", data.id] });
}
```

## 🔍 **Diagnóstico de Errores**

### **Error 1: "Bad Request" o código 400**

**Causas posibles:**
1. Campos requeridos faltantes (`parent_id`, `fecha`)
2. Formato de fecha incorrecto
3. Tipo de datos incorrecto (string vs number)
4. Políticas RLS que bloquean la operación

**Solución:**
- Verifica en consola el log `[useCreateDate] Creating date:` o `[useUpdateDate] Updating date:`
- Asegúrate de que `fecha` esté en formato `YYYY-MM-DD`
- Verifica que `parent_id` sea un número válido

### **Error 2: "Permission denied" o 403**

**Causa:** Políticas RLS mal configuradas

**Solución:**
Ejecuta en Supabase SQL Editor:

```sql
-- Verificar políticas de events_date
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'events_date'
ORDER BY policyname;

-- Debe haber políticas para:
-- - Organizadores pueden crear fechas en sus eventos
-- - Organizadores pueden actualizar sus fechas
-- - Público puede ver fechas publicadas
```

### **Error 3: "Column does not exist"**

**Causa:** Tabla `events_date` no existe o le faltan columnas

**Solución:**
Ejecuta `SCRIPT_1_TABLAS_EVENTOS.sql` nuevamente

### **Error 4: "Foreign key violation"**

**Causa:** El `parent_id` no existe o no pertenece al organizador

**Solución:**
Verifica que:
1. El evento padre existe
2. El organizador es dueño del evento padre
3. El `parent_id` es correcto

## 📋 **Estructura Esperada de Datos**

### **Crear Fecha (useCreateDate)**

```typescript
{
  parent_id: 123,              // REQUERIDO: ID del evento padre
  fecha: "2025-02-15",         // REQUERIDO: Formato YYYY-MM-DD
  hora_inicio: "20:00:00",     // Opcional: Formato HH:MM:SS
  hora_fin: "23:00:00",        // Opcional
  lugar: "Teatro Principal",   // Opcional
  direccion: "Calle 123",      // Opcional
  ciudad: "CDMX",              // Opcional
  requisitos: "Mayores de 18", // Opcional
  estado_publicacion: "borrador" // "borrador" | "publicado"
}
```

### **Actualizar Fecha (useUpdateDate)**

```typescript
{
  id: 456,                     // REQUERIDO: ID de la fecha
  fecha: "2025-02-16",         // Todo lo demás es opcional
  hora_inicio: "21:00:00",
  lugar: "Nuevo lugar",
  // ...cualquier campo a actualizar
}
```

## 🚀 **Cómo Probar**

### **Test 1: Crear Fecha Nueva**

1. Ve a tu perfil de organizador
2. Selecciona un evento padre
3. Haz clic en "Crear nueva fecha"
4. Completa al menos: **Fecha** (campo requerido)
5. Haz clic en "Guardar"
6. Verifica en consola:
   ```
   [useCreateDate] Creating date: {...}
   [useCreateDate] Success: {...}
   ```

### **Test 2: Actualizar Fecha Existente**

1. Ve a una fecha existente
2. Modifica cualquier campo
3. Haz clic en "Guardar"
4. Verifica en consola:
   ```
   [useUpdateDate] Updating date: {...}
   [useUpdateDate] Success: {...}
   ```

### **Test 3: Verificar en Supabase**

1. Ve a Supabase Dashboard → Table Editor
2. Abre la tabla `events_date`
3. Verifica que la fecha se haya creado/actualizado
4. Revisa los campos `created_at` y `updated_at`

## 🔒 **Políticas RLS Necesarias**

```sql
-- Organizadores pueden crear fechas en sus eventos
CREATE POLICY "Organizers can create dates for their events"
  ON events_date FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events_parent ep
      JOIN profiles_organizer po ON ep.organizer_id = po.id
      WHERE ep.id = parent_id AND po.user_id = auth.uid()
    )
  );

-- Organizadores pueden actualizar sus fechas
CREATE POLICY "Organizers can update their event dates"
  ON events_date FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events_parent ep
      JOIN profiles_organizer po ON ep.organizer_id = po.id
      WHERE ep.id = parent_id AND po.user_id = auth.uid()
    )
  );
```

## 📝 **Archivos Modificados**

- ✅ `apps/web/src/hooks/useEvents.ts` - Hooks corregidos con logging
- ✅ `apps/web/src/screens/events/EventDateEditScreen.tsx` - Uso correcto del hook

## ✅ **Checklist de Verificación**

Después de aplicar los cambios:

- [ ] Puedo crear una fecha nueva
- [ ] Puedo actualizar una fecha existente
- [ ] Los logs aparecen en consola
- [ ] No hay errores 400 o 403
- [ ] Los datos se guardan en Supabase
- [ ] La UI se actualiza correctamente

## 🚨 **Si el Error Persiste**

1. **Abre la consola del navegador** (F12) y busca:
   - `[useCreateDate]` o `[useUpdateDate]`
   - Errores de Supabase
   
2. **Verifica el payload** que se está enviando:
   - ¿Tiene `parent_id` y `fecha`?
   - ¿Los tipos de datos son correctos?
   
3. **Verifica las políticas RLS**:
   - Ejecuta el query de verificación mencionado arriba
   
4. **Comparte el error específico**:
   - Screenshot de la consola
   - Mensaje de error completo
   - Datos que estás intentando enviar

---

**Fecha**: 2025-01-22
**Status**: ✅ Hooks actualizados
**Próximo paso**: Probar crear/actualizar fechas y verificar logs
