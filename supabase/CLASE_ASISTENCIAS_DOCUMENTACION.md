# 📋 Documentación: Tabla `clase_asistencias`

## 📍 Ubicación en Supabase

Las reservas tentativas de clases se registran en la tabla:

```
public.clase_asistencias
```

## 🗂️ Estructura de la Tabla

### Columnas

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `id` | `bigserial` | ID único del registro (auto-incremental) | `123456789` |
| `user_id` | `uuid` | ID del usuario que reservó (FK a `auth.users`) | `0c20805f-519c-4e8e-9081-341ab64e504d` |
| `class_id` | `bigint` | ID de la clase (referencia al cronograma) | `17630664842505942` |
| `academy_id` | `bigint` | ID de la academia dueña de la clase (opcional) | `15` |
| `teacher_id` | `bigint` | ID del maestro dueño de la clase (opcional) | `null` |
| `role_baile` | `text` | Rol de baile: 'leader', 'follower', 'ambos', etc. | `'leader'` |
| `zona_tag_id` | `bigint` | ID del tag de zona (opcional) | `8` |
| `status` | `text` | Estado de la reserva (default: 'tentative') | `'tentative'` |
| `fecha_especifica` | `date` | Fecha específica para clases recurrentes (opcional) | `'2024-01-15'` o `null` |
| `created_at` | `timestamptz` | Fecha y hora de creación del registro | `'2024-01-15 10:30:00+00'` |

### Restricciones

- **Primary Key**: `id`
- **Unique Constraint**: `(user_id, class_id, fecha_especifica)` - Un usuario solo puede reservar una vez la misma clase en la misma fecha
- **Foreign Keys**:
  - `user_id` → `auth.users(id)` (on delete cascade)
  - `academy_id` → `profiles_academy(id)` (opcional)
  - `teacher_id` → `profiles_teacher(id)` (opcional)
  - `zona_tag_id` → `tags(id)` (opcional)

### Índices

- `idx_clase_asistencias_user` - Búsquedas por usuario
- `idx_clase_asistencias_class` - Búsquedas por clase
- `idx_clase_asistencias_academy` - Búsquedas por academia
- `idx_clase_asistencias_teacher` - Búsquedas por maestro
- `idx_clase_asistencias_status` - Filtros por estado
- `idx_clase_asistencias_fecha_especifica` - Búsquedas por fecha

## 🔐 Políticas RLS (Row Level Security)

### INSERT
- **Política**: `"insert own tentative attendance"`
- **Permiso**: Los usuarios solo pueden insertar sus propias reservas (`auth.uid() = user_id`)

### SELECT
- **Política**: `"select own attendance and superadmins can see all"`
- **Permiso**: 
  - Los usuarios pueden ver sus propias reservas
  - Los superadmins pueden ver todas las reservas
  - Las academias ven métricas agregadas a través de la función RPC `get_academy_class_metrics()`

## 📊 Cómo se Registran las Reservas

### Flujo Normal (desde la App)

1. Usuario hace clic en "Agregar a calendario" en una clase
2. El componente `AddToCalendarWithStats` se ejecuta
3. Se inserta un registro en `clase_asistencias` con:
   - `user_id`: ID del usuario actual
   - `class_id`: ID de la clase
   - `academy_id`: ID de la academia (si aplica)
   - `teacher_id`: ID del maestro (si aplica)
   - `role_baile`: Rol del usuario ('leader', 'follower', 'ambos')
   - `zona_tag_id`: Zona del usuario
   - `status`: 'tentative'
   - `fecha_especifica`: Fecha específica si es clase recurrente

### Ejemplo de Registro

```sql
INSERT INTO clase_asistencias (
  user_id,
  class_id,
  academy_id,
  role_baile,
  zona_tag_id,
  status,
  fecha_especifica,
  created_at
) VALUES (
  '0c20805f-519c-4e8e-9081-341ab64e504d'::UUID,
  17630664842505942,
  15,
  'leader',
  8,
  'tentative',
  NULL,
  NOW()
);
```

## 🔍 Consultas Útiles

### Ver todas las reservas de una academia

```sql
SELECT 
  ca.*,
  pu.display_name as nombre_usuario,
  pa.nombre_publico as nombre_academia
FROM clase_asistencias ca
LEFT JOIN profiles_user pu ON pu.user_id = ca.user_id
LEFT JOIN profiles_academy pa ON pa.id = ca.academy_id
WHERE ca.academy_id = 15
  AND ca.status = 'tentative'
ORDER BY ca.created_at DESC;
```

### Contar reservas por clase

```sql
SELECT 
  class_id,
  COUNT(*) as total_reservas,
  COUNT(*) FILTER (WHERE role_baile IN ('leader', 'lead')) as leaders,
  COUNT(*) FILTER (WHERE role_baile IN ('follower', 'follow')) as followers,
  COUNT(*) FILTER (WHERE role_baile = 'ambos') as ambos
FROM clase_asistencias
WHERE academy_id = 15
  AND status = 'tentative'
GROUP BY class_id
ORDER BY total_reservas DESC;
```

### Ver reservas por usuario

```sql
SELECT 
  ca.*,
  pu.display_name as nombre_usuario
FROM clase_asistencias ca
LEFT JOIN profiles_user pu ON pu.user_id = ca.user_id
WHERE ca.user_id = '0c20805f-519c-4e8e-9081-341ab64e504d'::UUID
  AND ca.status = 'tentative'
ORDER BY ca.created_at DESC;
```

## 📁 Archivos Relacionados

- **Creación de tabla**: `supabase/01_clase_asistencias.sql`
- **Validación**: `supabase/02_validate_clase_asistencias.sql`
- **Métricas**: `supabase/03_update_class_metrics_with_details.sql`
- **Fecha específica**: `supabase/04_add_fecha_especifica_to_clase_asistencias.sql`
- **Teacher ID**: `supabase/05_add_teacher_id_to_clase_asistencias.sql`
- **Métricas de maestro**: `supabase/06_get_teacher_class_metrics.sql`

## 🔗 Relaciones

```
clase_asistencias
├── user_id → auth.users (usuario que reservó)
├── class_id → cronograma en profiles_academy (clase)
├── academy_id → profiles_academy (academia dueña)
├── teacher_id → profiles_teacher (maestro dueño)
└── zona_tag_id → tags (zona geográfica)
```

## 💡 Notas Importantes

1. **Estado 'tentative'**: Por ahora solo se usa el estado 'tentative' (reserva tentativa)
2. **Clases recurrentes**: Para clases semanales, `fecha_especifica` puede ser `NULL` o una fecha específica
3. **Métricas**: Las academias ven métricas agregadas a través de la función RPC `get_academy_class_metrics()`
4. **RLS**: Las políticas RLS aseguran que los usuarios solo vean sus propias reservas, excepto superadmins

