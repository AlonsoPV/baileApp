import React from "react";
import { ChevronDown } from "lucide-react";
import "./ClasesLiveTabs.css";

export type ClasesLiveDayHeaderProps = {
  dayLabel: string;
  dateSubline?: string | null;
  countLabel: string;
  expanded: boolean;
  onToggle: () => void;
};

/**
 * Section header for one weekday group: primary day name, optional date hint, compact count pill, chevron.
 */
export function ClasesLiveDayHeader({
  dayLabel,
  dateSubline,
  countLabel,
  expanded,
  onToggle,
}: ClasesLiveDayHeaderProps) {
  return (
    <button
      type="button"
      className={`clt-day-header${expanded ? " clt-day-header--open" : ""}`}
      onClick={onToggle}
      aria-expanded={expanded}
    >
      <div className="clt-day-header__text">
        <span className="clt-day-header__name">{dayLabel}</span>
        {dateSubline ? <span className="clt-day-header__date">{dateSubline}</span> : null}
      </div>
      <div className="clt-day-header__right">
        <span className="clt-day-header__badge">{countLabel}</span>
        <ChevronDown className="clt-day-header__chev" aria-hidden size={20} strokeWidth={2.25} />
      </div>
    </button>
  );
}
