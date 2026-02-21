import React from "react";
import { LucideIcon } from "lucide-react";

export interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
}

export function SectionHeader({ icon: Icon, title }: SectionHeaderProps) {
  return (
    <div className="ed-section-header">
      <Icon className="ed-section-header__icon" size={20} strokeWidth={2} />
      <h2 className="ed-section-header__title">{title}</h2>
    </div>
  );
}
