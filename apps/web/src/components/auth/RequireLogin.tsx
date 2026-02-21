import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
};

export default function RequireLogin({ children, fallback, redirectTo = "/auth/login" }: Props) {
  const { user } = useAuth();
  const isAuthenticated = !!user?.id;
  const nav = useNavigate();
  const loc = useLocation();

  if (isAuthenticated) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <button
      onClick={() => nav(redirectTo, { state: { from: loc.pathname + loc.search } })}
      style={{
        padding: "0.9rem 1.2rem",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,.18)",
        background: "rgba(255,255,255,.08)",
        color: "#fff",
        fontWeight: 800,
        cursor: "pointer",
      }}
      aria-label="Inicia sesión para agendar"
    >
      🔒 Inicia sesión para agendar
    </button>
  );
}


