import React from "react";
import type { StudentDetail, StudentHistoryItem } from "@/hooks/useAcademyStudents";
import { StudentClassHistoryList } from "@/components/profile/academy-metrics/StudentClassHistoryList";

type Props = {
  detail: StudentDetail | null;
  loading: boolean;
  errorMessage?: string;
  onClose: () => void;
  onMarkAttended?: (item: StudentHistoryItem) => void;
  markingId?: number | null;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function toPairs(data: Record<string, number>) {
  return Object.entries(data).sort(([, a], [, b]) => b - a);
}

export function StudentDetailPanel({
  detail,
  loading,
  errorMessage,
  onClose,
  onMarkAttended,
  markingId = null,
}: Props) {
  return (
    <div className="students-detail-panel">
      <div className="students-detail-head">
        <div>
          <h4>Detalle de alumno</h4>
          {detail ? (
            <p>
              {detail.student.name}
              {detail.student.email ? ` · ${detail.student.email}` : ""}
            </p>
          ) : null}
        </div>
        <button type="button" className="students-detail-close" onClick={onClose}>
          Cerrar
        </button>
      </div>

      {loading ? <div className="students-detail-empty">Cargando detalle...</div> : null}

      {!loading && errorMessage ? (
        <div className="students-detail-empty students-detail-error">{errorMessage}</div>
      ) : null}

      {!loading && !errorMessage && detail ? (
        <>
          <div className="students-detail-kpis">
            <div className="students-detail-kpi">
              <span>Registros</span>
              <strong>{detail.metrics.totalRecords}</strong>
            </div>
            <div className="students-detail-kpi">
              <span>Reservas</span>
              <strong>{detail.metrics.totalReservations}</strong>
            </div>
            <div className="students-detail-kpi">
              <span>Compras</span>
              <strong>{detail.metrics.totalPaid}</strong>
            </div>
            <div className="students-detail-kpi">
              <span>Asistio</span>
              <strong>{detail.metrics.totalAttended}</strong>
            </div>
            <div className="students-detail-kpi">
              <span>Clases distintas</span>
              <strong>{detail.metrics.distinctClasses}</strong>
            </div>
          </div>

          <div className="students-detail-meta-grid">
            <div>
              <label>Primera actividad</label>
              <p>{formatDateTime(detail.metrics.firstActivityAt)}</p>
            </div>
            <div>
              <label>Última actividad</label>
              <p>{formatDateTime(detail.metrics.lastActivityAt)}</p>
            </div>
            <div>
              <label>Última clase</label>
              <p>{detail.metrics.lastClassName || "—"}</p>
            </div>
            <div>
              <label>Sesiones distintas</label>
              <p>{detail.metrics.distinctSessions}</p>
            </div>
          </div>

          <div className="students-detail-breakdowns">
            <div>
              <h5>Estado</h5>
              <ul>
                {toPairs(detail.statusBreakdown).map(([key, value]) => (
                  <li key={key}>
                    <span>{key}</span>
                    <strong>{value}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5>Roles</h5>
              <ul>
                {toPairs(detail.roleBreakdown).map(([key, value]) => (
                  <li key={key}>
                    <span>{key}</span>
                    <strong>{value}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5>Zonas</h5>
              <ul>
                {toPairs(detail.zoneBreakdown).map(([key, value]) => (
                  <li key={key}>
                    <span>{key}</span>
                    <strong>{value}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="students-detail-section">
            <h5>Historial de clases</h5>
            <StudentClassHistoryList history={detail.history} onMarkAttended={onMarkAttended} markingId={markingId} />
          </div>
        </>
      ) : null}
    </div>
  );
}
