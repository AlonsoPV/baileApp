import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';

export type EventParentRatingValue = 'excelente' | 'muy_bueno' | 'bueno' | 'regular' | 'no_asisti';

export interface EventParentRating {
  id: number;
  event_parent_id: number;
  user_id: string;
  overall_rating: EventParentRatingValue;
  ambiente_general?: EventParentRatingValue | null;
  seleccion_musical?: EventParentRatingValue | null;
  organizacion?: EventParentRatingValue | null;
  comodidad_espacio?: EventParentRatingValue | null;
  probabilidad_asistir?: EventParentRatingValue | null;
  created_at: string;
  updated_at: string;
}

export interface EventParentRatingStats {
  overall: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_asisti: number;
    total: number;
  };
  ambiente_general: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_asisti: number;
    total: number;
  };
  seleccion_musical: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_asisti: number;
    total: number;
  };
  organizacion: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_asisti: number;
    total: number;
  };
  comodidad_espacio: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_asisti: number;
    total: number;
  };
  probabilidad_asistir: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_asisti: number;
    total: number;
  };
}

export interface CreateEventParentRatingInput {
  event_parent_id: number;
  overall_rating: EventParentRatingValue;
  ambiente_general?: EventParentRatingValue | null;
  seleccion_musical?: EventParentRatingValue | null;
  organizacion?: EventParentRatingValue | null;
  comodidad_espacio?: EventParentRatingValue | null;
  probabilidad_asistir?: EventParentRatingValue | null;
}

// Obtener estadísticas de calificaciones de un evento padre
export function useEventParentRatingStats(eventParentId?: number) {
  return useQuery({
    queryKey: ['event-parent-ratings-stats', eventParentId],
    queryFn: async () => {
      if (!eventParentId) return null;

      const { data, error } = await supabase.rpc('get_event_parent_rating_average', {
        event_parent_id_param: eventParentId,
      });

      if (error) {
        console.error('[useEventParentRatingStats] Error:', error);
        // Si la función no existe, calcular manualmente
        return await calculateStatsManually(eventParentId);
      }

      return data as EventParentRatingStats;
    },
    enabled: !!eventParentId,
  });
}

// Calcular estadísticas manualmente (fallback)
async function calculateStatsManually(eventParentId: number): Promise<EventParentRatingStats> {
  const { data, error } = await supabase
    .from('event_parent_ratings')
    .select('*')
    .eq('event_parent_id', eventParentId);

  if (error) {
    console.error('[calculateStatsManually] Error:', error);
    return getEmptyStats();
  }

  const ratings = data || [];

  const stats: EventParentRatingStats = {
    overall: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_asisti: 0, total: 0 },
    ambiente_general: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_asisti: 0, total: 0 },
    seleccion_musical: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_asisti: 0, total: 0 },
    organizacion: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_asisti: 0, total: 0 },
    comodidad_espacio: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_asisti: 0, total: 0 },
    probabilidad_asistir: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_asisti: 0, total: 0 },
  };

  ratings.forEach((rating) => {
    // Overall
    if (rating.overall_rating) {
      stats.overall[rating.overall_rating as EventParentRatingValue]++;
      stats.overall.total++;
    }

    // Ambiente general
    if (rating.ambiente_general) {
      stats.ambiente_general[rating.ambiente_general as EventParentRatingValue]++;
      stats.ambiente_general.total++;
    }

    // Selección musical
    if (rating.seleccion_musical) {
      stats.seleccion_musical[rating.seleccion_musical as EventParentRatingValue]++;
      stats.seleccion_musical.total++;
    }

    // Organización
    if (rating.organizacion) {
      stats.organizacion[rating.organizacion as EventParentRatingValue]++;
      stats.organizacion.total++;
    }

    // Comodidad del espacio
    if (rating.comodidad_espacio) {
      stats.comodidad_espacio[rating.comodidad_espacio as EventParentRatingValue]++;
      stats.comodidad_espacio.total++;
    }

    // Probabilidad de asistir
    if (rating.probabilidad_asistir) {
      stats.probabilidad_asistir[rating.probabilidad_asistir as EventParentRatingValue]++;
      stats.probabilidad_asistir.total++;
    }
  });

  return stats;
}

function getEmptyStats(): EventParentRatingStats {
  return {
    overall: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_asisti: 0, total: 0 },
    ambiente_general: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_asisti: 0, total: 0 },
    seleccion_musical: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_asisti: 0, total: 0 },
    organizacion: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_asisti: 0, total: 0 },
    comodidad_espacio: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_asisti: 0, total: 0 },
    probabilidad_asistir: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_asisti: 0, total: 0 },
  };
}

// Obtener la calificación del usuario actual para un evento padre
export function useMyEventParentRating(eventParentId?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['event-parent-rating-mine', eventParentId, user?.id],
    queryFn: async () => {
      if (!eventParentId || !user?.id) return null;

      const { data, error } = await supabase
        .from('event_parent_ratings')
        .select('*')
        .eq('event_parent_id', eventParentId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rating found
          return null;
        }
        console.error('[useMyEventParentRating] Error:', error);
        return null;
      }

      return data as EventParentRating;
    },
    enabled: !!eventParentId && !!user?.id,
  });
}

// Crear o actualizar calificación
export function useUpsertEventParentRating() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEventParentRatingInput) => {
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('event_parent_ratings')
        .upsert(
          {
            ...input,
            user_id: user.id,
          },
          {
            onConflict: 'event_parent_id,user_id',
          }
        )
        .select()
        .single();

      if (error) {
        console.error('[useUpsertEventParentRating] Error:', error);
        throw error;
      }

      return data as EventParentRating;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['event-parent-ratings-stats', data.event_parent_id] });
      queryClient.invalidateQueries({ queryKey: ['event-parent-rating-mine', data.event_parent_id] });
    },
  });
}

// Calcular promedio numérico de una categoría
export function calculateEventParentAverage(stats: { excelente: number; muy_bueno: number; bueno: number; regular: number; no_asisti: number; total: number }): number | null {
  if (stats.total === 0) return null;

  // Ponderación: Excelente=5, Muy bueno=4, Bueno=3, Regular=2, No asistí=0 (no cuenta)
  const total = stats.excelente * 5 + stats.muy_bueno * 4 + stats.bueno * 3 + stats.regular * 2;
  const count = stats.excelente + stats.muy_bueno + stats.bueno + stats.regular;

  if (count === 0) return null;

  return total / count;
}

// Obtener emoji y texto de calificación
export function getEventParentRatingDisplay(rating: EventParentRatingValue): { emoji: string; label: string } {
  const map: Record<EventParentRatingValue, { emoji: string; label: string }> = {
    excelente: { emoji: '⭐', label: 'Excelente' },
    muy_bueno: { emoji: '👍', label: 'Muy bueno' },
    bueno: { emoji: '🙂', label: 'Bueno' },
    regular: { emoji: '😐', label: 'Regular' },
    no_asisti: { emoji: '❌', label: 'No asistí' },
  };

  return map[rating];
}

