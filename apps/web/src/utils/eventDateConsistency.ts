export type EventDateLike = {
  id?: number | string;
  parent_id?: number | null;
  fecha?: string | null;
  fecha_inicio?: string | null;
  dia_semana?: number | null;
};

export type EventDateBackfillIssue =
  | { id: number | string | null; parent_id: number | null; kind: "missing_fecha" }
  | { id: number | string | null; parent_id: number | null; kind: "duplicate_fecha"; fecha: string; withIds: Array<number | string> }
  | { id: number | string | null; parent_id: number | null; kind: "weekday_mismatch"; fecha: string; dia_semana: number; weekday: number }
  | { id: number | string | null; parent_id: number | null; kind: "invalid_fecha"; raw: any };

export type EventParentDateType = "specific" | "frequent" | "recurrent_weekly" | "mixed" | "unknown";

export type EventParentDateAudit = {
  parent_id: number | null;
  inferredType: EventParentDateType;
  totalDates: number;
  uniqueFechas: number;
  duplicateFechas: Array<{ fecha: string; ids: Array<number | string> }>;
  missingFechaIds: Array<number | string>;
  weekdayMismatches: Array<{ id: number | string; fecha: string; dia_semana: number; weekday: number }>;
  issues: EventDateBackfillIssue[];
  needsBackfill: boolean;
};

export function normalizeYmd(fechaRaw: any): string | null {
  if (!fechaRaw) return null;
  const plain = String(fechaRaw).split("T")[0]?.trim();
  if (!plain) return null;
  // Simple validation: YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(plain)) return null;
  return plain;
}

export function weekdayFromYmd(ymd: string): number | null {
  try {
    const [y, m, d] = ymd.split("-").map((p) => parseInt(p, 10));
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    // Noon UTC to avoid TZ rollover; weekday should match the civil date.
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const wd = dt.getUTCDay();
    return typeof wd === "number" ? wd : null;
  } catch {
    return null;
  }
}

export function inferParentDateType(dates: EventDateLike[]): EventParentDateType {
  if (!Array.isArray(dates) || dates.length === 0) return "unknown";
  const anyRecurring = dates.some((d) => typeof (d as any)?.dia_semana === "number");
  if (anyRecurring) return dates.length > 1 ? "mixed" : "recurrent_weekly";
  return dates.length > 1 ? "frequent" : "specific";
}

export function auditEventParentDates(parent_id: number | null, dates: EventDateLike[]): EventParentDateAudit {
  const safeDates = Array.isArray(dates) ? dates : [];
  const inferredType = inferParentDateType(safeDates);

  const fechaToIds = new Map<string, Array<number | string>>();
  const missingFechaIds: Array<number | string> = [];
  const weekdayMismatches: Array<{ id: number | string; fecha: string; dia_semana: number; weekday: number }> = [];
  const issues: EventDateBackfillIssue[] = [];

  safeDates.forEach((row) => {
    const id = (row as any)?.id ?? null;
    const fechaRaw = (row as any)?.fecha ?? (row as any)?.fecha_inicio ?? null;
    const ymd = normalizeYmd(fechaRaw);

    if (!fechaRaw) {
      if (id != null) missingFechaIds.push(id);
      issues.push({ id, parent_id, kind: "missing_fecha" });
      return;
    }

    if (!ymd) {
      issues.push({ id, parent_id, kind: "invalid_fecha", raw: fechaRaw });
      return;
    }

    const arr = fechaToIds.get(ymd) ?? [];
    arr.push(id ?? `unknown_${Math.random().toString(16).slice(2)}`);
    fechaToIds.set(ymd, arr);

    const dia = (row as any)?.dia_semana;
    if (typeof dia === "number") {
      const weekday = weekdayFromYmd(ymd);
      if (typeof weekday === "number" && weekday !== dia) {
        if (id != null) weekdayMismatches.push({ id, fecha: ymd, dia_semana: dia, weekday });
        issues.push({ id, parent_id, kind: "weekday_mismatch", fecha: ymd, dia_semana: dia, weekday });
      }
    }
  });

  const duplicateFechas: Array<{ fecha: string; ids: Array<number | string> }> = [];
  fechaToIds.forEach((ids, fecha) => {
    if (ids.length > 1) {
      duplicateFechas.push({ fecha, ids });
      ids.forEach((id) => {
        issues.push({ id, parent_id, kind: "duplicate_fecha", fecha, withIds: ids.filter((x) => x !== id) });
      });
    }
  });

  const uniqueFechas = fechaToIds.size;
  const needsBackfill = issues.length > 0;

  return {
    parent_id,
    inferredType,
    totalDates: safeDates.length,
    uniqueFechas,
    duplicateFechas,
    missingFechaIds,
    weekdayMismatches,
    issues,
    needsBackfill,
  };
}

export function auditEventDatesByParent(dates: EventDateLike[]): Map<number | null, EventParentDateAudit> {
  const byParent = new Map<number | null, EventDateLike[]>();
  (dates || []).forEach((d) => {
    const pid = typeof (d as any)?.parent_id === "number" ? ((d as any).parent_id as number) : null;
    const arr = byParent.get(pid) ?? [];
    arr.push(d);
    byParent.set(pid, arr);
  });

  const audits = new Map<number | null, EventParentDateAudit>();
  byParent.forEach((rows, pid) => {
    audits.set(pid, auditEventParentDates(pid, rows));
  });
  return audits;
}

