## Attendance Status Extension Audit

### Resumen
- La fuente de verdad actual es `public.clase_asistencias`.
- El flujo del alumno ya registra `status = 'tentative'` cuando marca intención de asistir.
- Academy ya tiene una capa de gestión por alumno que contempla `attended` en agregaciones e historial.
- Teacher todavía solo tiene métricas por clase; no existe una superficie equivalente de alumnos.
- El perfil del alumno hoy muestra RSVPs y compras, pero no un historial de clases basado en `clase_asistencias`.

## Inventario de datos

### `supabase/01_clase_asistencias.sql`
- Uso actual:
  - crea `public.clase_asistencias`
  - define `status text not null default 'tentative'`
  - crea RPC inicial `get_academy_class_metrics`
- Qué se reutiliza:
  - una sola fila por `user_id + class_id (+ fecha_especifica en migraciones posteriores)`
  - `status` como campo extensible
- Qué falta extender:
  - documentar y normalizar estados soportados
  - habilitar transición administrativa a `attended`
  - reflejar conteos separados por estado en métricas

### `supabase/04_add_fecha_especifica_to_clase_asistencias.sql`
- Uso actual:
  - agrega `fecha_especifica`
  - permite distinguir sesiones exactas
- Qué se reutiliza:
  - llave natural por alumno/clase/sesión
- Qué falta extender:
  - asegurar que `attended` use la misma fila y la misma sesión

### `supabase/05_add_teacher_id_to_clase_asistencias.sql`
- Uso actual:
  - agrega `teacher_id`
- Qué se reutiliza:
  - permite que teacher tenga ownership directo sobre registros
- Qué falta extender:
  - exponer listados y acciones administrativas equivalentes a academy

### `supabase/migrations/20260408130000_stage1_academy_session_metrics.sql`
- Uso actual:
  - endurece unicidad por sesión
  - crea `rpc_get_academy_class_metrics`
  - cuenta solo `tentative`
- Qué se reutiliza:
  - agregación por `class_id + fecha_especifica`
  - mapeo de cronograma para nombre/día/hora
- Qué falta extender:
  - devolver `tentative_count` y `attended_count`

### `supabase/migrations/20260409120000_rpc_academy_global_metrics.sql`
- Uso actual:
  - métricas globales de academy por período
  - filtra solo `tentative`
- Qué se reutiliza:
  - KPIs globales y desglose por rol/zona
- Qué falta extender:
  - separar tentativos y asistidos
  - evitar un único total ambiguo

### `supabase/06_get_teacher_class_metrics.sql`
- Uso actual:
  - métricas agregadas por clase para teacher
  - filtra solo `tentative`
- Qué se reutiliza:
  - ownership de teacher
  - resolución de clase desde cronograma/costos
- Qué falta extender:
  - separar `tentative` y `attended`
  - habilitar futura gestión por alumno

### `supabase/migrations/20260410120000_rpc_academy_students_metrics.sql`
- Uso actual:
  - `rpc_get_academy_students_list`
  - `rpc_get_academy_student_detail`
  - `rpc_get_academy_students_global_metrics`
  - ya normaliza `status` y cuenta `tentative`, `attended`, `pagado`, cancelados
- Qué se reutiliza:
  - shape de listados y detalle por alumno
  - historial de clases con estado
  - desglose por estado, rol y zona
- Qué falta extender:
  - añadir breakdown por clase con `attended`
  - usar `attended` como estado canónico, manteniendo compatibilidad con históricos
  - replicar el mismo patrón para teacher

## RLS / ownership

### `supabase/10_verify_and_fix_metrics.sql`
- Uso actual:
  - política `select_own_or_academy_or_superadmin`
  - RPC `get_academy_class_reservations`
- Qué se reutiliza:
  - autorización de academy owner para lectura
- Qué falta extender:
  - camino seguro de escritura para marcar `attended`
  - ownership equivalente para teacher
  - evitar depender de `update` directo en cliente

## Frontend actual

### `apps/web/src/components/AddToCalendarWithStats.tsx`
- Uso actual:
  - upsert en `clase_asistencias` con `status: 'tentative'`
  - invalida queries de academy/teacher metrics
- Qué se reutiliza:
  - flujo del alumno para registrar intención
- Qué falta extender:
  - invalidar también queries de alumnos y perfil del alumno

### `apps/web/src/screens/classes/ClassPublicScreen.tsx`
- Uso actual:
  - al iniciar checkout crea o reutiliza booking `tentative`
- Qué se reutiliza:
  - mismo registro fuente antes del pago
