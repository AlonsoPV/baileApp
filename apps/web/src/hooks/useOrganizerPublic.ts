import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const ORGANIZER_PUBLIC_SELECT = `
  id,
  user_id,
  slug,
  nombre_publico,
  bio,
  avatar_url,
  logo_url,
  foto_url,
  portada_url,
  media,
  ritmos,
  estilos,
  ritmos_seleccionados,
  zonas,
  faq,
  invited_teachers,
  redes_sociales,
  respuesta_1,
  respuesta_2,
  respuesta_3,
  respuesta_4,
  respuesta_5,
  respuesta_6,
  respuestas,
  whatsapp_number,
  whatsapp_message_template,
  cuenta_bancaria,
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

      const { data, error } = await supabase
        .from("v_organizers_public")
        .select(ORGANIZER_PUBLIC_SELECT)
        .eq("slug", trimmedId)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}
