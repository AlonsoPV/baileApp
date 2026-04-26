import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ClassSummary, ClassReservationMetric, ClassReservationPaymentType } from "@/hooks/useAcademyMetrics";
import {
  useUpdateClaseAsistenciaFlags,
  type ClaseAsistenciaPaymentType,
} from "@/hooks/useClassAttendanceActions";

const INITIAL_ATTENDEES_VISIBLE = 10;

function splitClassDisplayName(full: string): { title: string; scheduleHint: string | null } {
  const idx = full.indexOf(" - ");
  if (idx === -1) return { title: full.trim(), scheduleHint: null };
  return { title: full.slice(0, idx).trim(), scheduleHint: full.slice(idx + 3).trim() };
}

function capitalizeEs(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatCompactDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return null;
    return d.toLocaleDateString("es-MX", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function formatLongDateLabel(fechaKey: string): string {
  if (fechaKey === "sin-fecha") return "Sin fecha específica";
  try {
    const d = new Date(fechaKey);
    if (!isNaN(d.getTime()) && d.getFullYear() > 1970) {
      return d.toLocaleDateString("es-MX", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
  } catch {
    /* noop */
  }
  return fechaKey;
}

function uniqueUserCount(reservations: ClassReservationMetric[]): number {
  return new Set(reservations.map((r) => r.userId)).size;
}

type FlatRow = { fechaKey: string; fechaDisplay: string; r: ClassReservationMetric };

function buildOrderedRows(summary: ClassSummary): FlatRow[] {
  const datesMap = summary.reservationsByDate || new Map();
  const keys = Array.from(datesMap.keys())
    .filter((k) => k !== "sin-fecha")
    .sort((a, b) => {
      try {
        return new Date(a).getTime() - new Date(b).getTime();
      } catch {
        return 0;
      }
    });
  if (datesMap.has("sin-fecha")) keys.push("sin-fecha");

  const out: FlatRow[] = [];
  for (const fechaKey of keys) {
    const list = datesMap.get(fechaKey) || [];
    if (!list.length) continue;
    const fechaDisplay = formatLongDateLabel(fechaKey);
    for (const r of list) {
      out.push({ fechaKey, fechaDisplay, r });
    }
  }
  return out;
}

function mapPaymentType(t: ClassReservationPaymentType | null | undefined): ClaseAsistenciaPaymentType {
  if (t === "package" || t === "other" || t === "class") return t;
  return "class";
}

export type ClassMetricCardProps = {
  classSummary: ClassSummary;
  isExpanded: boolean;
  onToggle: () => void;
  academyId: number;
  canEditAttendanceAndPayment?: boolean;
};

export function ClassMetricCard({
  classSummary,
  isExpanded,
  onToggle,
  academyId,
  canEditAttendanceAndPayment = false,
}: ClassMetricCardProps) {
  const [showAllAttendees, setShowAllAttendees] = React.useState(false);

  React.useEffect(() => {
    if (!isExpanded) setShowAllAttendees(false);
  }, [isExpanded]);

  const { title, scheduleHint } = splitClassDisplayName(classSummary.className);
  const dateCompact = formatCompactDate(classSummary.classDate);

  const fallbackSchedule =
    classSummary.diaSemanaNombre && classSummary.timeLabel
      ? `${capitalizeEs(classSummary.diaSemanaNombre)} · ${classSummary.timeLabel}`
      : classSummary.timeLabel ||
        (classSummary.diaSemanaNombre ? capitalizeEs(classSummary.diaSemanaNombre) : null);

  const scheduleLine = scheduleHint || fallbackSchedule;

  const unique = uniqueUserCount(classSummary.reservations);
  const purchases = classSummary.totalPurchases ?? 0;
  const posibles = classSummary.totalAsistentes ?? 0;

  const byRole = classSummary.byRole;
  const leader = byRole.leader || 0;
  const follower = byRole.follower || 0;
  const ambos = byRole.ambos || 0;
  const otro = byRole.otro || 0;
  const roleTotal = leader + follower + ambos + otro;
  const pct = (n: number) => (roleTotal > 0 ? (n / roleTotal) * 100 : 0);

  const flatRows = React.useMemo(() => buildOrderedRows(classSummary), [classSummary]);
  const totalRows = flatRows.length;
  const limited = !showAllAttendees && totalRows > INITIAL_ATTENDEES_VISIBLE;
  const visibleRows = limited ? flatRows.slice(0, INITIAL_ATTENDEES_VISIBLE) : flatRows;
  const hiddenRows = totalRows - visibleRows.length;

  const rowsByDate = React.useMemo(() => {
    const m = new Map<string, FlatRow[]>();
    for (const row of visibleRows) {
      const arr = m.get(row.fechaKey) || [];
      arr.push(row);
      m.set(row.fechaKey, arr);
    }
    return m;
  }, [visibleRows]);

  const dateKeysOrdered = React.useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const row of visibleRows) {
      if (!seen.has(row.fechaKey)) {
        seen.add(row.fechaKey);
        order.push(row.fechaKey);
      }
    }
    return order;
  }, [visibleRows]);

  return (
    <motion.div
      className={`acm-card${isExpanded ? " acm-card--open" : ""}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button type="button" className="acm-toggle" aria-expanded={isExpanded} onClick={onToggle}>
        <div className="acm-toggle-top">
          <div className="acm-identity">
            <h4 className="acm-title">{title}</h4>
            <p className="acm-subtitle">
              {scheduleLine ? (
                <>
                  <strong>{scheduleLine}</strong>
                  {dateCompact ? (
                    <>
                      {" "}
                      <span style={{ opacity: 0.45 }}>·</span> {dateCompact}
                    </>
                  ) : null}
                </>
              ) : dateCompact ? (
                <strong>{dateCompact}</strong>
              ) : (
                <span style={{ opacity: 0.55 }}>Sesión sin horario en datos</span>
              )}
            </p>
          </div>
          <span className="acm-chevron" aria-hidden>
            ▼
          </span>
        </div>

        <div className="acm-scan-metrics" aria-label="Métricas de la sesión">
          <div className="acm-scan-line">
            <span aria-hidden>👥</span>
            <span>
              <strong>{posibles}</strong> posibles asistencias
            </span>
          </div>
          <div className="acm-scan-line acm-scan-line--sub">
            RSVP o agenda: intención de ir; no implica que vayan.
          </div>
          {unique > 0 && unique !== posibles ? (
            <div className="acm-scan-line acm-scan-line--sub">
              {unique} alumno{unique === 1 ? "" : "s"} único{unique === 1 ? "" : "s"} (más de una marca por persona)
            </div>
          ) : null}
          {purchases > 0 ? (
            <div className="acm-scan-line acm-scan-line--muted">
              💳 {purchases} pago{purchases === 1 ? "" : "s"} registrado{purchases === 1 ? "" : "s"}
            </div>
          ) : null}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="acm-detail"
          >
            <div className="acm-detail-head">
              <h5 className="acm-detail-title">Asistentes</h5>
              <span className="acm-detail-count">{totalRows} en lista</span>
            </div>

            <div className="acm-roles" style={{ padding: "0 0 0.85rem" }}>
              {roleTotal === 0 ? (
                <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>
                  Sin rol de baile registrado en esta sesión.
                </p>
              ) : (
                <>
                  <div className="acm-detail-title" style={{ padding: "0 0 0.5rem", letterSpacing: "0.06em" }}>
                    Roles (baile)
                  </div>
                  <div className="acm-role-bar" aria-hidden>
                    <span style={{ width: `${pct(leader)}%`, background: "rgba(120, 170, 230, 0.55)" }} />
                    <span style={{ width: `${pct(follower)}%`, background: "rgba(210, 185, 120, 0.5)" }} />
                    <span style={{ width: `${pct(ambos)}%`, background: "rgba(130, 190, 145, 0.5)" }} />
                    <span style={{ width: `${pct(otro)}%`, background: "rgba(255,255,255,0.18)" }} />
                  </div>
                  <div className="acm-role-legend">
                    <span>
                      Lead <i>{leader}</i>
                    </span>
                    <span>
                      Follow <i>{follower}</i>
                    </span>
                    <span>
                      Ambos <i>{ambos}</i>
                    </span>
                    <span>
                      Otros <i>{otro}</i>
                    </span>
                  </div>
                </>
              )}
            </div>

            {dateKeysOrdered.map((fechaKey) => {
              const rows = rowsByDate.get(fechaKey) || [];
              if (!rows.length) return null;
              const sample = rows[0];
              return (
                <div key={fechaKey}>
                  <div className="acm-date-divider">
                    {sample.fechaDisplay}
                    <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.28)", marginLeft: "0.35rem" }}>
                      ({rows.length})
                    </span>
                  </div>
                  {rows.map(({ r }) => (
                    <AttendeeRow
                      key={r.id}
                      reservation={r}
                      academyId={academyId}
                      canEditAttendanceAndPayment={canEditAttendanceAndPayment}
                    />
                  ))}
                </div>
              );
            })}

            {limited && hiddenRows > 0 ? (
              <button type="button" className="acm-more-btn" onClick={() => setShowAllAttendees(true)}>
                Ver todos ({hiddenRows} más)
              </button>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AttendeeRow({
  reservation,
  academyId,
  canEditAttendanceAndPayment,
}: {
  reservation: ClassReservationMetric;
  academyId: number;
  canEditAttendanceAndPayment: boolean;
}) {
  const update = useUpdateClaseAsistenciaFlags(
    canEditAttendanceAndPayment ? { academyId } : undefined,
  );
  const busy = update.isPending;
  const busyHere = busy && String(update.variables?.attendanceId) === String(reservation.id);
  const disabled = !canEditAttendanceAndPayment || busyHere;

  const onAttendanceChange = (next: boolean) => {
    update.mutate({
      attendanceId: reservation.id,
      attended: next,
      paid: reservation.paid,
      paymentType: reservation.paid ? mapPaymentType(reservation.paymentType) : null,
    });
  };

  const onPaidClick = () => {
    if (reservation.paid) {
      update.mutate({
        attendanceId: reservation.id,
        attended: reservation.attended,
        paid: false,
        paymentType: null,
      });
      return;
    }
    update.mutate({
      attendanceId: reservation.id,
      attended: reservation.attended,
      paid: true,
      paymentType: mapPaymentType(reservation.paymentType),
    });
  };

  return (
    <div
      className={`acm-row acm-row--std${busyHere ? " acm-row--updating" : ""}`}
      data-attendance-id={reservation.id}
    >
      <div className="acm-row-std__name">{reservation.userName}</div>
      <div className="acm-row-std__controls">
        <div className="acm-std-ctl">
          <span className="acm-std-ctl__lbl" id={`att-lbl-${reservation.id}`}>
            Asistió
          </span>
          <button
            type="button"
            role="switch"
            className="acm-switch"
            aria-checked={reservation.attended}
            aria-labelledby={`att-lbl-${reservation.id}`}
            disabled={disabled}
            onClick={() => onAttendanceChange(!reservation.attended)}
          >
            <span className="acm-switch__track">
              <span className="acm-switch__thumb" />
            </span>
            <span className="acm-std-ctl__hint">{reservation.attended ? "Sí" : "No"}</span>
          </button>
        </div>
        <div className="acm-std-ctl acm-std-ctl--pay">
          <button
            type="button"
            className={`acm-pay-btn${reservation.paid ? " acm-pay-btn--on" : ""}`}
            disabled={disabled}
            onClick={onPaidClick}
            aria-pressed={reservation.paid}
          >
            💰 {reservation.paid ? "Pagado" : "Sin pago"}
          </button>
        </div>
        {!canEditAttendanceAndPayment ? (
          <span className="acm-std-ctl__premium-hint">Registro en métricas: plan Premium.</span>
        ) : null}
      </div>
    </div>
  );
}
