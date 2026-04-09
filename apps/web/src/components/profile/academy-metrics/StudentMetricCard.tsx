import React from "react";
import type { StudentListItem } from "@/hooks/useAcademyStudents";

type Props = {
  student: StudentListItem;
  selected?: boolean;
  onSelect: () => void;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export function StudentMetricCard({ student, selected, onSelect }: Props) {
  const roleLabel =
    student.primaryRole === "leader"
      ? "Lead"
      : student.primaryRole === "follower"
      ? "Follow"
      : student.primaryRole === "ambos"
      ? "Ambos"
      : "Otro";

  return (
    <button
      type="button"
      className={`students-row${selected ? " selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="students-row-main">
        <div className="students-row-name">{student.studentName}</div>
        <div className="students-row-meta">
          <span>{roleLabel}</span>
          <span className="dot">·</span>
          <span>{student.primaryZone || "Sin zona"}</span>
          {student.lastClassName ? (
            <>
              <span className="dot">·</span>
              <span>{student.lastClassName}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="students-row-kpis">
        <div className="students-row-kpi">
          <span>Asistencias</span>
          <strong>{student.totalAttended}</strong>
        </div>
        <div className="students-row-kpi">
          <span>Reservas</span>
          <strong>{student.totalTentative}</strong>
        </div>
        <div className="students-row-kpi">
          <span>Compras</span>
          <strong>{student.totalPaid}</strong>
        </div>
      </div>

      <div className="students-row-dates">
        <span>Primera: {formatDate(student.firstActivityAt)}</span>
        <span>Última: {formatDate(student.lastActivityAt)}</span>
      </div>
    </button>
  );
}
