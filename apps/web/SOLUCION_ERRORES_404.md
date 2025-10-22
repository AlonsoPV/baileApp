# 🔧 Solución: Errores 404 en Cronogramas y Precios

## ❌ **Errores Detectados**

```
POST https://.../rest/v1/event_schedules?on_conflict=id&select=* 404 (Not Found)
POST https://.../rest/v1/event_prices?on_conflict=id&select=* 404 (Not Found)
PATCH https://.../rest/v1/events_date?id=eq.1 400 (Bad Request)
```

## 🎯 **Causa del Problema**

Las tablas `event_schedules` y `event_prices` **NO EXISTEN** en tu base de datos de Supabase. Estas tablas son necesarias para:

- ✅ Crear cronogramas de actividades (clases, shows, sociales)
- ✅ Gestionar precios y promociones (preventa, taquilla, descuentos)
- ✅ Organizar horarios dentro de cada evento

## ✅ **Solución**

### **PASO 1: Ejecutar Script SQL**

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Abre el archivo `SCRIPT_8_CRONOGRAMAS_PRECIOS.sql`
3. Copia **TODO** el contenido
4. Pégalo en el SQL Editor
5. Haz clic en **"Run"** (Ejecutar)
6. Espera el mensaje de éxito ✅

### **PASO 2: Verificar Creación**

Ejecuta en el SQL Editor:

```sql
-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('event_schedules', 'event_prices');
```

**Resultado esperado:**
```
table_name
-----------------
event_schedules
event_prices
```

### **PASO 3: Refrescar la Aplicación**

1. Refresca la página en tu navegador (F5)
2. Intenta crear un cronograma o precio nuevamente
3. Debería funcionar correctamente ✅

## 📋 **Qué Crea el Script**

### **Tabla: event_schedules**
- `id` - Identificador único
- `event_date_id` - Referencia al evento
- `tipo` - Tipo de actividad (clase, show, social, otro)
- `titulo` - Nombre de la actividad
- `descripcion` - Descripción opcional
- `hora_inicio` - Hora de inicio
- `hora_fin` - Hora de fin (opcional)
- `ritmo` - Ritmo asociado (opcional)

### **Tabla: event_prices**
- `id` - Identificador único
- `event_date_id` - Referencia al evento
- `tipo` - Tipo de precio (preventa, taquilla, promo)
- `nombre` - Nombre del precio (ej: "Preventa Pareja")
- `monto` - Cantidad en moneda local
- `descripcion` - Descripción opcional
- `hora_inicio` - Inicio de vigencia (opcional)
- `hora_fin` - Fin de vigencia (opcional)
- `descuento` - Porcentaje de descuento (0-100)

## 🔒 **Políticas de Seguridad (RLS)**

El script crea automáticamente políticas para:

✅ **Público** puede ver cronogramas y precios de eventos publicados
✅ **Organizadores** pueden ver/crear/editar/eliminar sus propios cronogramas y precios
✅ **Seguridad** mediante Row Level Security (RLS)

## ⚡ **Después de Ejecutar**

Los componentes que funcionarán:
- ✅ `EventScheduleEditor` - Editor de cronogramas
- ✅ `EventPriceEditor` - Editor de precios
- ✅ Visualización de cronogramas en eventos públicos
- ✅ Visualización de precios en eventos públicos

## 🚨 **Si el Error Persiste**

1. **Verifica que el script se ejecutó correctamente**
   - Revisa si hay errores en el SQL Editor
   - Asegúrate de copiar TODO el contenido del script

2. **Limpia la cache del navegador**
   - Presiona Ctrl+Shift+R (hard refresh)
   - O borra la cache completamente

3. **Verifica la conexión a Supabase**
   - Asegúrate de que las variables de entorno están correctas
   - Verifica que el proyecto de Supabase está activo

4. **Revisa los logs de Supabase**
   - Ve a Dashboard → Logs → API
   - Busca errores relacionados con las tablas

---

**Fecha**: 2025-01-22
**Status**: ✅ Solución lista para aplicar
**Archivo**: `SCRIPT_8_CRONOGRAMAS_PRECIOS.sql`
