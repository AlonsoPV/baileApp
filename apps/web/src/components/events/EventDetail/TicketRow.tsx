import React from "react";

export interface TicketRowProps {
  label: string;
  price: string | number;
  isPreventa?: boolean;
}

export function TicketRow({
  label,
  price,
  isPreventa = false,
}: TicketRowProps) {
  return (
    <div
      className={`ed-ticket-row ${isPreventa ? "ed-ticket-row--preventa" : ""}`}
    >
      <span className="ed-ticket-row__label">{label}</span>
      <span className="ed-ticket-row__price">{price}</span>
    </div>
  );
}
