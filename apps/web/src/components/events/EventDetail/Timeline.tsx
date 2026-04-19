import React, { useMemo } from "react";
import { Clock } from "lucide-react";

/** Minutos desde medianoche; sin hora válida al final. */
function inicioToMinutes(s?: string | null): number {
  if (!s || typeof s !== "string") return Number.MAX_SAFE_INTEGER;
  const m = s.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return Number.MAX_SAFE_INTEGER;
  return hh * 60 + mm;
}

export interface TimelineItem {
  inicio?: string;
  fin?: string;
  titulo?: string;
  tipo?: string;
  instructor?: string;
  realizadoPor?: string;
  realizado_por?: string;
  nivel?: string;
  /** Texto libre del cronograma (ScheduleEditor) */
  descripcion?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  byLabel?: string;
  conductedByLabel?: string;
  levelLabel?: string;
}

export function Timeline({
  items,
  byLabel = "Por",
  conductedByLabel = "Conduce",
  levelLabel = "Nivel",
}: TimelineProps) {
  const sortedItems = useMemo(() => {
    if (!items?.length) return [];
    return [...items].sort(
      (a, b) => inicioToMinutes(a.inicio) - inicioToMinutes(b.inicio)
    );
  }, [items]);

  if (!sortedItems.length) return null;

  return (
    <section className="eds-timeline" aria-label="Cronograma">
      {sortedItems.map((item, i) => {
        const time =
          item.inicio && item.fin
            ? `${item.inicio} – ${item.fin}`
            : item.inicio || item.fin || "";
        const title = item.titulo || item.tipo || "";
        const parts: string[] = [];
        if (item.nivel) parts.push(`${levelLabel} ${item.nivel}`);
        if (item.instructor) parts.push(`${byLabel} ${item.instructor}`);
        if (item.realizadoPor || item.realizado_por)
          parts.push(`${conductedByLabel} ${item.realizadoPor || item.realizado_por}`);
        const subtitle = parts.join(" · ");
        const descripcion =
          typeof item.descripcion === "string" && item.descripcion.trim()
            ? item.descripcion.trim()
            : "";

        return (
          <div key={i} className="eds-timeline__row">
            <div className="eds-timeline__marker">
              <span className="eds-timeline__dot" aria-hidden />
              {i < sortedItems.length - 1 && <span className="eds-timeline__line" aria-hidden />}
            </div>
            <div className="eds-timeline__item">
              <div className="eds-timeline__content">
                {title && <strong className="eds-timeline__title">{title}</strong>}
                {subtitle && <span className="eds-timeline__subtitle">{subtitle}</span>}
                {descripcion && (
                  <p className="eds-timeline__desc">{descripcion}</p>
                )}
              </div>
              <div className="eds-timeline__time-block">
                <Clock size={18} strokeWidth={2} />
                <span className="eds-timeline__time">{time}</span>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
