# ACADEMY STUDENTS METRICS AUDIT

## Scope

This document audits the new academy management layer focused on students, complementary to existing class/session metrics.

Implemented scope:

- Data layer centralized in Supabase RPCs for student list, student detail and global student KPIs.
- New academy editor tab for students (`Perfil | Métricas clases | Alumnos`).
- Mobile-first students panel with filters, KPI cards, student list, and student detail drill-down.
- Historical class trajectory by student using real attendance/reservation records.

## Source of truth

The full student module is built from `public.clase_asistencias` and its relational keys:

- `user_id`
- `class_id`
- `fecha_especifica`
- `status`

No manual aggregates are persisted in frontend state as source of truth.

## Data-layer deliverables

Migration added:

- `supabase/migrations/20260410120000_rpc_academy_students_metrics.sql`

RPCs added:

1. `rpc_get_academy_students_list(p_academy_id, p_from, p_to, p_search, p_role, p_zone, p_segment, p_limit, p_offset)`
2. `rpc_get_academy_student_detail(p_academy_id, p_user_id, p_from, p_to)`
3. `rpc_get_academy_students_global_metrics(p_academy_id, p_from, p_to)`

Security model:

- `security definer`
- owner/superadmin guard through `is_academy_owner(...)` + `role_requests`
- `grant execute ... to authenticated`

## Frontend deliverables

Hook layer:

- `apps/web/src/hooks/useAcademyStudents.ts`
  - `useAcademyStudentsGlobalMetrics`
  - `useAcademyStudentsList`
  - `useAcademyStudentDetail`

UI layer:

- `apps/web/src/components/profile/AcademyStudentsPanel.tsx`
- `apps/web/src/components/profile/academy-metrics/StudentMetricCard.tsx`
- `apps/web/src/components/profile/academy-metrics/StudentDetailPanel.tsx`
- `apps/web/src/components/profile/academy-metrics/StudentClassHistoryList.tsx`

Integration:

- `apps/web/src/screens/profile/AcademyProfileEditor.tsx`
  - Added tab `Alumnos`
  - Lazy-loaded students panel

## Functional validation checklist

Implemented behavior to validate:

1. Student appears from real `clase_asistencias` records in selected date range.
2. Student list is deduplicated by `user_id` (single row per student).
3. Student detail history matches records per student (`class_id`, `fecha_especifica`, `status`, timestamps).
4. Filters apply over list and KPIs:
   - role
   - zone
   - segment (`active`, `new`, `recurrent`, `with_history`)
   - date range
5. Status split is present in global KPIs and per-student metrics.
6. Mobile layout remains scannable:
   - compact KPI cards
   - compact student rows
   - drill-down detail panel

## Technical validation run

- Lint diagnostics checked on all new/edited students files: no linter errors reported.
- TypeScript check executed and filtered against edited students files: no new type errors reported in those files.
- Existing repository-wide TypeScript errors outside this scope may still exist.

## Smoke test SQL snippets (manual)

```sql
select public.rpc_get_academy_students_global_metrics(<academy_id>, null, null);
```

```sql
select * from public.rpc_get_academy_students_list(<academy_id>, null, null, null, null, null, null, 50, 0);
```

```sql
select public.rpc_get_academy_student_detail(<academy_id>, '<user_uuid>'::uuid, null, null);
```

## Notes

- Segment definitions are centralized in SQL and can be tuned without duplicating frontend logic.
- Class naming in student history uses academy `cronograma` mapping with legacy fallbacks, aligned with existing class metrics strategy.