- Qué falta extender:
  - mantener compatibilidad sin introducir doble escritura

### `apps/web/src/hooks/useAcademyStudents.ts`
- Uso actual:
  - consume RPCs de alumnos academy
  - ya expone `totalAttended`
- Qué se reutiliza:
  - tipos y mapeo de detalle/listado
- Qué falta extender:
  - incluir `attended` en `classBreakdown`
  - factorizar patrón para teacher y alumno

### `apps/web/src/components/profile/AcademyStudentsPanel.tsx`
- Uso actual:
  - panel de gestión de alumnos academy
- Qué se reutiliza:
  - filtros, listado, selección y layout principal
- Qué falta extender:
  - acción `Marcar como asistió`
  - refresco optimista o invalidación de detalle/listado/métricas

### `apps/web/src/components/profile/academy-metrics/StudentDetailPanel.tsx`
- Uso actual:
  - muestra KPIs, breakdowns e historial del alumno
- Qué se reutiliza:
  - lugar natural para acción administrativa por registro
- Qué falta extender:
  - CTA por fila `tentative -> attended`
  - mostrar KPI explícito de asistencias confirmadas

### `apps/web/src/components/profile/academy-metrics/StudentClassHistoryList.tsx`
- Uso actual:
  - ya traduce `tentative`, `attended`, `asistio`, `asistió`
- Qué se reutiliza:
  - renderizado y badge textual de estado
- Qué falta extender:
  - exponer acción opcional para confirmar asistencia desde filas tentativas

### `apps/web/src/hooks/useAcademyMetrics.ts`
- Uso actual:
  - dashboard de academy
  - sigue centrado en `tentative`
- Qué se reutiliza:
  - estructura global + por clase
- Qué falta extender:
  - KPIs separados `tentative` / `attended`
  - reducir logs de depuración restantes

### `apps/web/src/hooks/useTeacherClassMetrics.ts`
- Uso actual:
  - dashboard de teacher por clase
  - sigue centrado en `tentative`
- Qué se reutiliza:
  - estructura de panel teacher existente
- Qué falta extender:
  - KPIs separados
  - limpieza de logs
  - soporte para futura gestión por alumno

### `apps/web/src/components/profile/TeacherMetricsPanel.tsx`
- Uso actual:
  - muestra métricas globales y por clase para teacher
- Qué se reutiliza:
  - tab existente en editor de teacher
- Qué falta extender:
  - mostrar asistidos reales
  - enlazar o convivir con nueva vista de alumnos

### `apps/web/src/screens/profile/AcademyProfileEditor.tsx`
- Uso actual:
  - tabs `perfil`, `metricas`, `alumnos`
- Qué se reutiliza:
  - superficie lista para gestión administrativa academy
- Qué falta extender:
  - refresco cruzado con métricas cuando cambia estado

### `apps/web/src/screens/profile/TeacherProfileEditor.tsx`
- Uso actual:
  - tabs `perfil`, `metricas`
- Qué se reutiliza:
  - espacio natural para agregar tab `alumnos`
- Qué falta extender:
  - nueva superficie de gestión por alumno

### `apps/web/src/screens/app/Profile.tsx`
- Uso actual:
  - accesos a `Mis RSVPs` y `Mis compras`
- Qué se reutiliza:
  - bloque de navegación del perfil del alumno
- Qué falta extender:
  - acceso a historial de clases por estado

### `apps/web/src/screens/profile/UserProfileEditor.tsx`
- Uso actual:
  - tarjeta de “Eventos y compras”
- Qué se reutiliza:
  - segunda entrada a la vista del alumno
- Qué falta extender:
  - acceso a clases `tentative` / `attended`

### `apps/web/src/hooks/useMyPurchases.ts`
- Uso actual:
  - lista solo `status = 'pagado'` en `clase_asistencias`
- Qué se reutiliza:
  - resolución de nombres academy/teacher
- Qué falta extender:
  - hook paralelo para historial de clases por estado

## Decisión de extensión
- Mantener una sola fila por alumno/clase/sesión.
- El cambio administrativo será una transición de `status`.
- `attended` será el valor canónico nuevo.
- Los valores históricos `asistio` y `asistió` seguirán siendo leídos como equivalentes a `attended`.

## Huecos detectados
- Academy sí tiene gestión por alumno; teacher no.
- Academy students ya soporta `attended` en agregación, pero academy/teacher metrics siguen contando solo `tentative`.
- El perfil del alumno no consume `clase_asistencias` como historial visible.
- No existe todavía un camino administrativo seguro y explícito para confirmar asistencia real.
