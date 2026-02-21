import React from "react";
import { Calendar, Clock } from "lucide-react";

export interface InfoCardProps {
  icon: "calendar" | "clock";
  label: string;
  value: string;
}

const IconMap = { calendar: Calendar, clock: Clock };

export function InfoCard({ icon, label, value }: InfoCardProps) {
  const Icon = IconMap[icon];
  return (
    <div className="ed-info-card">
      <div className="ed-info-card__icon">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="ed-info-card__label">{label}</div>
      <div className="ed-info-card__value">{value}</div>
    </div>
  );
}
