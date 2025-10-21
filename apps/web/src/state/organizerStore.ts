import { create } from "zustand";
import { supabase } from "../lib/supabase";

type OrganizerState = {
  organizerId?: number | null;
  loading: boolean;
  error?: string | null;
  refresh: (userId?: string | null) => Promise<void>;
  clear: () => void;
};

export const useOrganizerStore = create<OrganizerState>((set) => ({
  organizerId: null,
  loading: false,
  error: null,
  refresh: async (userId) => {
    if (!userId) { 
      set({ organizerId: null, loading: false }); 
      return; 
    }
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from("profiles_organizer")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) { 
      set({ error: error.message, loading: false }); 
      return; 
    }
    set({ organizerId: data?.id ?? null, loading: false });
  },
  clear: () => set({ organizerId: null, loading: false, error: null }),
}));
