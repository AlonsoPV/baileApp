import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Registro de un borrador
 */
type DraftRecord = {
  value: any;
  updatedAt: number;  // Timestamp en ms
};

/**
 * Store de borradores
 */
type DraftStore = {
  drafts: Record<string, DraftRecord | undefined>;
  setDraft: (key: string, value: any) => void;
  getDraft: (key: string) => DraftRecord | undefined;
  clearDraft: (key: string) => void;
  clearAll: () => void;
};

/**
 * Store global de borradores persistentes
 * 
 * Claves recomendadas:
 * - draft:user:profile - Perfil de usuario
 * - draft:org:{organizerId} - Perfil de organizador
 * - draft:eventParent:{parentId} - Evento padre
 * - draft:eventDate:{dateId} - Fecha de evento
 */
export const useDrafts = create<DraftStore>()(
  persist(
    (set, get) => ({
      drafts: {},
      
      /**
       * Guarda un borrador
       */
      setDraft: (key, value) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [key]: { value, updatedAt: Date.now() },
          },
        })),
      
      /**
       * Obtiene un borrador
       */
      getDraft: (key) => get().drafts[key],
      
      /**
       * Elimina un borrador específico
       */
      clearDraft: (key) =>
        set((s) => {
          const next = { ...s.drafts };
          delete next[key];
          return { drafts: next };
        }),
      
      /**
       * Elimina todos los borradores
       */
      clearAll: () => set({ drafts: {} }),
    }),
    {
      name: "baileapp:drafts:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
