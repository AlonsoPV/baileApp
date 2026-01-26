/**
 * Estado global para borradores persistentes
 * Permite guardar y recuperar borradores de formularios en localStorage
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createUserScopedZustandStorage } from "@/storage/userScopedStorage";

type DraftRecord = { 
  value: any; 
  updatedAt: number;
};

interface DraftsState {
  drafts: Record<string, DraftRecord | undefined>;
  setDraft: (key: string, value: any) => void;
  getDraft: (key: string) => DraftRecord | undefined;
  clearDraft: (key: string) => void;
  clearAll: () => void;
}

export const useDrafts = create<DraftsState>()(
  persist(
    (set, get) => ({
      drafts: {} as Record<string, DraftRecord | undefined>,
      
      setDraft: (key: string, value: any) => 
        set((s: any) => ({
          drafts: {
            ...s.drafts,
            [key]: { value, updatedAt: Date.now() }
          }
        })),
      
      getDraft: (key: string) => 
        get().drafts[key],
      
      clearDraft: (key: string) => 
        set((s: any) => {
          const d = { ...s.drafts };
          delete d[key];
          return { drafts: d };
        }),
      
      clearAll: () => 
        set({ drafts: {} })
    }),
    { 
      name: "baileapp:drafts:v1", 
      storage: createJSONStorage(() => createUserScopedZustandStorage(localStorage))
    }
  )
);