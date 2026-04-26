import React from "react";
import type { StudentDetail } from "@/hooks/useAcademyStudents";
import { StudentClassHistoryList } from "@/components/profile/academy-metrics/StudentClassHistoryList";

type Props = {
  detail: StudentDetail | null;
  loading: boolean;
  errorMessage?: string;
  onClose: () => void;
  /** Estilo plano para usar dentro de modal (sin caja anidada). */
  embedInModal?: boolean;
  /** Permite editar asistencia/pago en el historial (academia: solo Premium). */
  academyId?: number;
  teacherId?: number;
  canEditAttendancePayment?: boolean;
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

export function StudentDetailPanel({
  detail,
  loading,
  errorMessage,
  onClose,
  embedInModal,
  academyId,
  teacherId,
  canEditAttendancePayment,
}: Props) {
  return (
    <div
      className={`students-detail-panel${embedInModal ? " students-detail-panel--embed" : ""}`}
    >
      <div className="students-detail-head students-detail-head--app">
        <div className="students-detail-identity">
          {detail ? (
            <>
              <h4 className="students-detail-name">{detail.student.name}</h4>
              {detail.student.email ? <p className="students-detail-email">{detail.student.email}</p> : null}
            </>
          ) : (
            <h4 className="students-detail-name">Alumno</h4>
          )}
        </div>
        {embedInModal ? null : (
          <button type="button" className="students-detail-close" onClick={onClose}>
            Cerrar
          </button>
        )}
      </div>

      {loading ? <div className="students-detail-empty">Cargando detalle...</div> : null}

      {!loading && errorMessage ? (
        <div className="students-detail-empty students-detail-error">{errorMessage}</div>
      ) : null}

      {!loading && !errorMessage && detail ? (
        <>
          <div className="students-detail-kpi-strip" aria-label="Resumen del alumno">
            <div className="students-detail-kpi-pill">
              <span>Registros</span>
              <strong>{detail.metrics.totalRecords}</strong>
            </div>
            <div className="students-detail-kpi-pill">
              <span>Asistencias</span>
              <strong>{detail.metrics.totalAttended}</strong>
            </div>
            <div className="students-detail-kpi-pill">
              <span>Pagos</span>
              <strong>{detail.metrics.totalPaid}</strong>
            </div>
          </div>

          {detail.metrics.lastActivityAt || detail.metrics.lastClassName ? (
            <p className="students-detail-one-liner">
              {detail.metrics.lastActivityAt ? (
                <span>Última act. {formatDateTime(detail.metrics.lastActivityAt)}</span>
              ) : null}
              {detail.metrics.lastClassName ? (
                <span>
                  {detail.metrics.lastActivityAt ? " · " : ""}
                  {detail.metrics.lastClassName}
                </span>
              ) : null}
            </p>
          ) : null}

          <div className="students-detail-section students-detail-section--flat">
            <h5>Historial</h5>
            <StudentClassHistoryList
              history={detail.history}
              academyId={academyId}
              teacherId={teacherId}
              canEditAttendancePayment={canEditAttendancePayment}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
