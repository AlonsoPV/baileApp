# 🔧 Solución: Error al Actualizar RSVP

## ❌ **Problema Identificado**

Los usuarios no pueden actualizar su RSVP después de haberlo creado. Posibles causas:

1. **Constraint UNIQUE faltante** en la tabla `rsvp`
2. **Método incorrecto** en el hook (`insert().merge()` vs `upsert()`)
3. **Políticas RLS** que no permiten actualizaciones

## ✅ **Solución Implementada**

### **1. Script SQL para Arreglar la Base de Datos**

Ejecuta `SCRIPT_9_FIX_RSVP.sql` en Supabase SQL Editor:

**Qué hace:**
- ✅ Verifica/crea constraint UNIQUE `(user_id, event_date_id)`
- ✅ Recrea políticas RLS para RSVP
- ✅ Asegura que `upsert()` funcione correctamente

### **2. Hook Actualizado**

El hook `useMyRSVP()` ahora usa:

```typescript
// ANTES (incorrecto)
.insert({ user_id, event_date_id, status })
.onConflict("user_id,event_date_id")
.merge()

// DESPUÉS (correcto)
.upsert(
  { user_id, event_date_id, status },
  { 
    onConflict: 'user_id,event_date_id',
    ignoreDuplicates: false 
  }
)
```

**Beneficios:**
- ✅ Crea RSVP si no existe
- ✅ Actualiza RSVP si ya existe
- ✅ Invalida cache automáticamente
- ✅ Mejor manejo de errores

## 🚀 **Pasos para Aplicar**

### **PASO 1: Ejecutar Script SQL**

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre `SCRIPT_9_FIX_RSVP.sql`
3. Copia todo el contenido
4. Pégalo en el SQL Editor
5. Haz clic en **"Run"**
6. Verifica que muestre ✅ "Test complete"

### **PASO 2: Verificar en Supabase**

Ejecuta en SQL Editor:

```sql
-- Verificar constraint UNIQUE
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'rsvp' 
  AND constraint_type = 'UNIQUE';

-- Debe mostrar: rsvp_user_event_unique
```

### **PASO 3: Refrescar la Aplicación**

1. Refresca la página (F5)
2. Intenta hacer RSVP a un evento
3. Intenta cambiar tu RSVP (ej: de "Voy" a "Interesado")
4. Debería funcionar sin errores ✅

## 🔍 **Cómo Probar**

### **Test 1: Crear RSVP**
1. Ve a un evento público
2. Haz clic en **"👍 Voy"**
3. Debería guardar correctamente

### **Test 2: Actualizar RSVP**
1. En el mismo evento, haz clic en **"👀 Interesado"**
2. Debería actualizar (no crear duplicado)
3. El botón debe reflejar el nuevo estado

### **Test 3: Cambiar a "No voy"**
1. Haz clic en **"❌ No voy"**
2. Debería actualizar nuevamente

## 📊 **Estructura de la Tabla RSVP**

```sql
CREATE TABLE rsvp (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  event_date_id INTEGER NOT NULL REFERENCES events_date(id),
  status TEXT CHECK (status IN ('voy', 'interesado', 'no_voy')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- CONSTRAINT ÚNICO: Un usuario = Un RSVP por evento
  CONSTRAINT rsvp_user_event_unique UNIQUE (user_id, event_date_id)
);
```

## 🔒 **Políticas RLS**

El script verifica estas políticas:

1. **SELECT**: Usuarios autenticados pueden ver todos los RSVPs (para contar)
2. **INSERT**: Usuarios solo pueden crear su propio RSVP
3. **UPDATE**: Usuarios solo pueden actualizar su propio RSVP
4. **DELETE**: Usuarios solo pueden eliminar su propio RSVP

## 🚨 **Si el Error Persiste**

### **Error: "duplicate key value violates unique constraint"**

**Causa**: Ya existe un RSVP para ese usuario/evento
**Solución**: El script ya arregla esto usando `upsert()`

### **Error: "permission denied for table rsvp"**

**Causa**: Políticas RLS mal configuradas
**Solución**: Ejecuta `SCRIPT_9_FIX_RSVP.sql` nuevamente

### **Error: "column does not exist"**

**Causa**: Tabla `rsvp` no existe o está mal configurada
**Solución**: Ejecuta `SCRIPT_1_TABLAS_EVENTOS.sql` primero

## 📝 **Cambios en el Código**

### **Archivo: `apps/web/src/hooks/useEvents.ts`**

```typescript
export function useMyRSVP() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return {
    async set(event_date_id: number, status: RSVPStatus) {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("rsvp")
        .upsert(
          { user_id: user.id, event_date_id, status },
          { onConflict: 'user_id,event_date_id', ignoreDuplicates: false }
        );

      if (error) throw error;

      // Invalidar cache
      qc.invalidateQueries({ queryKey: ["rsvp"] });
      qc.invalidateQueries({ queryKey: ["myRSVPs"] });
    }
  };
}
```

## ✅ **Checklist de Verificación**

Después de aplicar la solución:

- [ ] Script SQL ejecutado sin errores
- [ ] Constraint UNIQUE existe en la tabla
- [ ] Políticas RLS verificadas
- [ ] Puedo crear un RSVP nuevo
- [ ] Puedo actualizar un RSVP existente
- [ ] No se crean RSVPs duplicados
- [ ] La UI refleja el estado correcto

---

**Fecha**: 2025-01-22
**Status**: ✅ Solución implementada
**Archivos**: 
- `SCRIPT_9_FIX_RSVP.sql` (SQL)
- `apps/web/src/hooks/useEvents.ts` (TypeScript)
