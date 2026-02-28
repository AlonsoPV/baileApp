import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { EventDate } from "../types/events";
import { perfLog } from "../utils/perfLog";
import { SELECT_EVENTS_DETAIL } from "@/lib/eventSelects";

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
  if (!dateId) {
    // En modo Suspense, un id inválido es un error de programación / navegación
    throw new Error('No dateId provided for useEventDateSuspense');
  }

  const query = useSuspenseQuery<EventDate>({
    queryKey: ["event", "date", dateId],
    queryFn: async (): Promise<EventDate> => {
      const start = performance.now();
      const { data, error } = await supabase
        .from("events_date")
        .select(SELECT_EVENTS_DETAIL)
        .eq("id", dateId)
        .maybeSingle();
      const end = performance.now();
      perfLog({ hook: 'useEventDateSuspense', step: 'events_date_by_id', duration_ms: end - start, rows: data ? 1 : 0, data, error, extra: { dateId } });
      
      if (error) {
        console.error('[useEventDateSuspense] Supabase error:', error);
        throw error;
      }
      
      if (!data) {
        // En Suspense, null se considera un error (no encontrado)
        throw new Error(`Event date with ID ${dateId} not found`);
      }
      
      return data as EventDate;
    },
    staleTime: 1000 * 60, // 1 minuto - datos frescos
  });

  // Con Suspense, data siempre existe cuando se renderiza
  return query.data;
}

