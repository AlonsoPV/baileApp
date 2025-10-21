import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export const Button: React.FC<Props> = ({ children, style, ...rest }) => (
  <button
    {...rest}
    style={{
      border: 0,
      borderRadius: 16,
      padding: "12px 16px",
      fontWeight: 800,
      color: "#fff",
      cursor: "pointer",
      background: "linear-gradient(135deg,#E53935 0%,#FB8C00 45%,#1E88E5 100%)",
      boxShadow: "0 8px 24px rgba(0,0,0,.25)",
      ...((style as React.CSSProperties) || {})
    }}
  >
    {children}
  </button>
);
