import React from "react";
import type { StudentHistoryItem } from "@/hooks/useAcademyStudents";

type Props = {
  history: StudentHistoryItem[];
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

function statusLabel(status: string): string {
  const key = status.toLowerCase();
  if (key === "tentative") return "Tentativa";
  if (key === "pagado") return "Pagado";
  if (key === "asistio" || key === "asistió" || key === "attended") return "Asistió";
  if (key === "cancelado" || key === "cancelled" || key === "canceled") return "Cancelado";
  if (key === "no_show" || key === "noshow") return "No show";
  return status;
}

export function StudentClassHistoryList({ history }: Props) {
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
    <div className="students-history-list">
      {grouped.map(([dateKey, rows]) => (
        <div key={dateKey} className="students-history-group">
          <div className="students-history-date">{formatDate(dateKey === "sin-fecha" ? null : dateKey)}</div>
          <div className="students-history-rows">
            {rows.map((item) => (
              <div key={item.id} className="students-history-row">
                <div className="students-history-main">
                  <div className="students-history-class">{item.className}</div>
                  <div className="students-history-meta">
                    <span>{statusLabel(item.status)}</span>
                    <span className="dot">·</span>
                    <span>{item.role}</span>
                    {item.zone ? (
                      <>
                        <span className="dot">·</span>
                        <span>{item.zone}</span>
                      </>
                    ) : null}
                    {item.hour ? (
                      <>
                        <span className="dot">·</span>
                        <span>{item.hour}</span>
                      </>
                    ) : null}
                    {item.teacherName ? (
                      <>
                        <span className="dot">·</span>
                        <span>{item.teacherName}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="students-history-created">
                  {new Date(item.createdAt).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
