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

      try {
        const { data, error } = await supabase.rpc('get_teacher_rating_average', {
          teacher_id_param: teacherId,
        });

        if (error) {
          // Error 406 = Not Acceptable (tabla/función no existe o problema de RLS)
          // Silenciar el error - puede ser que la tabla no exista aún
          if (error.message?.includes('406') || error.code === '406' || error.status === 406) {
            return getEmptyStats();
          }
          
          // Si la función no existe, calcular manualmente
          return await calculateStatsManually(teacherId);
        }

        // Si data es null o undefined, calcular manualmente
        if (!data) {
          return await calculateStatsManually(teacherId);
        }

        return data as TeacherRatingStats;
      } catch (err: any) {
        // Capturar errores de red o otros errores inesperados
        // Silenciar errores 406 (tabla no existe o problema de RLS)
        if (err?.message?.includes('406') || err?.status === 406 || err?.code === '406') {
          return getEmptyStats();
        }
        // Solo mostrar otros errores inesperados
        if (err?.status && err.status !== 406 && err?.code !== '406') {
          console.error('[useTeacherRatingStats] Error inesperado:', err);
        }
        return getEmptyStats();
      }
    },
    enabled: !!teacherId,
    retry: false, // No reintentar para evitar spam de errores
    refetchOnWindowFocus: false, // No refetch al enfocar ventana para evitar errores repetidos
    refetchOnMount: false, // No refetch al montar si ya hay datos
  });
}

// Calcular estadísticas manualmente (fallback)
async function calculateStatsManually(teacherId: number): Promise<TeacherRatingStats> {
  try {
    const { data, error } = await supabase
      .from('teacher_ratings')
      .select('*')
      .eq('teacher_id', teacherId);

    if (error) {
      // Error 406 = Not Acceptable (tabla no existe o problema de RLS)
      // Silenciar el error - puede ser que la tabla no exista aún
      if (error.message?.includes('406') || error.code === '406' || error.status === 406) {
        return getEmptyStats();
      }
      // Solo mostrar otros errores inesperados
      if (error.code && error.code !== '406') {
        console.error('[calculateStatsManually] Error:', error);
      }
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

  ratings.forEach((rating: any) => {
    // Overall
    if (rating.overall_rating && typeof rating.overall_rating === 'string') {
      const ratingValue = rating.overall_rating as TeacherRatingValue;
      if (stats.overall.hasOwnProperty(ratingValue)) {
        stats.overall[ratingValue]++;
        stats.overall.total++;
      }
    }

    // Claridad
    if (rating.claridad && typeof rating.claridad === 'string') {
      const ratingValue = rating.claridad as TeacherRatingValue;
      if (stats.claridad.hasOwnProperty(ratingValue)) {
        stats.claridad[ratingValue]++;
        stats.claridad.total++;
      }
    }

    // Dominio técnico
    if (rating.dominio_tecnico && typeof rating.dominio_tecnico === 'string') {
      const ratingValue = rating.dominio_tecnico as TeacherRatingValue;
      if (stats.dominio_tecnico.hasOwnProperty(ratingValue)) {
        stats.dominio_tecnico[ratingValue]++;
        stats.dominio_tecnico.total++;
      }
    }

    // Puntualidad
    if (rating.puntualidad && typeof rating.puntualidad === 'string') {
      const ratingValue = rating.puntualidad as TeacherRatingValue;
      if (stats.puntualidad.hasOwnProperty(ratingValue)) {
        stats.puntualidad[ratingValue]++;
        stats.puntualidad.total++;
      }
    }

    // Actitud y energía
    if (rating.actitud_energia && typeof rating.actitud_energia === 'string') {
      const ratingValue = rating.actitud_energia as TeacherRatingValue;
      if (stats.actitud_energia.hasOwnProperty(ratingValue)) {
        stats.actitud_energia[ratingValue]++;
        stats.actitud_energia.total++;
      }
    }

    // Ambiente seguro
    if (rating.ambiente_seguro && typeof rating.ambiente_seguro === 'string') {
      const ratingValue = rating.ambiente_seguro as TeacherRatingValue;
      if (stats.ambiente_seguro.hasOwnProperty(ratingValue)) {
        stats.ambiente_seguro[ratingValue]++;
        stats.ambiente_seguro.total++;
      }
    }
  });

    return stats;
  } catch (err: any) {
    // Capturar errores de red o otros errores inesperados
    // Silenciar errores 406 (tabla no existe o problema de RLS)
    if (err?.message?.includes('406') || err?.status === 406 || err?.code === '406') {
      return getEmptyStats();
    }
    // Solo mostrar otros errores inesperados
    if (err?.status && err.status !== 406 && err?.code !== '406') {
      console.error('[calculateStatsManually] Error inesperado:', err);
    }
    return getEmptyStats();
  }
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

      try {
        const { data, error } = await supabase
          .from('teacher_ratings')
          .select('*')
          .eq('teacher_id', teacherId)
          .eq('user_id', user.id)
          .single();

        if (error) {
          // PGRST116 = No rows found (esperado)
          if (error.code === 'PGRST116') {
            return null;
          }
          
          // Error 406 = Not Acceptable (tabla no existe o problema de RLS)
          // Silenciar el error - puede ser que la tabla no exista aún
          if (error.message?.includes('406') || error.code === '406' || error.status === 406) {
            return null;
          }
          
          // Solo mostrar otros errores inesperados
          if (error.code && !['PGRST116', '406'].includes(error.code)) {
            console.error('[useMyTeacherRating] Error inesperado:', error);
          }
          return null;
        }

        return data as TeacherRating;
      } catch (err: any) {
        // Capturar errores de red o otros errores inesperados
        // Silenciar errores 406 (tabla no existe o problema de RLS)
        if (err?.message?.includes('406') || err?.status === 406 || err?.code === '406') {
          return null;
        }
        // Solo mostrar otros errores inesperados
        if (err?.status && err.status !== 406 && err?.code !== '406') {
          console.error('[useMyTeacherRating] Error inesperado:', err);
        }
        return null;
      }
    },
    enabled: !!teacherId && !!user?.id,
    retry: false, // No reintentar para evitar spam de errores
    refetchOnWindowFocus: false, // No refetch al enfocar ventana para evitar errores repetidos
    refetchOnMount: false, // No refetch al montar si ya hay datos
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

