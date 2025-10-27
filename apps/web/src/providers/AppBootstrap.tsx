import React from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { useOrganizerStore } from "../state/organizerStore";
import { useProfileMode } from "../state/profileMode";

export default function AppBootstrap({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const refresh = useOrganizerStore(s => s.refresh);
  const organizerId = useOrganizerStore(s => s.organizerId);
  const { role, setRole } = useProfileMode();

  // Sincroniza Auth → organizerStore
  React.useEffect(() => {
    if (!loading) {
      refresh(user?.id);
    }
  }, [loading, user?.id, refresh]);

  // Si el rol activo es organizador pero no hay organizer, fuerza a usuario (evita pantallas en blanco)
  React.useEffect(() => {
    if (!loading && role === "organizador" && !organizerId) {
      setRole("usuario");
    }
  }, [loading, role, organizerId, setRole]);

  return <>{children}</>;
}
