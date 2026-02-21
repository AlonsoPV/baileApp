import React from "react";

export interface TimelineItemProps {
  time: string;
  title: string;
  subtitle?: string;
}

export function TimelineItem({ time, title, subtitle }: TimelineItemProps) {
  return (
    <div className="ed-timeline-item">
      <div className="ed-timeline-item__dot" aria-hidden />
      <div className="ed-timeline-item__time">{time}</div>
      <div className="ed-timeline-item__title">{title}</div>
      {subtitle && <div className="ed-timeline-item__meta">{subtitle}</div>}
    </div>
  );
}
