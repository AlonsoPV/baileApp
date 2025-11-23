import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';

export type TeacherRatingValue = 'excelente' | 'muy_bueno' | 'bueno' | 'regular' | 'no_tome_clase';

export interface TeacherRating {
  id: number;
  teacher_id: number;
  user_id: string;
  overall_rating: TeacherRatingValue;
  claridad?: TeacherRatingValue | null;
  dominio_tecnico?: TeacherRatingValue | null;
  puntualidad?: TeacherRatingValue | null;
  actitud_energia?: TeacherRatingValue | null;
  ambiente_seguro?: TeacherRatingValue | null;
  created_at: string;
  updated_at: string;
}

export interface TeacherRatingStats {
  overall: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_tome_clase: number;
    total: number;
  };
  claridad: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_tome_clase: number;
    total: number;
  };
  dominio_tecnico: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_tome_clase: number;
    total: number;
  };
  puntualidad: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_tome_clase: number;
    total: number;
  };
  actitud_energia: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_tome_clase: number;
    total: number;
  };
  ambiente_seguro: {
    excelente: number;
    muy_bueno: number;
    bueno: number;
    regular: number;
    no_tome_clase: number;
    total: number;
  };
}

export interface CreateTeacherRatingInput {
  teacher_id: number;
  overall_rating: TeacherRatingValue;
  claridad?: TeacherRatingValue | null;
  dominio_tecnico?: TeacherRatingValue | null;
  puntualidad?: TeacherRatingValue | null;
  actitud_energia?: TeacherRatingValue | null;
  ambiente_seguro?: TeacherRatingValue | null;
}

// Obtener estadísticas de calificaciones de un maestro
export function useTeacherRatingStats(teacherId?: number) {
  return useQuery({
    queryKey: ['teacher-ratings-stats', teacherId],
    queryFn: async () => {
      if (!teacherId) return null;

      const { data, error } = await supabase.rpc('get_teacher_rating_average', {
        teacher_id_param: teacherId,
      });

      if (error) {
        console.error('[useTeacherRatingStats] Error:', error);
        // Si la función no existe, calcular manualmente
        return await calculateStatsManually(teacherId);
      }

      return data as TeacherRatingStats;
    },
    enabled: !!teacherId,
  });
}

// Calcular estadísticas manualmente (fallback)
async function calculateStatsManually(teacherId: number): Promise<TeacherRatingStats> {
  const { data, error } = await supabase
    .from('teacher_ratings')
    .select('*')
    .eq('teacher_id', teacherId);

  if (error) {
    console.error('[calculateStatsManually] Error:', error);
    return getEmptyStats();
  }

  const ratings = data || [];

  const stats: TeacherRatingStats = {
    overall: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_tome_clase: 0, total: 0 },
    claridad: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_tome_clase: 0, total: 0 },
    dominio_tecnico: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_tome_clase: 0, total: 0 },
    puntualidad: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_tome_clase: 0, total: 0 },
    actitud_energia: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_tome_clase: 0, total: 0 },
    ambiente_seguro: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_tome_clase: 0, total: 0 },
  };

  ratings.forEach((rating) => {
    // Overall
    if (rating.overall_rating) {
      stats.overall[rating.overall_rating as TeacherRatingValue]++;
      stats.overall.total++;
    }

    // Claridad
    if (rating.claridad) {
      stats.claridad[rating.claridad as TeacherRatingValue]++;
      stats.claridad.total++;
    }

    // Dominio técnico
    if (rating.dominio_tecnico) {
      stats.dominio_tecnico[rating.dominio_tecnico as TeacherRatingValue]++;
      stats.dominio_tecnico.total++;
    }

    // Puntualidad
    if (rating.puntualidad) {
      stats.puntualidad[rating.puntualidad as TeacherRatingValue]++;
      stats.puntualidad.total++;
    }

    // Actitud y energía
    if (rating.actitud_energia) {
      stats.actitud_energia[rating.actitud_energia as TeacherRatingValue]++;
      stats.actitud_energia.total++;
    }

    // Ambiente seguro
    if (rating.ambiente_seguro) {
      stats.ambiente_seguro[rating.ambiente_seguro as TeacherRatingValue]++;
      stats.ambiente_seguro.total++;
    }
  });

  return stats;
}

function getEmptyStats(): TeacherRatingStats {
  return {
    overall: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_tome_clase: 0, total: 0 },
    claridad: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_tome_clase: 0, total: 0 },
    dominio_tecnico: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_tome_clase: 0, total: 0 },
    puntualidad: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_tome_clase: 0, total: 0 },
    actitud_energia: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_tome_clase: 0, total: 0 },
    ambiente_seguro: { excelente: 0, muy_bueno: 0, bueno: 0, regular: 0, no_tome_clase: 0, total: 0 },
  };
}

// Obtener la calificación del usuario actual para un maestro
export function useMyTeacherRating(teacherId?: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacher-rating-mine', teacherId, user?.id],
    queryFn: async () => {
      if (!teacherId || !user?.id) return null;

      const { data, error } = await supabase
        .from('teacher_ratings')
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rating found
          return null;
        }
        console.error('[useMyTeacherRating] Error:', error);
        return null;
      }

      return data as TeacherRating;
    },
    enabled: !!teacherId && !!user?.id,
  });
}

// Crear o actualizar calificación
export function useUpsertTeacherRating() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTeacherRatingInput) => {
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const { data, error } = await supabase
        .from('teacher_ratings')
        .upsert(
          {
            ...input,
            user_id: user.id,
          },
          {
            onConflict: 'teacher_id,user_id',
          }
        )
        .select()
        .single();

      if (error) {
        console.error('[useUpsertTeacherRating] Error:', error);
        throw error;
      }

      return data as TeacherRating;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['teacher-ratings-stats', data.teacher_id] });
      queryClient.invalidateQueries({ queryKey: ['teacher-rating-mine', data.teacher_id] });
    },
  });
}

// Calcular promedio numérico de una categoría
export function calculateTeacherAverage(stats: { excelente: number; muy_bueno: number; bueno: number; regular: number; no_tome_clase: number; total: number }): number | null {
  if (stats.total === 0) return null;

  // Ponderación: Excelente=5, Muy bueno=4, Bueno=3, Regular=2, No tomé la clase=0 (no cuenta)
  const total = stats.excelente * 5 + stats.muy_bueno * 4 + stats.bueno * 3 + stats.regular * 2;
  const count = stats.excelente + stats.muy_bueno + stats.bueno + stats.regular;

  if (count === 0) return null;

  return total / count;
}

// Obtener emoji y texto de calificación
export function getTeacherRatingDisplay(rating: TeacherRatingValue): { emoji: string; label: string } {
  const map: Record<TeacherRatingValue, { emoji: string; label: string }> = {
    excelente: { emoji: '⭐', label: 'Excelente' },
    muy_bueno: { emoji: '👍', label: 'Muy bueno' },
    bueno: { emoji: '🙂', label: 'Bueno' },
    regular: { emoji: '😐', label: 'Regular' },
    no_tome_clase: { emoji: '❌', label: 'No tomé la clase' },
  };

  return map[rating];
}

