# 📊 Guía: Importar Eventos en Masa desde Excel a Supabase

## ✅ Sí, puedes importar eventos desde Excel

Hay varias formas de hacerlo. Esta guía te muestra las opciones más sencillas.

---

## 📋 Paso 1: Preparar el Excel

### Estructura del Excel

Crea un archivo Excel con las siguientes columnas:

#### Para Eventos Parent (Sociales)
| nombre | descripcion | organizer_email | estilos | zonas | sede_general |
|--------|-------------|-----------------|---------|-------|--------------|
| Salsa Night CDMX | Evento mensual de salsa | organizador@email.com | 1,2,3 | 1,2 | Av. Reforma 123, CDMX |

#### Para Eventos Date (Fechas Específicas)
| parent_nombre | fecha | hora_inicio | hora_fin | lugar | direccion | ciudad | zona | estilos | nombre_fecha |
|---------------|-------|-------------|----------|-------|-----------|--------|------|---------|--------------|
| Salsa Night CDMX | 2025-02-15 | 20:00 | 23:00 | Salón Principal | Av. Reforma 123 | CDMX | 1 | 1,2 | Febrero 2025 |

### Notas Importantes:

1. **organizer_email**: El email del organizador que ya existe en la plataforma
2. **estilos**: IDs de ritmos separados por comas (ej: "1,2,3")
3. **zonas**: IDs de zonas separados por comas (ej: "1,2")
4. **fecha**: Formato YYYY-MM-DD (ej: 2025-02-15)
5. **hora_inicio/hora_fin**: Formato HH:MM (ej: 20:00)

---

## 🔄 Paso 2: Convertir Excel a CSV

1. Abre tu archivo Excel
2. Ve a **Archivo → Guardar como**
3. Selecciona formato **CSV (delimitado por comas)**
4. Guarda el archivo

---

## 🛠️ Opción 1: Usar Supabase Dashboard (Más Fácil)

### Para Eventos Parent:

1. Ve a tu proyecto en Supabase Dashboard
2. Ve a **Table Editor** → **events_parent**
3. Haz clic en **Insert** → **Import data from CSV**
4. Selecciona tu archivo CSV
5. Mapea las columnas (nombre, descripcion, etc.)
6. **Importante**: Necesitarás el `organizer_id` (UUID), no el email
   - Primero busca el `user_id` del organizador por email
   - O crea un script SQL para hacer el mapeo

### Limitación:
- Supabase Dashboard no permite importar directamente con emails
- Necesitarás convertir emails a UUIDs primero

---

## 💻 Opción 2: Script SQL (Recomendado)

### Paso 1: Preparar los datos en Excel

Crea un Excel con esta estructura:

**eventos_parent.csv:**
```csv
nombre,descripcion,organizer_email,estilos,zonas,sede_general
Salsa Night CDMX,Evento mensual de salsa,organizador@email.com,"1,2","1,2","Av. Reforma 123, CDMX"
Bachata Social,Evento semanal de bachata,organizador@email.com,"3,4","1","Calle Principal 456"
```

**eventos_date.csv:**
```csv
parent_nombre,fecha,hora_inicio,hora_fin,lugar,direccion,ciudad,zona,estilos,nombre_fecha
Salsa Night CDMX,2025-02-15,20:00,23:00,Salón Principal,Av. Reforma 123,CDMX,1,"1,2",Febrero 2025
Salsa Night CDMX,2025-03-15,20:00,23:00,Salón Principal,Av. Reforma 123,CDMX,1,"1,2",Marzo 2025
Bachata Social,2025-02-20,19:00,22:00,Club Dance,Calle Principal 456,CDMX,1,"3,4",Febrero 2025
```

### Paso 2: Crear Script SQL

Crea un archivo SQL con este script (ajusta los datos según tu CSV):

