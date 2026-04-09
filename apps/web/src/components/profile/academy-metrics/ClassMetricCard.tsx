import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ClassSummary, ClassReservationMetric } from "@/hooks/useAcademyMetrics";

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

function roleLabel(role: string | null | undefined): string {
  if (role === "leader") return "Lead";
  if (role === "follower") return "Follow";
  if (role === "ambos") return "Ambos";
  return "Otro";
}

function statusLabel(status: string | null | undefined): string {
  if (status === "attended") return "Asistio";
  if (status === "pagado") return "Pagado";
  return "Tentativo";
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

export type ClassMetricCardProps = {
  classSummary: ClassSummary;
  isExpanded: boolean;
  onToggle: () => void;
};

export function ClassMetricCard({ classSummary, isExpanded, onToggle }: ClassMetricCardProps) {
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

        <div className="acm-kpi-row">
          <div className="acm-kpi acm-kpi--primary">
            <div className="acm-kpi-value">{unique}</div>
            <div className="acm-kpi-label">Alumnos</div>
          </div>
          <div className="acm-kpi">
            <div className="acm-kpi-value">{classSummary.totalTentative}</div>
            <div className="acm-kpi-label">Tentativos</div>
          </div>
          <div className="acm-kpi">
            <div className="acm-kpi-value">{classSummary.totalAttended}</div>
            <div className="acm-kpi-label">Asistieron</div>
          </div>
          <div className="acm-kpi acm-kpi--purchases">
            <div className="acm-kpi-value">{purchases}</div>
            <div className="acm-kpi-label">Compras</div>
          </div>
        </div>

        <div className="acm-roles">
          {roleTotal === 0 ? (
            <p style={{ margin: 0, fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}>
              Sin rol registrado en esta sesión.
            </p>
          ) : (
            <>
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
                    <AttendeeRow key={r.id} reservation={r} />
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

function AttendeeRow({ reservation }: { reservation: ClassReservationMetric }) {
  const attendDate =
    reservation.classDate &&
    (() => {
      try {
        const d = new Date(reservation.classDate);
        if (!isNaN(d.getTime()) && d.getFullYear() > 1970) {
          return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
        }
      } catch {
        /* noop */
      }
      return null;
    })();

  const registered = new Date(reservation.createdAt).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts: string[] = [roleLabel(reservation.roleType)];
  parts.push(statusLabel(reservation.status));
  if (reservation.zone) parts.push(reservation.zone);
  if (attendDate) parts.push(`Clase ${attendDate}`);
  parts.push(`Registro ${registered}`);

  return (
    <div className="acm-row">
      <div className="acm-row-name">{reservation.userName}</div>
      <div className="acm-row-meta">{parts.join(" · ")}</div>
    </div>
  );
}
