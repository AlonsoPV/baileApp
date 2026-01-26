import { create } from "zustand";
import { userLocalStorage } from "@/storage/userScopedStorage";

export type ProfileMode = "usuario" | "organizador" | "maestro" | "academia" | "marca";

type Store = {
  mode: ProfileMode;
  setMode: (m: ProfileMode) => void;
  rehydrateForUser: (userId: string) => void;
};

export const useProfileMode = create<Store>((set) => ({
  // IMPORTANT: do NOT read unscoped storage at module init.
  mode: "usuario",
  setMode: (m) => {
    try {
      userLocalStorage.setItem(["profile_mode", "v1"], m);
    } catch {
      // ignore (no active user yet)
    }
    set({ mode: m });
  },
  rehydrateForUser: (userId) => {
    try {
      const raw = userLocalStorage.getItem(["profile_mode", "v1"], userId) as ProfileMode | null;
      const next =
        raw === "usuario" || raw === "organizador" || raw === "maestro" || raw === "academia" || raw === "marca"
          ? raw
          : "usuario";
      set({ mode: next });
    } catch {
      set({ mode: "usuario" });
    }
  },
}));
