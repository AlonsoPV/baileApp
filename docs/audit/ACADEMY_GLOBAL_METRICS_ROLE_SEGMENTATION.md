# Academy global metrics — role segmentation

## Source of truth

- Column: `public.clase_asistencias.role_baile` (text, nullable).
- Written from: user profile `rol_baile` at the time of “asistir” / add-to-calendar (and similar flows).

## Segments (product labels)

| Segment (UI) | DB values counted | Definition |
|--------------|-------------------|------------|
| **Lead** | `lead`, `leader` | Usuario declara rol de **caballo / líder** (sinónimos legacy). |
| **Follow** | `follow`, `follower` | Usuario declara rol de **seguidora / follower** (sinónimos legacy). |
| **Ambos** | `ambos` | Usuario declara que baila **ambos roles**. |
| **Otros** | `NULL` or any other string | Sin rol reconocible o valor heredado/desconocido. |

## Normalization logic (aligned with app)

```text
IF role_baile IN ('lead', 'leader')   → Lead
IF role_baile IN ('follow', 'follower') → Follow
IF role_baile = 'ambos'                 → Ambos
ELSE                                    → Otros
```

## Data source for dashboard counts

- **Per registration row**: each `clase_asistencias` row with `status = 'tentative'` in the selected period contributes **one** count to exactly one role bucket (row-level, not user-level).
- **Percentages** in UI: `bucket_count / total_attendance_records_in_period * 100` when total > 0.

## Edge cases

1. **User changes `rol_baile` later**  
   Old rows keep the value stored at write time; global role distribution reflects **historical snapshots**, not current profile.

2. **Typos or new values in DB**  
   Any value outside the known sets falls into **Otros** until explicitly mapped in code/SQL.

3. **Lead vs Leader naming**  
   UI may say “Lead”; storage may say `leader`. Both map to the same segment.

4. **Ambos vs counting unique users**  
   Role breakdown is **volumen de registros**, not “usuarios únicos por rol”. Unique users is a separate KPI (`unique_students`).

## RPC field mapping

`rpc_get_academy_global_metrics` returns:

- `role_breakdown.lead` ← `lead` + `leader`
- `role_breakdown.follow` ← `follow` + `follower`
- `role_breakdown.ambos` ← `ambos`
- `role_breakdown.other` ← null + otros
