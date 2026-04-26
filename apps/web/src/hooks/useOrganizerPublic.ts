import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const ORGANIZER_PUBLIC_SELECT = `
  id,
  user_id,
  nombre_publico,
  bio,
  media,
  ritmos,
  ritmos_seleccionados,
  zonas,
  faq,
  redes_sociales,
  estado_aprobacion,
  created_at,
  updated_at
`;

const isUUID = (v?: string) =>
  !!v &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export function useOrganizerPublic(routeId?: string) {
  return useQuery({
    queryKey: ["org-public", routeId ?? ""],
    enabled: !!routeId,
    staleTime: 120_000,
    gcTime: 300_000,
    queryFn: async () => {
      if (!routeId) return null;

      const trimmedId = routeId.trim();
      const numericId = /^\d+$/.test(trimmedId) ? Number(trimmedId) : null;

      if (numericId != null) {
        const { data, error } = await supabase
          .from("v_organizers_public")
          .select(ORGANIZER_PUBLIC_SELECT)
          .eq("id", numericId)
          .maybeSingle();
        if (error) throw error;
        if (data) return data;
      }

      if (isUUID(trimmedId)) {
        const { data, error } = await supabase
          .from("v_organizers_public")
          .select(ORGANIZER_PUBLIC_SELECT)
          .eq("user_id", trimmedId)
          .maybeSingle();
        if (error) throw error;
        if (data) return data;
      }

      // La vista pública desplegada no expone `slug`; consultar esa columna provoca 400.
      return null;
    },
  });
}
