import { create } from "zustand";

export type ActiveRole = "usuario" | "organizador";
export type ProfileMode = "live" | "edit";

type Store = {
  role: ActiveRole;
  mode: ProfileMode;
  setRole: (r: ActiveRole) => void;
  toggleRole: () => void;
  setMode: (m: ProfileMode) => void;
  toggleMode: () => void;
};

export const useProfileMode = create<Store>((set, get) => ({
  role: (localStorage.getItem("ba_role") as ActiveRole) || "usuario",
  mode: (localStorage.getItem("ba_mode") as ProfileMode) || "live",
  setRole: (r) => { 
    localStorage.setItem("ba_role", r); 
    set({ role: r }); 
  },
  toggleRole: () => {
    const next = get().role === "usuario" ? "organizador" : "usuario";
    localStorage.setItem("ba_role", next);
    set({ role: next });
  },
  setMode: (m) => { 
    localStorage.setItem("ba_mode", m); 
    set({ mode: m }); 
  },
  toggleMode: () => {
    const next = get().mode === "live" ? "edit" : "live";
    localStorage.setItem("ba_mode", next);
    set({ mode: next });
  }
}));
