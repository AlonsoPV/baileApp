import { create } from "zustand";

export type ExploreType = "all" | "fechas" | "sociales" | "clases" | "organizadores" | "maestros" | "academias" | "marcas" | "usuarios";

export type ExploreFilters = {
  type: ExploreType;
  q: string;           // texto libre
  ritmos: number[];    // tags de tipo 'ritmo'
  zonas: number[];     // tags de tipo 'zona'
  dateFrom?: string;   // YYYY-MM-DD (solo eventos)
  dateTo?: string;     // YYYY-MM-DD (solo eventos)
  pageSize: number;
};

type Store = {
  filters: ExploreFilters;
  set: (patch: Partial<ExploreFilters>) => void;
  reset: () => void;
};

const KEY = "ba_explore_filters_v1";

const defaultFilters: ExploreFilters = {
  type: "all",
  q: "",
  ritmos: [],
  zonas: [],
  pageSize: 12,
};

export const useExploreFilters = create<Store>((set, get) => ({
  filters: (() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...defaultFilters, ...JSON.parse(raw) } : defaultFilters;
    } catch {
      return defaultFilters;
    }
  })(),
  set: (patch) => {
    const next = { ...get().filters, ...patch };
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[ExploreFilters] Failed to save to localStorage:', e);
    }
    set({ filters: next });
  },
  reset: () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(defaultFilters));
    } catch (e) {
      console.warn('[ExploreFilters] Failed to reset localStorage:', e);
    }
    set({ filters: defaultFilters });
  },
}));