```sql
-- ============================================
-- IMPORTAR EVENTOS DESDE CSV/EXCEL
-- ============================================

-- Paso 1: Crear tabla temporal para eventos parent
CREATE TEMP TABLE temp_events_parent (
  nombre text,
  descripcion text,
  organizer_email text,
  estilos text, -- "1,2,3"
  zonas text,   -- "1,2"
  sede_general text
);

-- Paso 2: Insertar datos manualmente (o usar COPY si tienes acceso)
-- Reemplaza estos valores con tus datos del Excel
INSERT INTO temp_events_parent (nombre, descripcion, organizer_email, estilos, zonas, sede_general) VALUES
('Salsa Night CDMX', 'Evento mensual de salsa', 'organizador@email.com', '1,2', '1,2', 'Av. Reforma 123, CDMX'),
('Bachata Social', 'Evento semanal de bachata', 'organizador@email.com', '3,4', '1', 'Calle Principal 456');

-- Paso 3: Insertar en events_parent (con conversión de email a UUID)
INSERT INTO public.events_parent (
  nombre,
  descripcion,
  organizer_id,
  estilos,
  zonas,
  sede_general
)
SELECT 
  tep.nombre,
  tep.descripcion,
  pu.user_id as organizer_id, -- Convertir email a user_id
  string_to_array(tep.estilos, ',')::integer[] as estilos,
  string_to_array(tep.zonas, ',')::integer[] as zonas,
  tep.sede_general
FROM temp_events_parent tep
JOIN public.profiles_user pu ON pu.email = tep.organizer_email
ON CONFLICT DO NOTHING
RETURNING id, nombre;

-- Paso 4: Crear tabla temporal para eventos date
CREATE TEMP TABLE temp_events_date (
  parent_nombre text,
  fecha date,
  hora_inicio time,
  hora_fin time,
  lugar text,
  direccion text,
  ciudad text,
  zona integer,
  estilos text,
  nombre_fecha text
);

-- Paso 5: Insertar datos de fechas
INSERT INTO temp_events_date (parent_nombre, fecha, hora_inicio, hora_fin, lugar, direccion, ciudad, zona, estilos, nombre_fecha) VALUES
('Salsa Night CDMX', '2025-02-15', '20:00', '23:00', 'Salón Principal', 'Av. Reforma 123', 'CDMX', 1, '1,2', 'Febrero 2025'),
('Salsa Night CDMX', '2025-03-15', '20:00', '23:00', 'Salón Principal', 'Av. Reforma 123', 'CDMX', 1, '1,2', 'Marzo 2025'),
('Bachata Social', '2025-02-20', '19:00', '22:00', 'Club Dance', 'Calle Principal 456', 'CDMX', 1, '3,4', 'Febrero 2025');

-- Paso 6: Insertar en events_date
INSERT INTO public.events_date (
  parent_id,
  nombre,
  fecha,
  hora_inicio,
  hora_fin,
  lugar,
  direccion,
  ciudad,
  zona,
  estilos
)
SELECT 
  ep.id as parent_id,
  COALESCE(ted.nombre_fecha, ep.nombre) as nombre,
  ted.fecha,
  ted.hora_inicio,
  ted.hora_fin,
  ted.lugar,
  ted.direccion,
  ted.ciudad,
  ted.zona,
  string_to_array(ted.estilos, ',')::integer[] as estilos
FROM temp_events_date ted
JOIN public.events_parent ep ON ep.nombre = ted.parent_nombre
ON CONFLICT DO NOTHING
RETURNING id, nombre, fecha;

-- Paso 7: Limpiar tablas temporales
DROP TABLE IF EXISTS temp_events_parent;
DROP TABLE IF EXISTS temp_events_date;

-- Verificar resultados
SELECT 
  'Eventos Parent creados:' as info,
  COUNT(*) as total
FROM public.events_parent
WHERE created_at > NOW() - INTERVAL '1 hour';

SELECT 
  'Eventos Date creados:' as info,
  COUNT(*) as total
FROM public.events_date
WHERE created_at > NOW() - INTERVAL '1 hour';
```

### Paso 3: Ejecutar el Script

1. Ve a Supabase Dashboard → **SQL Editor**
2. Pega el script SQL
3. Ajusta los datos INSERT con tus datos del Excel
4. Ejecuta el script
5. Verifica los resultados

---

## 🐍 Opción 3: Script Python (Avanzado)

Si tienes muchos eventos, puedes crear un script Python:

