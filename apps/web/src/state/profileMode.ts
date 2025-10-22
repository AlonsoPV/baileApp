import { create } from "zustand";

export type ProfileMode = "usuario" | "organizador" | "maestro" | "academia" | "marca";

type Store = {
  mode: ProfileMode;
  setMode: (m: ProfileMode) => void;
};

export const useProfileMode = create<Store>((set) => ({
  mode: (localStorage.getItem("ba_profile_mode") as ProfileMode) || "usuario",
  setMode: (m) => {
    localStorage.setItem("ba_profile_mode", m);
    set({ mode: m });
  },
}));
