import React from "react";

export const Chip = ({
  label,
  active = false,
  onClick
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      borderRadius: 999,
      padding: "6px 12px",
      margin: 4,
      border: "1px solid",
      borderColor: active ? "#1E88E5" : "#ffffff30",
      background: active ? "#1E88E533" : "#ffffff10",
      color: "#fff",
      fontWeight: 600,
      cursor: "pointer"
    }}
  >
    {label}
  </button>
);
