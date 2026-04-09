# Academy Class Metrics Stage 1 Audit

## Scope

Audit focused on current class attendance and academy metrics behavior in:

- `apps/web/src/screens/classes/ClassPublicScreen.tsx`
- `apps/web/src/components/AddToCalendarWithStats.tsx`
- `apps/web/src/hooks/useAcademyMetrics.ts`
- `apps/web/src/components/profile/AcademyMetricsPanel.tsx`
- SQL objects in `supabase/` and `supabase/migrations/` (`clase_asistencias`, `get_academy_class_reservations`, `get_academy_class_metrics`)

## Real Entities and Current Model

### Class entities

Current production flow in this repo does not use `class_session_id` for attendance/metrics.

- Class definitions come from `profiles_academy.cronograma` (JSON) and `profiles_teacher.cronograma`.
- `class_id` in attendance is used as the class reference key.

`classes_parent` / `classes_session` are not the active source for academy metrics in the audited web flow.

### Attendance / intent table

Main table: `public.clase_asistencias`

Relevant columns used by app:

- `user_id`
- `class_id`
- `academy_id`
- `teacher_id`
- `role_baile`
- `zona_tag_id`
- `status` (currently `tentative` for "asistir" intent)
- `fecha_especifica`
- `created_at`

### Reservations currently used

Reservations in academy metrics are read via:

- RPC: `public.get_academy_class_reservations(p_academy_id)`

This is the current practical source for per-user rows shown in academy metrics UI.

## Exact Session Unit Detection

### What represents an exact session today

In the current model, exact session is represented by:

- `class_id` + `fecha_especifica`

If `fecha_especifica` is null, data behaves as generic or legacy class-attendance rows.

### Current "asistir" persistence path

From class public screen (`ClassPublicScreen`) attendance intent is persisted through `AddToCalendarWithStats` into `clase_asistencias`.

Before Stage 1 fixes, there was inconsistency:

- Calendar/attendance path used synthetic class ids in some flows.
- Payment path inserted with `selectedClass.id`.

This could split counts across different `class_id` values for what should be the same class/session.

## Current Metrics Computation

### Academy metrics UI

`AcademyMetricsPanel` uses `useAcademyMetrics`.

`useAcademyMetrics` currently:

- reads reservation rows (`get_academy_class_reservations` or fallback direct query),
- enriches class labels via `profiles_academy.cronograma`,
- aggregates mostly by class/day heuristics.

### Why metrics were not reliably session-exact

1. **Class key mismatch between flows**
   - Attendance and payment could write different `class_id`s.
2. **Session grouping heuristic**
   - Grouping used class/day heuristic, not always strict class/session identity.
3. **Invalidation mismatch**
   - Attendance actions invalidated keys not always matching consumed academy metrics query keys.
4. **Uniqueness gap for null dates**
   - Unique constraints with nullable `fecha_especifica` can allow duplicate logical rows for `(user_id, class_id, null)` without an expression-level uniqueness strategy.

## Stage 1 Decision (Confirmed)

Stage 1 unit for exact session:

- `class_id + fecha_especifica`

Status compatibility:

- keep `status = 'tentative'` and treat as "asistir" in product for this stage.

## Stage 1 Corrections Implemented

### Frontend flow alignment

- `ClassPublicScreen` now computes:
  - stable `class_id` (real item id when available; deterministic fallback otherwise),
  - exact session date (`YYYY-MM-DD`) and sends it as `fecha` to attendance flow.
- Payment insert/upsert now uses the same session key:
  - `user_id + class_id + fecha_especifica`

### Attendance write behavior

- `AddToCalendarWithStats` keeps upsert conflict on:
  - `user_id,class_id,fecha_especifica`
- Session count query now respects exact `fecha` when provided.

### Metrics read behavior

- `useAcademyMetrics` now groups by session key (class + date, with legacy fallback split by day/time).
- `AcademyMetricsPanel` expansion state now uses session key instead of plain class id to avoid collisions across sessions of same class.

### New optimized session metrics RPC

Added migration with:

- `rpc_get_academy_class_metrics(p_academy_id, p_from, p_to)` returning per-session aggregated metrics (`class_id`, `class_session_date`, class/day/time labels, role counts, total).

Also added:

- dedup cleanup,
- stronger session uniqueness index using expression with `coalesce(fecha_especifica, '0001-01-01')`,
- supporting read indexes (`class_id`, `status`, `fecha_especifica` combinations).

## Summary

The root issue was not lack of attendance rows, but inconsistent identity and grouping granularity.

With Stage 1, attendance and metrics are aligned to exact session semantics using the existing model:

- write unit: `user_id + class_id + fecha_especifica`
- read unit: session-level aggregation
- UI: session-aware grouping and expansion

This provides a reliable base for future phases (`asistir` dedicated status, cancelation/check-in, capacity enforcement, and stronger class_session_id adoption if desired).

## Functional Validation (Stage 1)

### Executed checks

- Lint diagnostics on touched frontend files: no new linter errors.
- TypeScript typecheck run (`apps/web` workspace): failing due pre-existing project-wide errors outside Stage 1 touched files.

### Validated scenarios against implementation

1. **Exact session write key**
   - `ClassPublicScreen` now resolves a stable `class_id` and exact `fecha_especifica` before attendance/payment writes.
2. **No duplicate same user/session**
   - Frontend writes use upsert conflict key `user_id,class_id,fecha_especifica`.
   - DB migration adds expression-based uniqueness for null/non-null session date cases.
3. **No cross-session contamination in metrics panel**
   - `useAcademyMetrics` grouping key is session-level (not plain class-level).
   - Panel expansion key is `sessionKey` (not `classId`), so separate sessions are isolated.
4. **Academy metrics refresh after "asistir"**
   - Attendance CTA now invalidates both `academy-class-metrics` and `academy-metrics` query families.
5. **Session-level optimized aggregation source**
   - New RPC `rpc_get_academy_class_metrics` returns per-session totals and role distribution.

### SQL smoke-test queries (recommended in Supabase SQL editor)

```sql
-- 1) Verify no duplicate rows for logical session key
select user_id, class_id, coalesce(fecha_especifica, '0001-01-01'::date) as session_date, count(*)
from public.clase_asistencias
group by 1,2,3
having count(*) > 1;

-- 2) Verify session-level metrics output
select *
from public.rpc_get_academy_class_metrics(<academy_id>, null, null)
order by class_session_date nulls last, class_name;
```

