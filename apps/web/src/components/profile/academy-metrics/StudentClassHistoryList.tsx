import React from "react";
import type { StudentHistoryItem, StudentHistoryPaymentType } from "@/hooks/useAcademyStudents";
import { useUpdateClaseAsistenciaFlags, type ClaseAsistenciaPaymentType } from "@/hooks/useClassAttendanceActions";

type Props = {
  history: StudentHistoryItem[];
  academyId?: number;
  teacherId?: number;
  /** Con academia: requiere Premium para editar. Con maestro: no aplica. */
  canEditAttendancePayment?: boolean;
};

function formatDate(value: string | null): string {
  if (!value) return "Sin fecha";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("es-MX", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function mapPay(t: StudentHistoryPaymentType | null | undefined): ClaseAsistenciaPaymentType {
  if (t === "package" || t === "other" || t === "class") return t;
  return "class";
}

export function StudentClassHistoryList({ history, academyId, teacherId, canEditAttendancePayment = false }: Props) {
  const showAttendanceControls = academyId != null || teacherId != null;
  const canInteract =
    (academyId != null && canEditAttendancePayment) || (teacherId != null);
  const update = useUpdateClaseAsistenciaFlags(
    canInteract
      ? academyId != null
        ? { academyId }
        : { teacherId: teacherId! }
      : undefined,
  );
  const busy = update.isPending;
  const busyId = update.variables != null ? Number((update.variables as { attendanceId?: string | number }).attendanceId) : null;

  const onAttendance = (item: StudentHistoryItem, next: boolean) => {
    update.mutate({
      attendanceId: item.id,
      attended: next,
      paid: item.paid,
      paymentType: item.paid ? mapPay(item.paymentType) : null,
    });
  };

  const onPaid = (item: StudentHistoryItem) => {
    if (item.paid) {
      update.mutate({
        attendanceId: item.id,
        attended: item.attended,
        paid: false,
        paymentType: null,
      });
      return;
    }
    update.mutate({
      attendanceId: item.id,
      attended: item.attended,
      paid: true,
      paymentType: mapPay(item.paymentType),
    });
  };

  const grouped = React.useMemo(() => {
    const map = new Map<string, StudentHistoryItem[]>();
    history.forEach((row) => {
      const key = row.sessionDate || row.createdAt.split("T")[0] || "sin-fecha";
      const existing = map.get(key) || [];
      existing.push(row);
      map.set(key, existing);
    });
    return Array.from(map.entries());
  }, [history]);

  if (!history.length) {
    return (
      <div className="students-detail-empty">
        No hay historial para este alumno con los filtros actuales.
      </div>
    );
  }

  return (
    <div className="students-history-list students-history-list--flat">
      {grouped.map(([dateKey, rows]) => (
        <div key={dateKey} className="students-history-group">
          <div className="students-history-date">{formatDate(dateKey === "sin-fecha" ? null : dateKey)}</div>
          <div className="students-history-rows students-history-rows--flat">
            {rows.map((item) => {
              const pendingHere = busy && busyId === item.id;
              return (
                <div
                  key={item.id}
                  className={`students-hist-line${pendingHere ? " students-hist-line--busy" : ""}`}
                >
                  <div className="students-hist-line__title">{item.className}</div>
                  {showAttendanceControls ? (
                    <div className="students-hist-line__actions">
                      <button
                        type="button"
                        role="switch"
                        className="students-hist-toggle"
                        aria-checked={item.attended}
                        aria-label={item.attended ? "Asistió, activo" : "No asistió"}
                        disabled={!canInteract || pendingHere}
                        onClick={() => onAttendance(item, !item.attended)}
                      >
                        <span className="students-hist-toggle__track">
                          <span className="students-hist-toggle__thumb" />
                        </span>
                        <span className="students-hist-toggle__text">{item.attended ? "Sí" : "No"}</span>
                      </button>
                      <button
                        type="button"
                        className={`students-hist-pay${item.paid ? " students-hist-pay--on" : ""}`}
                        disabled={!canInteract || pendingHere}
                        onClick={() => onPaid(item)}
                        aria-pressed={item.paid}
                      >
                        {item.paid ? "Pago" : "Sin pago"}
                      </button>
                      {!canInteract && academyId != null ? (
                        <span className="students-hist-line__premium-hint">Registro en métricas: plan Premium.</span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="students-hist-line__ro">
                      <p style={{ margin: 0 }}>
                        {item.attended ? "Asistió" : "No asistió"} · {item.paid ? "Pagó" : "Sin pago"}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
