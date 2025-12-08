import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

/**
 * Hook para usar con Suspense - Event Parent
 * 
 * IMPORTANTE: Este hook asume que los datos siempre existen cuando se renderiza
 * (Suspense maneja el loading state)
 */
export function useEventParentSuspense(parentId: number) {
  const query = useQuery({
    queryKey: ["event", "parent", parentId, "suspense"],
    queryFn: async () => {
      if (!parentId) {
        throw new Error('No parentId provided for useEventParentSuspense');
      }
      
      let query = supabase
        .from("events_parent")
        .select("id, organizer_id, nombre, biografia, descripcion, estilos, zonas, sede_general, faq, media, ubicaciones, created_at, updated_at")
        .eq("id", parentId);
      
      const { data, error } = await query.maybeSingle();
        
      if (error) {
        // Si el error es sobre una columna faltante, intentar sin ella
        if (error.code === '42703' && error.message?.includes('ubicaciones')) {
          const { data: retryData, error: retryError } = await supabase
            .from("events_parent")
            .select("id, organizer_id, nombre, biografia, descripcion, estilos, zonas, sede_general, faq, media, created_at, updated_at")
            .eq("id", parentId)
            .maybeSingle();
          
          if (retryError) throw retryError;
          if (!retryData) {
            throw new Error(`Event parent with ID ${parentId} not found`);
          }
          return retryData;
        }
        throw error;
      }
      
      if (!data) {
        throw new Error(`Event parent with ID ${parentId} not found`);
      }
      
      return data;
    },
    enabled: !!parentId,
    suspense: true, // Activar Suspense
    staleTime: 1000 * 60, // 1 minuto
    gcTime: 1000 * 60 * 5, // 5 minutos
  });

  // Con Suspense, data siempre existe cuando se renderiza
  return query.data!;
}

