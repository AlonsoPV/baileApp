import { useState } from "react";
import { useAuth } from '@/contexts/AuthProvider';
import { useMyOrganizer } from "./useOrganizer";

export type ActiveRole = "usuario" | "organizador";
export type ProfileMode = "live" | "edit";

export function useProfileSwitch() {
  const { user } = useAuth();
  const { data: organizer } = useMyOrganizer();
  const [activeRole, setActiveRole] = useState<ActiveRole>("usuario");
  const [mode, setMode] = useState<ProfileMode>("live");

  function toggleRole() {
    if (activeRole === "usuario" && organizer) {
      setActiveRole("organizador");
    } else {
      setActiveRole("usuario");
    }
  }

  function toggleMode() {
    setMode(mode === "live" ? "edit" : "live");
  }

  function switchToRole(role: ActiveRole) {
    if (role === "organizador" && !organizer) {
      console.warn("Cannot switch to organizer: no organizer profile exists");
      return;
    }
    setActiveRole(role);
  }

  function switchToMode(newMode: ProfileMode) {
    setMode(newMode);
  }

  return {
    user,
    activeRole,
    mode,
    organizer,
    hasOrganizer: !!organizer,
    toggleRole,
    toggleMode,
    switchToRole,
    switchToMode,
  };
}
