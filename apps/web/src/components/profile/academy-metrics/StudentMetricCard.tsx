import React from "react";
import { ChevronRight } from "lucide-react";
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
    });
  } catch {
    return value;
  }
}

export function StudentMetricCard({ student, selected, onSelect }: Props) {
  const recent =
    student.lastActivityAt && student.totalAttended > 0
      ? `Reciente ${formatDate(student.lastActivityAt)}`
      : null;
  return (
    <button
      type="button"
      className={`students-row--lite${selected ? " students-row--selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="students-row-main students-row-main--lite">
        <div className="students-row-top">
          <span className="students-row-name">{student.studentName}</span>
          <span className="students-row-chevron" aria-hidden>
            <ChevronRight size={20} strokeWidth={2.25} />
          </span>
        </div>
        <div className="students-row-chips" aria-label="Resumen">
          <span className="students-chip">
            {student.distinctClasses} {student.distinctClasses === 1 ? "clase" : "clases"}
          </span>
          <span className="students-chip students-chip--accent">
            {student.totalAttended} asist.
          </span>
        </div>
        {recent ? <p className="students-row-hint">{recent}</p> : null}
      </div>
    </button>
  );
}
