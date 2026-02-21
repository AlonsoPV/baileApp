import React from "react";
import { Clock } from "lucide-react";

export interface TimelineItem {
  inicio?: string;
  fin?: string;
  titulo?: string;
  tipo?: string;
  instructor?: string;
  realizadoPor?: string;
  realizado_por?: string;
  nivel?: string;
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
  if (!items || items.length === 0) return null;

  return (
    <section className="eds-timeline" aria-label="Cronograma">
      {items.map((item, i) => {
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

        return (
          <div key={i} className="eds-timeline__row">
            <div className="eds-timeline__marker">
              <span className="eds-timeline__dot" aria-hidden />
              {i < items.length - 1 && <span className="eds-timeline__line" aria-hidden />}
            </div>
            <div className="eds-timeline__item">
              <div className="eds-timeline__content">
                {title && <strong className="eds-timeline__title">{title}</strong>}
                {subtitle && <span className="eds-timeline__subtitle">{subtitle}</span>}
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
