import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { EventDate } from "../types/events";

/**
 * Hook para usar con Suspense
 * 
 * IMPORTANTE: Este hook asume que los datos siempre existen cuando se renderiza
 * (Suspense maneja el loading state)
 * 
 * Uso:
 * ```tsx
 * <Suspense fallback={<Skeleton />}>
 *   <EventDateContent />
 * </Suspense>
 * 
 * function EventDateContent() {
 *   const date = useEventDateSuspense(dateId); // data siempre existe
 *   return <div>{date.nombre}</div>;
 * }
 * ```
 */
export function useEventDateSuspense(dateId: number): EventDate {
  const query = useQuery<EventDate>({
    queryKey: ["event", "date", dateId],
    queryFn: async (): Promise<EventDate> => {
      console.log('[useEventDateSuspense] Fetching date with ID:', dateId);
      
      const { data, error } = await supabase
        .from("events_date")
        .select("*")
        .eq("id", dateId)
        .maybeSingle();
        
      console.log('[useEventDateSuspense] Supabase response:', { data, error });
      
      if (error) {
        console.error('[useEventDateSuspense] Supabase error:', error);
        console.error('[useEventDateSuspense] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      if (!data) {
        // En Suspense, null se considera un error (no encontrado)
        throw new Error(`Event date with ID ${dateId} not found`);
      }
      
      console.log('[useEventDateSuspense] Returning data:', data);
      return data as EventDate;
    },
    enabled: !!dateId,
    suspense: true, // Activar Suspense para esta query
    staleTime: 1000 * 60, // 1 minuto - datos frescos
  });

  // Con Suspense, data siempre existe cuando se renderiza
  return query.data!;
}

