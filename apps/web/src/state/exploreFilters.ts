import { create } from "zustand";
import { userLocalStorage } from "@/storage/userScopedStorage";

export type ExploreType = "all" | "fechas" | "sociales" | "clases" | "organizadores" | "maestros" | "academias" | "marcas" | "usuarios";

export type ExploreFilters = {
  type: ExploreType;
  q: string;           // texto libre
  ritmos: number[];    // tags de tipo 'ritmo'
  zonas: number[];     // tags de tipo 'zona'
  dateFrom?: string;   // YYYY-MM-DD (solo eventos)
  dateTo?: string;     // YYYY-MM-DD (solo eventos)
  datePreset?: 'todos' | 'hoy' | 'semana' | 'siguientes';
  pageSize: number;
};

type Store = {
  filters: ExploreFilters;
  set: (patch: Partial<ExploreFilters>) => void;
  reset: () => void;
  /** Load persisted filters for a specific user (called on auth change). */
  rehydrateForUser: (userId: string) => void;
};

const STORAGE_PARTS = ["filters", "explore", "v1"] as const;

const defaultFilters: ExploreFilters = {
  type: "all",
  q: "",
  ritmos: [],
  zonas: [],
  datePreset: 'todos',
  pageSize: 12,
};

export const useExploreFilters = create<Store>((set, get) => ({
  // IMPORTANT: do NOT read unscoped storage at module init.
  // Rehydrate explicitly when userId is known.
  filters: defaultFilters,
  set: (patch) => {
    const next = { ...get().filters, ...patch };
    try {
      userLocalStorage.setItem([...STORAGE_PARTS], JSON.stringify(next));
    } catch (e) {
      console.warn('[ExploreFilters] Failed to save to localStorage:', e);
    }
    set({ filters: next });
  },
  reset: () => {
    try {
      userLocalStorage.setItem([...STORAGE_PARTS], JSON.stringify(defaultFilters));
    } catch (e) {
      console.warn('[ExploreFilters] Failed to reset localStorage:', e);
    }
    set({ filters: defaultFilters });
  },
  rehydrateForUser: (userId) => {
    try {
      const raw = userLocalStorage.getItem([...STORAGE_PARTS], userId);
      const parsed = raw ? JSON.parse(raw) : null;
      set({ filters: parsed ? { ...defaultFilters, ...parsed } : defaultFilters });
    } catch (e) {
      console.warn("[ExploreFilters] Failed to rehydrate user filters:", e);
      set({ filters: defaultFilters });
    }
  },
}));