```python
import pandas as pd
import psycopg2
from supabase import create_client, Client

# 1. Leer Excel
df_parent = pd.read_excel('eventos.xlsx', sheet_name='eventos_parent')
df_date = pd.read_excel('eventos.xlsx', sheet_name='eventos_date')

# 2. Conectar a Supabase
supabase_url = "tu-url-de-supabase"
supabase_key = "tu-anon-key"
supabase: Client = create_client(supabase_url, supabase_key)

# 3. Obtener user_id de organizadores
organizers = {}
for email in df_parent['organizer_email'].unique():
    response = supabase.table('profiles_user').select('user_id, email').eq('email', email).execute()
    if response.data:
        organizers[email] = response.data[0]['user_id']

# 4. Insertar eventos parent
for _, row in df_parent.iterrows():
    organizer_id = organizers.get(row['organizer_email'])
    if not organizer_id:
        print(f"⚠️ Organizador no encontrado: {row['organizer_email']}")
        continue
    
    estilos = [int(x) for x in str(row['estilos']).split(',')]
    zonas = [int(x) for x in str(row['zonas']).split(',')]
    
    data = {
        'nombre': row['nombre'],
        'descripcion': row['descripcion'],
        'organizer_id': organizer_id,
        'estilos': estilos,
        'zonas': zonas,
        'sede_general': row.get('sede_general', '')
    }
    
    supabase.table('events_parent').insert(data).execute()

# 5. Insertar eventos date
for _, row in df_date.iterrows():
    # Buscar parent_id por nombre
    parent = supabase.table('events_parent').select('id').eq('nombre', row['parent_nombre']).execute()
    if not parent.data:
        print(f"⚠️ Evento parent no encontrado: {row['parent_nombre']}")
        continue
    
    parent_id = parent.data[0]['id']
    estilos = [int(x) for x in str(row['estilos']).split(',')]
    
    data = {
        'parent_id': parent_id,
        'nombre': row.get('nombre_fecha', ''),
        'fecha': str(row['fecha']),
        'hora_inicio': str(row['hora_inicio']),
        'hora_fin': str(row['hora_fin']),
        'lugar': row.get('lugar', ''),
        'direccion': row.get('direccion', ''),
        'ciudad': row.get('ciudad', ''),
        'zona': int(row['zona']) if pd.notna(row['zona']) else None,
        'estilos': estilos
    }
    
    supabase.table('events_date').insert(data).execute()

print("✅ Importación completada")
```

---

## 📝 Plantilla de Excel

He creado una plantilla que puedes usar:

### Hoja 1: eventos_parent
```
| nombre              | descripcion              | organizer_email        | estilos | zonas | sede_general           |
|---------------------|--------------------------|------------------------|---------|-------|------------------------|
| Salsa Night CDMX    | Evento mensual de salsa  | organizador@email.com  | 1,2     | 1,2   | Av. Reforma 123, CDMX  |
```

### Hoja 2: eventos_date
```
| parent_nombre       | fecha       | hora_inicio | hora_fin | lugar          | direccion          | ciudad | zona | estilos | nombre_fecha |
|---------------------|-------------|-------------|----------|----------------|--------------------|--------|------|---------|--------------|
| Salsa Night CDMX    | 2025-02-15  | 20:00       | 23:00    | Salón Principal| Av. Reforma 123    | CDMX   | 1    | 1,2     | Febrero 2025 |
```

---

## ⚠️ Consideraciones Importantes

### 1. IDs de Ritmos y Zonas
- Necesitas conocer los IDs del catálogo
- Consulta las tablas `ritmos_catalog` y `zonas_catalog` en Supabase
- Ejemplo: Salsa podría ser ID 1, Bachata ID 2, etc.

### 2. Organizador debe existir
- El organizador debe tener un perfil creado
- El email debe coincidir exactamente
- Si no existe, créalo primero

### 3. Validación de datos
- Fechas en formato YYYY-MM-DD
- Horas en formato HH:MM (24 horas)
- Arrays separados por comas sin espacios

### 4. Permisos RLS
- Asegúrate de tener permisos para insertar
- Si hay errores de permisos, verifica las políticas RLS

---

## 🔍 Verificar la Importación

Después de importar, ejecuta estas queries para verificar:

```sql
-- Ver eventos parent importados
SELECT id, nombre, organizer_id, created_at
FROM public.events_parent
ORDER BY created_at DESC
LIMIT 10;

-- Ver eventos date importados
SELECT 
  ed.id,
  ed.nombre,
  ed.fecha,
  ep.nombre as evento_parent
FROM public.events_date ed
JOIN public.events_parent ep ON ed.parent_id = ep.id
ORDER BY ed.created_at DESC
LIMIT 10;
```

---

## 🚀 Recomendación

**Para empezar, usa la Opción 2 (Script SQL)**:
- Es la más directa
- No requiere programación
- Fácil de ajustar
- Puedes ejecutarla desde Supabase Dashboard

Si tienes muchos eventos (más de 100), considera la Opción 3 (Python) para automatizar el proceso.

---

## 📞 ¿Necesitas ayuda?

Si tienes problemas:
1. Verifica que los emails de organizadores existan
2. Verifica que los IDs de ritmos y zonas sean correctos
3. Revisa los logs de error en Supabase
4. Asegúrate de que las fechas estén en el formato correcto

