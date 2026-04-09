# Academy global metrics — data audit

This document defines each **global dashboard** metric so numbers are not ambiguous. Implementation: `rpc_get_academy_global_metrics` + `useAcademyMetrics` + `AcademyMetricsPanel`.

---

## Period filter (all attendance-derived metrics below)

- **Field**: `clase_asistencias.created_at` converted to **UTC date** (`(created_at AT TIME ZONE 'utc')::date`).
- **Params**: `p_from`, `p_to` (inclusive). `NULL` means no bound.
- **Rationale**: Matches how the academy list of reservations is filtered in `useAcademyMetrics` (by `created_at`), so KPIs align with the visible table for the same date range.

---

## 1. Clases dadas de alta (`total_classes_registered`)

| Item | Definition |
|------|------------|
| **Name** | Clases en cronograma |
| **Definition** | Count of items in `profiles_academy.cronograma` JSON **array** for this academy. |
| **Tables** | `profiles_academy` |
| **Filters** | `id = p_academy_id`. **Not** filtered by date (inventory / catálogo). |
| **Does NOT use** | `classes_parent`, `classes_session` (not in active academy flow). |
| **Published/active** | Any array element counts; there is no separate “published” flag on cronograma items in this metric. |

---

## 2. Alumnos únicos (`unique_students`)

| Item | Definition |
|------|------------|
| **Name** | Alumnos únicos (período) |
| **Definition** | `COUNT(DISTINCT user_id)` over `clase_asistencias` for this academy in the period. |
| **Status** | `status = 'tentative'` (Stage 1: treated as “asistir” / intent). |
| **Tables** | `clase_asistencias` |
| **Duplication** | Same user across multiple classes/sessions still counts **once** in this KPI. |

---

## 3. Asistencias registradas — volumen total (`total_attendance_records`)

| Item | Definition |
|------|------------|
| **Name** | Total de registros de asistencia (período) |
| **Definition** | `COUNT(*)` of rows matching the same filter as unique students. |
| **Difference vs unique** | Same user can appear **multiple times** (several sessions/classes). |
| **Status** | `tentative` = “asistir” for this stage (compatible with existing product). |

---

## 4. Sesiones con reservas (`sessions_with_reservations`)

| Item | Definition |
|------|------------|
| **Name** | Sesiones con al menos una reserva |
| **Definition** | `COUNT(DISTINCT (class_id, coalesce(fecha_especifica, '0001-01-01')))` on filtered tentative rows. |
| **Rationale** | Session unit = `class_id` + `fecha_especifica`; NULL dates group under a sentinel so legacy rows still dedupe per class. |
| **Not** | Total reservation volume; not “number of classes” without session grain. |

---

## 5. Distribución por rol (`role_breakdown`)

| Item | Definition |
|------|------------|
| **Source** | `role_baile` on each filtered `tentative` row. |
| **Buckets** | See `ACADEMY_GLOBAL_METRICS_ROLE_SEGMENTATION.md`. |
| **Type** | Row counts per bucket (not unique users per role in this RPC). |

---

## 6. Zonas (`zone_breakdown`)

| Item | Definition |
|------|------------|
| **Source** | `clase_asistencias.zona_tag_id` joined to `tags` where `tags.tipo = 'zona'`. |
| **Per zone** | `attendance_count` (rows), `unique_students` (distinct `user_id`) in period. |
| **Missing zone** | Rows with `NULL` or non-zona tags are excluded from this breakdown. |
| **Not** | User profile home zone unless that zone was copied into the attendance row at write time. |

---

## 7. Compras (`totalPurchases` in UI)

| Item | Definition |
|------|------------|
| **Current behavior** | Still computed in `useAcademyMetrics`: count of `clase_asistencias` with `status = 'pagado'` for the academy (**not** scoped to the date filter in the hook today). |
| **Documented intent** | “Total pagos registrados” (historical/all-time in current code). |

---

## SQL entry point

```sql
select public.rpc_get_academy_global_metrics(:academy_id, :from_date, :to_date);
```

Returns a single `jsonb` object with the fields above plus nested `role_breakdown` and `zone_breakdown` array.
